// Cleanup script for duplicate chat sessions
// Run this script to remove duplicate empty chat sessions

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupDuplicateSessions() {
  try {
    console.log("🧹 Starting cleanup of duplicate chat sessions...");

    // Find all users
    const users = await prisma.chatSession.findMany({
      select: { userId: true },
      distinct: ["userId"],
    });

    let totalDeleted = 0;

    for (const user of users) {
      // Find all "New Chat" sessions with no messages for this user
      const emptySessions = await prisma.chatSession.findMany({
        where: {
          userId: user.userId,
          title: "New Chat",
          messages: {
            none: {},
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Keep the most recent one, delete the rest
      if (emptySessions.length > 1) {
        const sessionsToDelete = emptySessions.slice(1); // Keep first (most recent)

        for (const session of sessionsToDelete) {
          await prisma.chatSession.delete({
            where: { id: session.id },
          });
          totalDeleted++;
          console.log(`🗑️  Deleted empty session: ${session.id}`);
        }
      }

      // Also find sessions with identical titles and similar content
      const duplicateTitleSessions = await prisma.chatSession.findMany({
        where: {
          userId: user.userId,
          title: {
            contains: "explain about my projects",
          },
        },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Group by similar first messages and remove duplicates
      const messageGroups = new Map();

      for (const session of duplicateTitleSessions) {
        const firstMessage = session.messages[0]?.content?.slice(0, 50);
        if (firstMessage) {
          if (!messageGroups.has(firstMessage)) {
            messageGroups.set(firstMessage, []);
          }
          messageGroups.get(firstMessage).push(session);
        }
      }

      // For each group, keep only the most recent session
      for (const [message, sessions] of messageGroups) {
        if (sessions.length > 1) {
          const sessionsToDelete = sessions.slice(1); // Keep first (most recent)

          for (const session of sessionsToDelete) {
            await prisma.chatSession.delete({
              where: { id: session.id },
            });
            totalDeleted++;
            console.log(
              `🗑️  Deleted duplicate session: ${session.id} - "${session.title}"`
            );
          }
        }
      }
    }

    console.log(
      `✅ Cleanup completed! Deleted ${totalDeleted} duplicate sessions.`
    );
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupDuplicateSessions();
