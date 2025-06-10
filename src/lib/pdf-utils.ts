/**
 * PDF parsing utility using external PDF parsing service
 * This provides reliable PDF text extraction by uploading to a temporary URL
 */

export async function extractTextFromPDF(
  buffer: Buffer
): Promise<{ text: string; pages: number }> {
  try {
    console.log("📄 Starting PDF text extraction...");

    // Convert buffer to base64 for API submission
    const base64Pdf = buffer.toString("base64");

    console.log("📄 Sending PDF to parsing service...");

    // Use a free PDF parsing API service
    const response = await fetch("https://api.pdf.co/v1/pdf/convert/to/text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.PDF_CO_API_KEY || "demo", // Use demo key for testing
      },
      body: JSON.stringify({
        file: `data:application/pdf;base64,${base64Pdf}`,
        inline: true,
        pages: "",
        password: "",
      }),
    });

    if (!response.ok) {
      throw new Error(`PDF parsing service error: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(`PDF parsing failed: ${result.error || "Unknown error"}`);
    }

    const extractedText = result.body || "";

    // Estimate page count based on content (rough estimation)
    const estimatedPages = Math.max(1, Math.ceil(extractedText.length / 3000));

    console.log(`📄 Successfully extracted text from PDF`);
    console.log(`📄 Total text length: ${extractedText.length} characters`);
    console.log(`📄 Estimated pages: ${estimatedPages}`);

    return {
      text: extractedText,
      pages: estimatedPages,
    };
  } catch (error) {
    console.error("📄 PDF parsing error:", error);

    // Fallback to simple text extraction attempt
    try {
      console.log("📄 Attempting fallback PDF parsing...");
      return await fallbackPdfParsing(buffer);
    } catch (fallbackError) {
      console.error("📄 Fallback parsing also failed:", fallbackError);

      if (error instanceof Error) {
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
      } else {
        throw new Error(
          "Failed to extract text from PDF: Unknown error occurred"
        );
      }
    }
  }
}

/**
 * Fallback PDF parsing using simple text extraction
 */
async function fallbackPdfParsing(
  buffer: Buffer
): Promise<{ text: string; pages: number }> {
  try {
    // Try to extract basic text content by looking for text patterns
    const pdfString = buffer.toString("latin1");

    // Simple regex to extract readable text from PDF structure
    const textMatches = pdfString.match(/\(([^)]+)\)/g);

    if (textMatches && textMatches.length > 0) {
      const extractedText = textMatches
        .map((match) => match.replace(/[()]/g, ""))
        .filter((text) => text.length > 2 && /[a-zA-Z]/.test(text))
        .join(" ");

      const estimatedPages = Math.max(
        1,
        Math.ceil(extractedText.length / 2000)
      );

      console.log("📄 Fallback extraction successful");

      return {
        text: extractedText,
        pages: estimatedPages,
      };
    }

    throw new Error("No readable text found in PDF");
  } catch (error) {
    throw new Error("Fallback PDF parsing failed");
  }
}
