const { PrismaClient } = require("@prisma/client");
const { randomBytes } = require("crypto");

const prisma = new PrismaClient();

async function fixShareTokens() {
  try {
    console.log("Starting shareToken fix...");

    // Find all chat sessions with null shareToken
    const sessionsWithoutToken = await prisma.chatSession.findMany({
      where: {
        shareToken: null,
      },
    });

    console.log(
      `Found ${sessionsWithoutToken.length} sessions without shareToken`
    );

    // Update each session with a unique shareToken
    for (const session of sessionsWithoutToken) {
      const shareToken = randomBytes(16).toString("hex");

      await prisma.chatSession.update({
        where: { id: session.id },
        data: { shareToken },
      });

      console.log(
        `Updated session ${session.id} with shareToken: ${shareToken}`
      );
    }

    console.log("Successfully fixed all shareTokens");
  } catch (error) {
    console.error("Error fixing shareTokens:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixShareTokens();
