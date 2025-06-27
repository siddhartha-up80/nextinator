import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { notesIndex } from "@/lib/db/pinecone";
import { getEmbeddings } from "@/lib/gemini-embeddings";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

// Rate limiting map to track user requests
const userRequestMap = new Map<
  string,
  { lastRequest: number; requestCount: number }
>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute per user
const MIN_REQUEST_INTERVAL = 1000; // Minimum 1 second between requests

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const userStats = userRequestMap.get(userId);

  if (!userStats) {
    userRequestMap.set(userId, { lastRequest: now, requestCount: 1 });
    return false;
  }

  // Check if too frequent (less than 1 second since last request)
  if (now - userStats.lastRequest < MIN_REQUEST_INTERVAL) {
    return true;
  }

  // Reset count if window has passed
  if (now - userStats.lastRequest > RATE_LIMIT_WINDOW) {
    userRequestMap.set(userId, { lastRequest: now, requestCount: 1 });
    return false;
  }

  // Check if user has exceeded the request limit
  if (userStats.requestCount >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  // Update the request stats
  userStats.lastRequest = now;
  userStats.requestCount += 1;
  userRequestMap.set(userId, userStats);

  return false;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check rate limiting
    if (isRateLimited(userId)) {
      return NextResponse.json(
        {
          error:
            "Rate limit exceeded. Please wait before making another request.",
          retryAfter: 1000, // milliseconds
        },
        { status: 429 }
      );
    }

    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Generate embedding for the query
    const queryEmbedding = await getEmbeddings(query);

    // Search for similar notes in Pinecone
    const searchResults = await notesIndex.query({
      vector: queryEmbedding,
      filter: {
        userId: userId,
      },
      topK: 20,
      includeMetadata: true,
    });

    // Extract relevant notes from search results
    const relevantNotes =
      searchResults.matches
        ?.filter((match) => (match.score ?? 0) > 0.4) // Only include high similarity scores
        .map((match) => ({
          title: match.metadata?.title || "Untitled",
          content: match.metadata?.content || "",
          score: match.score,
          createdAt: match.metadata?.createdAt,
          groupName: match.metadata?.groupName || null,
        })) || [];

    if (relevantNotes.length === 0) {
      return NextResponse.json({
        tasks: [
          {
            task: "No actionable tasks found in your notes",
            priority: "info",
            source: "system",
            insights:
              "Try adding notes about personal tasks, appointments, deadlines, or reminders. Academic and study materials are filtered out.",
            category: "system",
          },
        ],
      });
    }

    // Prepare context for AI analysis
    const notesContext = relevantNotes
      .map(
        (note, index) =>
          `Note ${index + 1}:\nTitle: ${note.title}\nContent: ${
            note.content
          }\nCreated: ${note.createdAt}\nGroup: ${note.groupName || "None"}\n`
      )
      .join("\n---\n");

    console.log("Notes context for AI analysis:", notesContext);

    // Use AI to analyze notes and extract intelligent tasks
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
    });

    const systemPrompt = `You are an intelligent task assistant. Analyze the user's notes and extract actionable tasks, deadlines, and priorities.

IMPORTANT: IGNORE academic content, study notes, course materials, research papers, educational content, professional training materials, or any content that appears to be for learning/study purposes. Focus ONLY on actionable tasks and personal reminders.

Based on the user's query: "${query}" and their notes below, identify:
1. Personal tasks and deadlines (appointments, errands, personal projects)
2. Work-related action items (meetings, deliverables, follow-ups)
3. Important personal reminders (birthdays, bills, maintenance)
4. Household or life management tasks
5. Health and wellness reminders

EXCLUDE:
- Academic notes, study materials, course content
- Research papers, educational summaries
- Professional training or certification materials
- Theoretical concepts or learning notes
- Technical documentation for study purposes

Return a JSON array of tasks with this structure:
{
  "tasks": [
    {
      "task": "Brief, actionable task description",
      "priority": "high|medium|low",
      "dueDate": "estimated due date if mentioned or null",
      "source": "which note this came from (title)",
      "insights": "additional context or suggestions",
      "category": "personal|work|appointment|deadline|reminder|project"
    }
  ]
}

Make the tasks specific, actionable, and prioritized. Focus on practical life management, not academic or educational content. If all notes appear to be academic/study materials, return an empty tasks array.

User's Notes:
${notesContext}`;

    const { text } = await generateText({
      model: google("gemini-1.5-pro"),
      prompt: systemPrompt,
      maxTokens: 1500,
    });

    // Parse the AI response
    let aiResponse;
    try {
      // Extract JSON from the response (in case it's wrapped in markdown or text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : text;
      aiResponse = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);

      // Fallback: create tasks from note titles if AI parsing fails
      aiResponse = {
        tasks: relevantNotes
          .slice(0, 3)
          .filter((note) => {
            // Simple filter to avoid obvious academic content
            const content = (note.title + " " + note.content).toLowerCase();
            const academicKeywords = [
              "study",
              "course",
              "lecture",
              "exam",
              "research",
              "paper",
              "thesis",
              "assignment",
              "homework",
              "chapter",
              "textbook",
            ];
            return !academicKeywords.some((keyword) =>
              content.includes(keyword)
            );
          })
          .map((note) => ({
            task: `Review and follow up on: ${note.title}`,
            priority: "medium",
            dueDate: null,
            source: note.title,
            insights:
              "Extracted from your notes - please review for actionable items",
            category: "review",
          })),
      };
    }

    return NextResponse.json({
      tasks: aiResponse.tasks || [],
      notesAnalyzed: relevantNotes.length,
      searchQuery: query,
    });
  } catch (error) {
    console.error("Error in intelligent tasks API:", error);
    return NextResponse.json(
      { error: "Failed to generate intelligent tasks" },
      { status: 500 }
    );
  }
}
