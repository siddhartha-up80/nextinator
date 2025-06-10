// Test the stream parsing with the actual format from our backend
import { processDataStream } from "ai/react";

const testStreamData = `f:{"messageId":"msg-TyWL0JQKSuKovIbw6DHMgdtK"}
0:"Why"
0:" don't scientists trust atoms? \\n\\nBecause they make up everything!\\n"
e:{"finishReason":"stop","usage":{"promptTokens":99,"completionTokens":17},"isContinued":false}
d:{"finishReason":"stop","usage":{"promptTokens":99,"completionTokens":17}}
`;

async function testStreamParsing() {
  console.log("🧪 Testing stream parsing with actual backend data...");

  // Create a ReadableStream from the test data
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(testStreamData));
      controller.close();
    },
  });

  try {
    let textParts = [];
    let errorParts = [];
    let finishParts = [];

    await processDataStream({
      stream,
      onTextPart: (part) => {
        console.log("📝 Text part:", part);
        textParts.push(part);
      },
      onErrorPart: (part) => {
        console.error("❌ Error part:", part);
        errorParts.push(part);
      },
      onFinishMessagePart: (part) => {
        console.log("✅ Finish part:", part);
        finishParts.push(part);
      },
    });

    console.log("✅ Parsing completed successfully");
    console.log("📊 Results:", { textParts, errorParts, finishParts });
  } catch (error) {
    console.error("🚨 Stream parsing failed:", error);
    console.error("🚨 Error details:", error.message);
    console.error("🚨 Error stack:", error.stack);
  }
}

testStreamParsing();
