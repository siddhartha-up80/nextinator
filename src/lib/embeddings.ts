// import OpenAI from "openai";
// import { GoogleGenerativeAI } from "@google/generative-ai";
// import {
//   AI_PROVIDER_CONFIG,
//   AIProvider,
//   DEFAULT_AI_PROVIDER,
// } from "./ai-providers";

// // Check embedding dimensions compatibility
// function validateEmbeddingDimensions(
//   embedding: number[],
//   provider: AIProvider
// ): number[] {
//   const expectedDimension = 1536; // OpenAI ada-002 dimensions (what your Pinecone index likely expects)

//   if (embedding.length !== expectedDimension) {
//     console.warn(
//       `Warning: ${provider} embedding has ${embedding.length} dimensions, ` +
//         `but your Pinecone index expects ${expectedDimension} dimensions. ` +
//         `This might cause vector search issues.`
//     );

//     // For Google embeddings (768 dimensions), we could:
//     // 1. Pad with zeros to match OpenAI dimensions
//     // 2. Use a different Pinecone index
//     // 3. Convert to OpenAI embeddings for consistency

//     if (provider === "google" && embedding.length === 768) {
//       console.warn(
//         "Consider using OpenAI for embeddings to maintain compatibility " +
//           "with your existing vector database, or create a separate Pinecone index " +
//           "with 768 dimensions for Google embeddings."
//       );
//     }
//   }

//   return embedding;
// }

// // Embedding provider interface
// interface EmbeddingProvider {
//   generateEmbedding(text: string): Promise<number[]>;
//   getDimensions(): number;
// }

// // OpenAI embedding provider
// class OpenAIEmbeddingProvider implements EmbeddingProvider {
//   private client: OpenAI;

//   constructor(apiKey: string) {
//     this.client = new OpenAI({ apiKey });
//   }

//   async generateEmbedding(text: string): Promise<number[]> {
//     const response = await this.client.embeddings.create({
//       model: "text-embedding-ada-002",
//       input: text,
//     });

//     const embedding = response.data[0].embedding;
//     if (!embedding) {
//       throw new Error("Error generating embedding");
//     }

//     return validateEmbeddingDimensions(embedding, "openai");
//   }

//   getDimensions(): number {
//     return 1536;
//   }
// }

// // Google embedding provider
// class GoogleEmbeddingProvider implements EmbeddingProvider {
//   private client: GoogleGenerativeAI;

//   constructor(apiKey: string) {
//     this.client = new GoogleGenerativeAI(apiKey);
//   }

//   async generateEmbedding(text: string): Promise<number[]> {
//     const model = this.client.getGenerativeModel({
//       model: "text-embedding-004",
//     });
//     const result = await model.embedContent(text);

//     if (!result.embedding?.values) {
//       throw new Error("Error generating embedding");
//     }

//     return validateEmbeddingDimensions(result.embedding.values, "google");
//   }

//   getDimensions(): number {
//     return 768;
//   }
// }

// // Fallback to OpenAI for providers without embedding support
// class FallbackEmbeddingProvider implements EmbeddingProvider {
//   private openaiProvider: OpenAIEmbeddingProvider | null = null;

//   constructor() {
//     const openaiApiKey = process.env.OPENAI_API_KEY;
//     if (openaiApiKey) {
//       this.openaiProvider = new OpenAIEmbeddingProvider(openaiApiKey);
//     }
//   }

//   async generateEmbedding(text: string): Promise<number[]> {
//     if (!this.openaiProvider) {
//       throw new Error(
//         "OpenAI API key is required for embedding fallback. " +
//           "Please add OPENAI_API_KEY to your environment variables, " +
//           "or use a provider that supports embeddings (like Google Gemini)."
//       );
//     }
//     console.warn("Using OpenAI fallback for embeddings");
//     return this.openaiProvider.generateEmbedding(text);
//   }

//   getDimensions(): number {
//     return 1536;
//   }
// }

// // Get embedding provider for a specific AI provider
// function getEmbeddingProvider(provider: AIProvider): EmbeddingProvider {
//   const config = AI_PROVIDER_CONFIG[provider];
//   const apiKey = process.env[config.apiKeyEnv];

//   if (!config.embeddingModel) {
//     // Provider doesn't support embeddings, use fallback
//     return new FallbackEmbeddingProvider();
//   }

//   if (!apiKey) {
//     // If the provider's API key is not available, use fallback
//     console.warn(
//       `${config.apiKeyEnv} not found, using OpenAI fallback for embeddings`
//     );
//     return new FallbackEmbeddingProvider();
//   }

//   switch (provider) {
//     case "openai":
//       return new OpenAIEmbeddingProvider(apiKey);
//     case "google":
//       return new GoogleEmbeddingProvider(apiKey);
//     default:
//       // For unsupported providers, use fallback
//       return new FallbackEmbeddingProvider();
//   }`
// }

// // Get default embedding provider
// const embeddingProvider = getEmbeddingProvider(DEFAULT_AI_PROVIDER);

// // Main embedding function
// export async function getEmbedding(text: string): Promise<number[]> {
//   return embeddingProvider.generateEmbedding(text);
// }

// // Export for backward compatibility
// export { getEmbeddingProvider };
