import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(
      "🚀 Starting migration of notes without groupId for user:",
      userId
    );

    // Use direct MongoDB query approach for better compatibility
    let allNotes;
    try {
      allNotes = await prisma.note.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          groupId: true,
        },
      });
    } catch (dbError) {
      console.error("❌ Database connection error:", dbError);
      return NextResponse.json(
        {
          error: "Database connection failed",
          details:
            dbError instanceof Error
              ? dbError.message
              : "Unknown database error",
        },
        { status: 500 }
      );
    }

    console.log(`📊 Total notes for user: ${allNotes.length}`);

    if (allNotes.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No notes found for user",
        totalNotesForUser: 0,
        notesUpdated: 0,
        finalNullCount: 0,
      });
    }

    // Sample some notes to see their structure
    console.log("📋 Sample of notes:");
    allNotes.slice(0, 3).forEach((note) => {
      console.log(
        `  - ${note.title}: groupId = ${
          note.groupId
        } (type: ${typeof note.groupId})`
      );
    });

    // Update notes using updateMany for better performance
    let updateResult;
    try {
      updateResult = await prisma.note.updateMany({
        where: {
          userId: userId,
          OR: [{ groupId: null }, { groupId: undefined }, { groupId: "" }],
        },
        data: {
          groupId: null,
        },
      });
    } catch (updateError) {
      console.error("❌ Update error:", updateError);
      return NextResponse.json(
        {
          error: "Failed to update notes",
          details:
            updateError instanceof Error
              ? updateError.message
              : "Unknown update error",
        },
        { status: 500 }
      );
    }

    console.log(
      `✅ Migration completed. Updated ${updateResult.count} notes to have explicit null groupId`
    );

    // Verify the changes - count notes with null groupId
    const nullGroupIdCount = await prisma.note.count({
      where: {
        userId: userId,
        groupId: null,
      },
    });

    console.log(
      `📊 Total notes with null groupId after migration: ${nullGroupIdCount}`
    );

    return NextResponse.json({
      success: true,
      totalNotesForUser: allNotes.length,
      notesUpdated: updateResult.count,
      finalNullCount: nullGroupIdCount,
    });
  } catch (error) {
    console.error("❌ Migration failed:", error);
    return NextResponse.json(
      {
        error: "Migration failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
