import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db/prisma";

// POST /api/chat-messages - Save messages to a chat session
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId, messages, createSession } = await request.json();
    if (!messages) {
      return NextResponse.json(
        {
          error: "Messages are required",
        },
        { status: 400 }
      );
    }

    let actualSessionId = sessionId;

    // If no sessionId provided but createSession is true, create a new session
    if (!sessionId && createSession) {
      const newSession = await prisma.chatSession.create({
        data: {
          title: "New Chat",
          userId,
        },
      });
      actualSessionId = newSession.id;
    }

    if (!actualSessionId) {
      return NextResponse.json(
        {
          error: "Session ID is required or createSession must be true",
        },
        { status: 400 }
      );
    }

    // Verify session ownership
    const session = await prisma.chatSession.findFirst({
      where: {
        id: actualSessionId,
        userId,
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Delete existing messages for this session
    await prisma.chatMessage.deleteMany({
      where: {
        chatSessionId: actualSessionId,
      },
    });

    // Create new messages
    const messageData = messages.map((msg: any) => ({
      chatSessionId: actualSessionId,
      role: msg.role,
      content: msg.content,
    }));
    await prisma.chatMessage.createMany({
      data: messageData,
    });

    // Update session updatedAt timestamp
    await prisma.chatSession.update({
      where: {
        id: actualSessionId,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, sessionId: actualSessionId });
  } catch (error) {
    console.error("Error saving chat messages:", error);
    return NextResponse.json(
      { error: "Failed to save chat messages" },
      { status: 500 }
    );
  }
}
