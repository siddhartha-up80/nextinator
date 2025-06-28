import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db/prisma";

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First, count how many sessions will be deleted for logging
    const sessionsToDelete = await prisma.chatSession.count({
      where: {
        userId: userId,
        isShared: {
          not: true,
        },
      },
    });

    if (sessionsToDelete === 0) {
      return NextResponse.json({
        success: true,
        deletedCount: 0,
        message: "No non-shared chat sessions found to delete",
      });
    }

    // Delete all non-shared chat sessions for the user
    const deleteResult = await prisma.chatSession.deleteMany({
      where: {
        userId: userId,
        isShared: {
          not: true, // Only delete sessions that are not shared
        },
      },
    });

    console.log(
      `Bulk deleted ${deleteResult.count} chat sessions for user ${userId}`
    );

    return NextResponse.json({
      success: true,
      deletedCount: deleteResult.count,
      message: `Successfully deleted ${deleteResult.count} non-shared chat sessions`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete chat sessions" },
      { status: 500 }
    );
  }
}
