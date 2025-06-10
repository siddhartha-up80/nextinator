/**
 * Text chunking utility for breaking down large text into smaller, manageable chunks
 * for better embedding and retrieval performance
 */

export interface TextChunk {
  content: string;
  startIndex: number;
  endIndex: number;
  chunkIndex: number;
}

export interface ChunkingOptions {
  maxChunkSize: number; // Maximum characters per chunk
  overlapSize: number; // Number of characters to overlap between chunks
  preserveParagraphs: boolean; // Try to preserve paragraph boundaries
  preserveSentences: boolean; // Try to preserve sentence boundaries
}

export const DEFAULT_CHUNKING_OPTIONS: ChunkingOptions = {
  maxChunkSize: 1000, // ~200-250 tokens for most models
  overlapSize: 100, // 10% overlap to maintain context
  preserveParagraphs: true,
  preserveSentences: true,
};

/**
 * Split text into chunks with overlap for better context retrieval
 */
export function chunkText(
  text: string,
  options: Partial<ChunkingOptions> = {}
): TextChunk[] {
  const opts = { ...DEFAULT_CHUNKING_OPTIONS, ...options };

  if (!text || text.length <= opts.maxChunkSize) {
    return [
      {
        content: text,
        startIndex: 0,
        endIndex: text.length,
        chunkIndex: 0,
      },
    ];
  }

  const chunks: TextChunk[] = [];
  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < text.length) {
    let endIndex = Math.min(startIndex + opts.maxChunkSize, text.length);

    // Try to find a good breaking point
    if (endIndex < text.length) {
      endIndex = findOptimalBreakPoint(text, startIndex, endIndex, opts);
    }

    const content = text.slice(startIndex, endIndex).trim();

    if (content.length > 0) {
      chunks.push({
        content,
        startIndex,
        endIndex,
        chunkIndex,
      });
      chunkIndex++;
    }

    // Calculate next start position with overlap
    if (endIndex >= text.length) break;

    startIndex = Math.max(endIndex - opts.overlapSize, startIndex + 1);
  }

  return chunks;
}

/**
 * Find the optimal breaking point for a chunk
 */
function findOptimalBreakPoint(
  text: string,
  startIndex: number,
  maxEndIndex: number,
  options: ChunkingOptions
): number {
  const searchRange = Math.min(200, Math.floor(options.maxChunkSize * 0.2)); // Search within 20% of chunk size
  const minEndIndex = Math.max(maxEndIndex - searchRange, startIndex + 100); // Don't make chunks too small

  // Try to break at paragraph boundaries first
  if (options.preserveParagraphs) {
    for (let i = maxEndIndex; i >= minEndIndex; i--) {
      if (text[i] === "\n" && text[i + 1] === "\n") {
        return i;
      }
    }
  }

  // Try to break at sentence boundaries
  if (options.preserveSentences) {
    const sentenceEnders = [".", "!", "?"];
    for (let i = maxEndIndex; i >= minEndIndex; i--) {
      if (sentenceEnders.includes(text[i]) && text[i + 1] === " ") {
        return i + 1;
      }
    }
  }

  // Try to break at word boundaries
  for (let i = maxEndIndex; i >= minEndIndex; i--) {
    if (text[i] === " " || text[i] === "\n") {
      return i;
    }
  }

  // If no good break point found, use the original end index
  return maxEndIndex;
}

/**
 * Combine chunks back into full text (useful for display)
 */
export function combineChunks(chunks: TextChunk[]): string {
  return chunks
    .sort((a, b) => a.chunkIndex - b.chunkIndex)
    .map((chunk) => chunk.content)
    .join("\n\n");
}

/**
 * Get chunk metadata for a note
 */
export function getChunkMetadata(
  noteId: string,
  noteTitle: string,
  chunk: TextChunk
) {
  return {
    noteId,
    noteTitle,
    chunkIndex: chunk.chunkIndex,
    startIndex: chunk.startIndex,
    endIndex: chunk.endIndex,
    contentLength: chunk.content.length,
  };
}

/**
 * Create embeddings-ready text by combining title and chunk content
 */
export function createEmbeddingText(
  title: string,
  chunkContent: string
): string {
  return `${title}\n\n${chunkContent}`;
}
