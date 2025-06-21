import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db/prisma";
import { randomUUID } from "crypto";

// POST /api/chat-sessions/[id]/share - Generate or update share token
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: sessionId } = await params;

    // Verify ownership of the session
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Generate a new share token
    const shareToken = randomUUID();

    // Update session with share token and mark as shared
    const updatedSession = await prisma.chatSession.update({
      where: {
        id: sessionId,
      },
      data: {
        isShared: true,
        shareToken,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      shareToken,
      shareUrl: `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/shared-chat/${shareToken}`,
      isShared: true,
    });
  } catch (error) {
    console.error("Error generating share token:", error);
    return NextResponse.json(
      { error: "Failed to generate share token" },
      { status: 500 }
    );
  }
}

// DELETE /api/chat-sessions/[id]/share - Remove sharing (disable share link)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: sessionId } = await params;

    // Verify ownership of the session
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Disable sharing
    const updatedSession = await prisma.chatSession.update({
      where: {
        id: sessionId,
      },
      data: {
        isShared: false,
        shareToken: null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      isShared: false,
      message: "Sharing disabled",
    });
  } catch (error) {
    console.error("Error disabling share:", error);
    return NextResponse.json(
      { error: "Failed to disable sharing" },
      { status: 500 }
    );
  }
}
