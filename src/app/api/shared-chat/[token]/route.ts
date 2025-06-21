import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

// GET /api/shared-chat/[token] - Get shared chat session by token
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Find the shared chat session by token
    const session = await prisma.chatSession.findFirst({
      where: {
        shareToken: token,
        isShared: true,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Shared chat not found or sharing has been disabled" },
        { status: 404 }
      );
    }

    // Return session data without sensitive user information
    return NextResponse.json({
      id: session.id,
      title: session.title,
      isShared: session.isShared,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      messages: session.messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt,
      })),
      // Don't expose userId or shareToken for security
    });
  } catch (error) {
    console.error("Error fetching shared chat:", error);
    return NextResponse.json(
      { error: "Failed to fetch shared chat" },
      { status: 500 }
    );
  }
}
