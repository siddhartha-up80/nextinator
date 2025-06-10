// Test script to verify embedding provider selection
// Run this with: npx tsx test-embeddings.js

import { getEmbeddingProvider } from "./src/lib/embeddings.js";

async function testEmbeddingProviders() {
  console.log("🧪 Testing Embedding Providers...\n");

  const testText = "Hello, this is a test embedding.";

  // Test Google provider
  try {
    console.log("📱 Testing Google Gemini embeddings...");
    const googleProvider = getEmbeddingProvider("google");
    console.log(`   Dimensions: ${googleProvider.getDimensions()}`);

    const googleEmbedding = await googleProvider.generateEmbedding(testText);
    console.log(
      `   ✅ Google embedding generated: ${googleEmbedding.length} dimensions`
    );
    console.log(
      `   📊 First 5 values: [${googleEmbedding.slice(0, 5).join(", ")}...]`
    );
  } catch (error) {
    console.log(`   ❌ Google embedding failed: ${error.message}`);
  }

  console.log("");

  // Test OpenAI provider (fallback)
  try {
    console.log("🤖 Testing OpenAI embeddings...");
    const openaiProvider = getEmbeddingProvider("openai");
    console.log(`   Dimensions: ${openaiProvider.getDimensions()}`);

    const openaiEmbedding = await openaiProvider.generateEmbedding(testText);
    console.log(
      `   ✅ OpenAI embedding generated: ${openaiEmbedding.length} dimensions`
    );
    console.log(
      `   📊 First 5 values: [${openaiEmbedding.slice(0, 5).join(", ")}...]`
    );
  } catch (error) {
    console.log(`   ❌ OpenAI embedding failed: ${error.message}`);
  }

  console.log("");

  // Test Anthropic provider (should use fallback)
  try {
    console.log("🎭 Testing Anthropic embeddings (should use fallback)...");
    const anthropicProvider = getEmbeddingProvider("anthropic");
    console.log(`   Dimensions: ${anthropicProvider.getDimensions()}`);

    const anthropicEmbedding = await anthropicProvider.generateEmbedding(
      testText
    );
    console.log(
      `   ✅ Anthropic embedding generated: ${anthropicEmbedding.length} dimensions`
    );
  } catch (error) {
    console.log(`   ❌ Anthropic embedding failed: ${error.message}`);
  }
}

testEmbeddingProviders().catch(console.error);
