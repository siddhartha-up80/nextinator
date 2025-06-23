import { randomBytes } from "crypto";
import prisma from "@/lib/db/prisma";

/**
 * Generates a unique share token for chat sessions
 * @param maxAttempts Maximum number of attempts to generate a unique token
 * @returns Promise<string> A unique share token
 */
export async function generateUniqueShareToken(
  maxAttempts: number = 5
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const token = randomBytes(16).toString("hex");

    // Check if this token already exists
    const existingSession = await prisma.chatSession.findUnique({
      where: { shareToken: token },
    });

    if (!existingSession) {
      return token;
    }
  }

  throw new Error(
    "Failed to generate unique share token after multiple attempts"
  );
}

/**
 * Creates a chat session with a unique share token
 * @param data The session data
 * @returns Promise<ChatSession> The created session
 */
export async function createChatSessionWithUniqueToken(data: {
  title: string;
  userId: string;
}) {
  const shareToken = await generateUniqueShareToken();

  return await prisma.chatSession.create({
    data: {
      ...data,
      shareToken,
    },
  });
}
