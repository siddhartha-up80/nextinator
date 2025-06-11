import { createGoogleGenerativeAI } from "@ai-sdk/google";

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequestsPerMinute: 120, // Set below the 150 limit for safety
  requestInterval: 60000 / 120, // ~500ms between requests
};

// Configuration options
interface EmbeddingConfig {
  maxRequestsPerMinute?: number;
  retryAttempts?: number;
  baseRetryDelay?: number;
  batchSize?: number;
}

// Default configuration
const DEFAULT_CONFIG: Required<EmbeddingConfig> = {
  maxRequestsPerMinute: 120,
  retryAttempts: 3,
  baseRetryDelay: 1000,
  batchSize: 5,
};

// Current configuration (can be updated)
let currentConfig = { ...DEFAULT_CONFIG };

// Update configuration
export function updateEmbeddingConfig(config: Partial<EmbeddingConfig>) {
  currentConfig = { ...currentConfig, ...config };

  // Update rate limit if changed
  if (config.maxRequestsPerMinute) {
    RATE_LIMIT.maxRequestsPerMinute = config.maxRequestsPerMinute;
    RATE_LIMIT.requestInterval = 60000 / config.maxRequestsPerMinute;
  }

  console.log(`📝 Updated embedding configuration:`, currentConfig);
}

// Get current configuration
export function getEmbeddingConfig(): Required<EmbeddingConfig> {
  return { ...currentConfig };
}

// Request tracking
let requestCount = 0;
let windowStart = Date.now();
let lastRequestTime = 0;

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

// Rate limiting helper
async function waitForRateLimit(): Promise<void> {
  const now = Date.now();

  // Reset window if a minute has passed
  if (now - windowStart >= 60000) {
    requestCount = 0;
    windowStart = now;
  }

  // If we're at the limit, wait for the window to reset
  if (requestCount >= RATE_LIMIT.maxRequestsPerMinute) {
    const waitTime = 60000 - (now - windowStart);
    if (waitTime > 0) {
      console.log(`Rate limit reached, waiting ${waitTime}ms...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      // Reset after waiting
      requestCount = 0;
      windowStart = Date.now();
    }
  }

  // Ensure minimum interval between requests
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT.requestInterval) {
    const waitTime = RATE_LIMIT.requestInterval - timeSinceLastRequest;
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  requestCount++;
  lastRequestTime = Date.now();
}

// Exponential backoff retry helper
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries?: number,
  baseDelay?: number
): Promise<T> {
  const retries = maxRetries ?? currentConfig.retryAttempts;
  const delay = baseDelay ?? currentConfig.baseRetryDelay;
  let attempt = 0;

  while (attempt <= retries) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;

      // Check if it's a rate limit error
      const isRateLimit =
        error?.statusCode === 429 ||
        error?.message?.includes("Quota exceeded") ||
        error?.message?.includes("RATE_LIMIT_EXCEEDED");

      if (isRateLimit && attempt <= retries) {
        const waitTime =
          delay * Math.pow(2, attempt - 1) + Math.random() * 1000; // Add jitter
        console.log(
          `Rate limit hit, retrying in ${waitTime}ms (attempt ${attempt}/${
            retries + 1
          })...`
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      // If it's not a rate limit error or we've exhausted retries, throw
      throw error;
    }
  }

  throw new Error(`Failed after ${retries + 1} attempts`);
}

// Get embeddings for text with rate limiting and retry logic
export async function getEmbeddings(text: string): Promise<number[]> {
  return retryWithBackoff(async () => {
    await waitForRateLimit();

    const embeddingModel = createGeminiEmbeddings();
    const { embeddings } = await embeddingModel.doEmbed({ values: [text] });
    return embeddings[0];
  });
}

// Batch process multiple texts with rate limiting
export async function getBatchEmbeddings(
  texts: string[],
  batchSize?: number // Optional batch size, defaults to config value
): Promise<number[][]> {
  const effectiveBatchSize = batchSize ?? currentConfig.batchSize;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += effectiveBatchSize) {
    const batch = texts.slice(i, i + effectiveBatchSize);

    // Process batch with rate limiting
    const batchResults = await retryWithBackoff(async () => {
      await waitForRateLimit();

      const embeddingModel = createGeminiEmbeddings();
      const { embeddings } = await embeddingModel.doEmbed({ values: batch });
      return embeddings;
    });

    results.push(...batchResults);

    // Progress logging for large batches
    if (texts.length > 10) {
      console.log(
        `Processed embeddings batch ${
          Math.floor(i / effectiveBatchSize) + 1
        }/${Math.ceil(texts.length / effectiveBatchSize)}`
      );
    }
  }

  return results;
}

// Get current rate limit status
export function getRateLimitStatus() {
  const now = Date.now();
  const windowStart = now - (now % 60000); // Start of current minute
  const remainingRequests = Math.max(
    0,
    RATE_LIMIT.maxRequestsPerMinute - requestCount
  );
  const resetTime = windowStart + 60000;

  return {
    requestsUsed: requestCount,
    remainingRequests,
    resetTime,
    resetInMs: resetTime - now,
  };
}

// Reset rate limit counters (useful for testing)
export function resetRateLimit() {
  requestCount = 0;
  windowStart = Date.now();
  lastRequestTime = 0;
}

// Validate embedding dimensions
export function validateEmbeddingDimensions(embedding: number[]): boolean {
  return embedding.length === 768; // Google's text-embedding-004 is 768 dimensions
}
