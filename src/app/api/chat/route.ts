import { getEmbeddings } from "@/lib/gemini-embeddings";
import { notesIndex } from "@/lib/db/pinecone";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db/prisma";
import { google } from "@ai-sdk/google";
import { generateText, streamText } from "ai";

const model = google("gemini-1.5-pro-latest");
// const model = google("gemini-2.5-pro-preview-06-05");

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  try {
    console.log("💬 Chat API called");

    const body = await req.json();
    const { messages, settings } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "Messages are required" }, { status: 400 });
    }

    console.log("💬 Processing", messages.length, "messages");
    if (settings?.responseType) {
      console.log("💬 Response type:", settings.responseType);
    }

    // Get the last 4 messages for context
    const messageTruncated = messages.slice(-4);

    // Generate embeddings for vector search
    const messageContent = messageTruncated
      .map((message: any) => message.content)
      .join("\n");

    console.log("💬 Generating embeddings...");
    const embedding = await getEmbeddings(messageContent);

    // Get user ID for filtering
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("💬 Searching relevant notes..."); // Search for relevant notes using embeddings
    const vectorQueryResponse = await notesIndex.query({
      vector: embedding,
      topK: 40,
      filter: { userId },
      includeMetadata: true, // Make sure we get the metadata with content
    });

    console.log(
      "💬 Found",
      vectorQueryResponse.matches?.length || 0,
      "relevant chunks"
    ); // Extract content from vector search results
    const relevantChunks =
      vectorQueryResponse.matches
        ?.filter((match) => match.metadata?.content) // Only include chunks with content
        .map((match) => ({
          title: match.metadata?.noteTitle || "Untitled",
          content: match.metadata?.content,
          score: match.score,
          chunkIndex: match.metadata?.chunkIndex || 0,
          sourceType: match.metadata?.sourceType || "text",
          fileName: match.metadata?.fileName || null,
        })) || [];

    console.log("💬 Processing", relevantChunks.length, "relevant chunks");

    // Create system message with context
    const baseSystemPrompt =
      settings?.customPrompt ||
      "You are an intelligent custom data assistant powered by Google Gemini. " +
        "Answer the user's questions based on their existing custom data. " +
        "Use simple, conversational language that's easy to understand." +
        "If there's no relevant information in the notes or if the notes are empty, " +
        "you can respond with your general knowledge.";

    // Add response type instruction if provided
    const responseTypeInstruction = settings?.responseType
      ? ` Give answers in ${settings.responseType} length format.`
      : "";

    const systemMessage = {
      role: "system" as const,
      content:
        baseSystemPrompt +
          responseTypeInstruction +
          "\n\n" +
          "Relevant data for this query:\n" +
          relevantChunks
            .map((chunk) => {
              const sourceInfo =
                chunk.sourceType === "pdf" && chunk.fileName
                  ? ` (from PDF: ${chunk.fileName})`
                  : ` (from ${chunk.sourceType} note)`;
              return `Title: ${chunk.title}${sourceInfo}\n\nContent:\n${chunk.content}`;
            })
            .join("\n\n") || "No relevant notes found.",
    };

    // Get Gemini model

    console.log("💬 Starting Gemini stream...");

    // Stream the response using AI SDK 5 pattern
    const result = streamText({
      model,
      messages: [systemMessage, ...messageTruncated],
      temperature: 0.7,
      maxTokens: 8192,
    });

    // Return the streaming response using toDataStreamResponse
    return (await result).toDataStreamResponse();
  } catch (error) {
    console.error("💬 Chat API error:", error);

    return Response.json(
      {
        error: "Failed to process chat",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
