import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db/prisma";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

const model = google("gemini-1.5-pro-latest");

export const maxDuration = 30;
export const dynamic = "force-dynamic";

// In-memory cache for generated questions (per user)
const questionCache = new Map<string, {
  questions: string[];
  timestamp: number;
  notesCount: number;
}>();

// Rate limiting: 5 minutes between new question generations
const RATE_LIMIT_MINUTES = 5;
const RATE_LIMIT_MS = RATE_LIMIT_MINUTES * 60 * 1000;

export async function GET(request: Request): Promise<Response> {
  let userId: string | null = null;
  
  try {
    console.log("🎯 Generate questions API called");

    const auth_result = await auth();
    userId = auth_result.userId;

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check for force refresh parameter
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('force') === 'true';

    // Check if we have cached questions for this user
    const cached = questionCache.get(userId);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < RATE_LIMIT_MS && !forceRefresh) {
      console.log(`🎯 Returning cached questions (${Math.round((RATE_LIMIT_MS - (now - cached.timestamp)) / 1000 / 60)} minutes remaining)`);
      return Response.json({
        questions: cached.questions,
        notesCount: cached.notesCount,
        cached: true,
        nextRefreshIn: Math.round((RATE_LIMIT_MS - (now - cached.timestamp)) / 1000),
      });
    }

    if (forceRefresh) {
      console.log("🎯 Force refresh requested, generating new questions");
    }

    // Get a random sample of user's notes (limit to 10 for performance)
    const totalNotes = await prisma.note.count({ where: { userId } });
    
    if (totalNotes === 0) {
      // Return default questions if user has no notes
      const defaultQuestions = [
        "Upload your data and ask me to customize it for specific roles",
        "Add your notes or data and get help with technical questions",
        "Upload study materials and ask for practice questions",
        "Add meeting notes and get summaries or action items",
        "Upload research papers and ask for key insights",
        "Upload your resume and get interview preparation help",
        "Add project documentation and create behavioral interview responses",
        "Upload job descriptions and get tailored application advice",
        "Add course materials and generate study questions",
        "Upload work documents and extract actionable insights"
      ];
      
      // Cache default questions too
      questionCache.set(userId, {
        questions: defaultQuestions,
        timestamp: now,
        notesCount: 0,
      });
      
      return Response.json({
        questions: defaultQuestions,
        notesCount: 0,
        cached: false,
        nextRefreshIn: RATE_LIMIT_MS / 1000,
      });
    }

    // Get random notes (up to 8 notes to generate diverse questions)
    const randomNotes = await prisma.note.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        content: true,
        group: {
          select: {
            name: true
          }
        }
      },
      take: 8,
      skip: Math.floor(Math.random() * Math.max(0, totalNotes - 8)),
    });

    console.log(`🎯 Found ${randomNotes.length} notes to generate questions from`);

    // Prepare context for AI
    const notesContext = randomNotes
      .map((note, index) => {
        const groupInfo = note.group ? ` (Group: ${note.group.name})` : "";
        const contentPreview = note.content 
          ? note.content.substring(0, 500) + (note.content.length > 500 ? "..." : "")
          : "";
        return `Note ${index + 1}: "${note.title}"${groupInfo}\nContent: ${contentPreview}`;
      })
      .join("\n\n");

    // Generate questions using AI
    const prompt = `Based on the following user's notes, generate 10 diverse and engaging questions that would showcase how an AI assistant can help with their data. The questions should be:

1. Specific to the content in their notes
2. Practical and useful
3. Varied in type (analysis, summarization, comparison, application, interview preparation, etc.)
4. Encourage users to interact with their data
5. Keep each question under 15 words
6. Include 3-4 interview-style questions if the content relates to professional/career topics

Notes:
${notesContext}

Generate exactly 10 questions as a JSON array of strings. Focus on what users would actually want to ask about their data. Include these question types:

General Analysis:
- "Summarize key points from [specific topic]"
- "Compare [topic A] with [topic B]"
- "What are the main insights from [document type]?"
- "Extract action items from [meeting/project notes]"
- "Explain [technical concept] in simple terms"

Interview Preparation (if applicable):
- "Help me prepare interview answers based on my experience"
- "Generate interview questions for [role/field] based on my background"
- "What are my key strengths according to my notes?"
- "Create behavioral interview responses from my project examples"

Return only the JSON array, no additional text.`;

    console.log("🎯 Generating questions with AI...");
    
    const result = await generateText({
      model,
      prompt,
      maxTokens: 800,
      temperature: 0.7, // Add some creativity
    });

    console.log("🎯 AI Response:", result.text);

    // Parse the AI response
    let questions: string[];
    try {
      questions = JSON.parse(result.text);
      
      // Validate that we got an array of strings
      if (!Array.isArray(questions) || questions.some(q => typeof q !== 'string')) {
        throw new Error("Invalid format");
      }
      
      // Ensure we have up to 10 questions
      questions = questions.slice(0, 10);
      
    } catch (parseError) {
      console.error("🎯 Failed to parse AI response:", parseError);
      
      // Fallback to extracting questions manually if JSON parsing fails
      const lines = result.text.split('\n').filter(line => 
        line.trim() && 
        (line.includes('"') || line.includes('•') || line.includes('-'))
      );
      
      questions = lines
        .map(line => line.replace(/["\[\]•\-]/g, '').trim())
        .filter(line => line.length > 10 && line.length < 100)
        .slice(0, 10);
        
      if (questions.length === 0) {
        // Ultimate fallback with generic but relevant questions
        questions = [
          "Summarize the main points from my notes",
          "Find connections between different topics",
          "Help me create a study guide",
          "Extract key insights from my documents",
          "Generate questions to test my knowledge",
          "Explain complex concepts in simple terms",
          "Help me prepare interview answers based on my experience",
          "What are my key strengths according to my notes?",
          "Create behavioral interview responses from my examples",
          "Generate practice questions for job interviews"
        ];
      }
    }

    console.log(`🎯 Generated ${questions.length} questions`);

    // Cache the generated questions
    questionCache.set(userId, {
      questions,
      timestamp: now,
      notesCount: totalNotes,
    });

    return Response.json({
      questions,
      notesCount: totalNotes,
      cached: false,
      nextRefreshIn: RATE_LIMIT_MS / 1000,
    });

  } catch (error) {
    console.error("🎯 Error generating questions:", error);
    
    // Try to return cached questions if available, even on error
    if (userId) {
      const cached = questionCache.get(userId);
      if (cached) {
        console.log("🎯 Returning cached questions due to error");
        return Response.json({
          questions: cached.questions,
          notesCount: cached.notesCount,
          cached: true,
          error: "Using cached questions due to processing error"
        });
      }
    }
    
    // Return fallback questions in case of any error
    return Response.json({
      questions: [
        "Summarize key points from my uploaded documents",
        "Help me find specific information in my notes",
        "Create practice questions from my study materials",
        "Extract important dates and deadlines",
        "Compare different topics in my notes",
        "Explain complex concepts in simple terms",
        "Help me prepare interview answers based on my experience",
        "What are my key strengths according to my notes?",
        "Generate behavioral interview questions for my field",
        "Create professional responses from my project examples"
      ],
      cached: false,
      error: "Generated fallback questions due to processing error"
    });
  }
}
