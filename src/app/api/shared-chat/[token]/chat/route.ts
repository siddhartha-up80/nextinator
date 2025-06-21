import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db/prisma";
import { getEmbeddings } from "@/lib/gemini-embeddings";
import { notesIndex } from "@/lib/db/pinecone";
import { google } from "@ai-sdk/google";
import { streamText } from "ai";

const model = google("gemini-1.5-pro-latest");

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// POST /api/shared-chat/[token]/chat - Send message to shared chat
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
): Promise<Response> {
  try {
    console.log("💬 Shared Chat API called");

    const { token } = await params;
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "Messages are required" }, { status: 400 });
    }

    console.log("💬 Processing", messages.length, "messages for shared chat");

    // Verify the shared chat exists and is accessible
    const sharedSession = await prisma.chatSession.findFirst({
      where: {
        shareToken: token,
        isShared: true,
      },
    });

    if (!sharedSession) {
      return Response.json(
        { error: "Shared chat not found or sharing has been disabled" },
        { status: 404 }
      );
    }

    // Get the original user's ID to access their notes
    const originalUserId = sharedSession.userId;

    // Get the last 4 messages for context
    const messageTruncated = messages.slice(-4);

    // Generate embeddings for vector search
    const messageContent = messageTruncated
      .map((message: any) => message.content)
      .join("\n");

    console.log("💬 Generating embeddings for shared chat...");
    const embedding = await getEmbeddings(messageContent);

    console.log("💬 Searching relevant notes from original user...");

    // Search for relevant notes using the original user's data
    const vectorQueryResponse = await notesIndex.query({
      vector: embedding,
      topK: 40,
      filter: { userId: originalUserId }, // Use original user's data
      includeMetadata: true,
    });

    console.log(
      "💬 Found",
      vectorQueryResponse.matches?.length || 0,
      "relevant chunks from original user's data"
    );

    // Extract content from vector search results
    const relevantChunks =
      vectorQueryResponse.matches
        ?.filter((match) => match.metadata?.content)
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
    const systemMessage = {
      role: "system" as const,
      content:
        "You are an intelligent custom data assistant powered by Google Gemini. " +
          "You are helping users in a shared chat session with access to the original user's document database. " +
          "Answer questions based on the shared custom data. " +
          "Use simple, conversational language that's easy to understand, but always give detailed answers utilizing all relevant notes. " +
          "If there's no relevant information in the notes or if the notes are empty, " +
          "you can respond with your general knowledge.\n\n" +
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

    console.log("💬 Starting Gemini stream for shared chat...");

    // Stream the response using AI SDK 5 pattern
    const result = streamText({
      model,
      messages: [systemMessage, ...messageTruncated],
      temperature: 0.7,
      maxTokens: 8192,
    });

    // Return the streaming response
    return (await result).toDataStreamResponse();
  } catch (error) {
    console.error("💬 Shared Chat API error:", error);

    return Response.json(
      {
        error: "Failed to process shared chat",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
