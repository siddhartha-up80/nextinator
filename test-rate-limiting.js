// Test script to verify rate limiting for embeddings
// Run this with: node test-rate-limiting.js

import {
  getEmbeddings,
  getBatchEmbeddings,
  getRateLimitStatus,
  resetRateLimit,
} from "./src/lib/gemini-embeddings.js";

async function testRateLimiting() {
  console.log("🧪 Testing Rate Limiting for Gemini Embeddings...\n");

  // Reset rate limit for clean test
  resetRateLimit();
  console.log("🔄 Reset rate limit counters");

  // Test 1: Single embedding
  console.log("\n📝 Test 1: Single embedding");
  try {
    const start = Date.now();
    const embedding = await getEmbeddings("This is a test message");
    const elapsed = Date.now() - start;

    console.log(`✅ Single embedding completed in ${elapsed}ms`);
    console.log(`📊 Embedding dimensions: ${embedding.length}`);

    const status = getRateLimitStatus();
    console.log(
      `📈 Rate limit status: ${status.requestsUsed}/${
        status.requestsUsed + status.remainingRequests
      } requests used`
    );
  } catch (error) {
    console.log(`❌ Single embedding failed: ${error.message}`);
  }

  // Test 2: Batch processing
  console.log("\n📚 Test 2: Batch processing (10 texts)");
  try {
    const texts = Array.from(
      { length: 10 },
      (_, i) => `Test message ${i + 1} for batch processing`
    );

    const start = Date.now();
    const embeddings = await getBatchEmbeddings(texts, 3); // Small batch size for testing
    const elapsed = Date.now() - start;

    console.log(`✅ Batch processing completed in ${elapsed}ms`);
    console.log(`📊 Generated ${embeddings.length} embeddings`);

    const status = getRateLimitStatus();
    console.log(
      `📈 Rate limit status: ${status.requestsUsed}/${
        status.requestsUsed + status.remainingRequests
      } requests used`
    );
    console.log(`⏰ Reset in ${Math.round(status.resetInMs / 1000)}s`);
  } catch (error) {
    console.log(`❌ Batch processing failed: ${error.message}`);
  }

  // Test 3: Rate limit status monitoring
  console.log("\n📊 Test 3: Rate limit status");
  const finalStatus = getRateLimitStatus();
  console.log(`📈 Final status:`);
  console.log(`   Requests used: ${finalStatus.requestsUsed}`);
  console.log(`   Remaining requests: ${finalStatus.remainingRequests}`);
  console.log(`   Reset in: ${Math.round(finalStatus.resetInMs / 1000)}s`);

  console.log("\n✅ Rate limiting tests completed!");
}

testRateLimiting().catch(console.error);
