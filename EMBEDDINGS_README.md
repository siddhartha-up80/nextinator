# Gemini Embeddings with Rate Limiting

This module provides rate-limited access to Google's Gemini text embeddings API to prevent quota exceeded errors.

## Features

- **Rate Limiting**: Automatically throttles requests to stay within API limits (150 requests/minute)
- **Exponential Backoff**: Intelligent retry mechanism for handling temporary rate limit errors
- **Batch Processing**: Efficiently process multiple texts while respecting rate limits
- **Configurable Settings**: Adjust rate limits, retry behavior, and batch sizes
- **Monitoring**: Track rate limit usage and status

## Usage

### Basic Usage

```typescript
import { getEmbeddings } from "@/lib/gemini-embeddings";

// Generate embeddings for a single text
const embedding = await getEmbeddings("Your text here");
console.log(`Generated embedding with ${embedding.length} dimensions`);
```

### Batch Processing

```typescript
import { getBatchEmbeddings } from "@/lib/gemini-embeddings";

// Process multiple texts efficiently
const texts = ["Text 1", "Text 2", "Text 3"];
const embeddings = await getBatchEmbeddings(texts, 3); // Batch size of 3
console.log(`Generated ${embeddings.length} embeddings`);
```

### Configuration

```typescript
import {
  updateEmbeddingConfig,
  getEmbeddingConfig,
} from "@/lib/gemini-embeddings";

// Update configuration
updateEmbeddingConfig({
  maxRequestsPerMinute: 100, // Reduce rate limit for safety
  retryAttempts: 5, // More retry attempts
  baseRetryDelay: 2000, // Longer initial delay
  batchSize: 3, // Smaller batch size
});

// Check current configuration
const config = getEmbeddingConfig();
console.log("Current config:", config);
```

### Rate Limit Monitoring

```typescript
import { getRateLimitStatus } from "@/lib/gemini-embeddings";

// Check current rate limit status
const status = getRateLimitStatus();
console.log(
  `Used: ${status.requestsUsed}, Remaining: ${status.remainingRequests}`
);
console.log(`Resets in: ${Math.round(status.resetInMs / 1000)} seconds`);
```

## Error Handling

The module automatically handles:

- **429 Rate Limit Errors**: Retries with exponential backoff
- **Temporary Network Issues**: Configurable retry attempts
- **API Quota Exceeded**: Waits for rate limit window to reset

## API Limits

Google's Gemini API has the following limits:

- **150 requests per minute per region** for batch embed content requests
- **768 dimensions** for text-embedding-004 model

The module is configured to stay safely below these limits with:

- Default 120 requests/minute (80% of limit)
- Automatic spacing between requests (~500ms)
- Intelligent retry with exponential backoff

## Environment Variables

Make sure to set your Google API key:

```bash
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

## Testing

Run the rate limiting test to verify everything works:

```bash
node test-rate-limiting.js
```

This will test single embeddings, batch processing, and rate limit monitoring.
