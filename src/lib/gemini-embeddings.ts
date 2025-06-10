import { createGoogleGenerativeAI } from "@ai-sdk/google";

// Simple Gemini embeddings
export function createGeminiEmbeddings() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
  }

  const gemini = createGoogleGenerativeAI({
    apiKey,
  });

  return gemini.textEmbeddingModel("text-embedding-004");
}

// Get embeddings for text
export async function getEmbeddings(text: string): Promise<number[]> {
  try {
    const embeddingModel = createGeminiEmbeddings();
    const { embeddings } = await embeddingModel.doEmbed({ values: [text] });
    return embeddings[0];
  } catch (error) {
    console.error("Failed to generate embeddings:", error);
    throw error;
  }
}

// Validate embedding dimensions
export function validateEmbeddingDimensions(embedding: number[]): boolean {
  return embedding.length === 768; // Google's text-embedding-004 is 768 dimensions
}
