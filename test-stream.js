// Quick test to see what our API is returning
const testAPI = async () => {
  try {
    const response = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "user", content: "Hello, tell me a very short joke" },
        ],
        provider: "google",
        model: "gemini-1.5-flash",
      }),
    });

    console.log("Response status:", response.status);
    console.log(
      "Response headers:",
      Object.fromEntries(response.headers.entries())
    );

    // Read the stream as text to see what's actually being sent
    const reader = response.body.getReader();
    let text = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = new TextDecoder().decode(value);
      text += chunk;
      console.log("Chunk:", JSON.stringify(chunk));
    }

    console.log("Full text:", text);
  } catch (error) {
    console.error("Error:", error);
  }
};

// Run if in Node.js context
if (typeof module !== "undefined" && module.exports) {
  testAPI();
} else {
  // Browser context
  testAPI();
}
