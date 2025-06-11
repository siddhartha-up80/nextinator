import {
  createNoteSchema,
  deleteNoteSchema,
  updateNoteSchema,
} from "@/lib/validation/note";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db/prisma";
import { notesIndex } from "@/lib/db/pinecone";
import { getEmbeddings, getBatchEmbeddings } from "@/lib/gemini-embeddings";
import {
  chunkText,
  createEmbeddingText,
  DEFAULT_CHUNKING_OPTIONS,
} from "@/lib/text-chunking";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const parseResult = createNoteSchema.safeParse(body);

    if (!parseResult.success) {
      console.error(parseResult.error);
      return Response.json({ error: "Invalid input" }, { status: 400 });
    }

    const { title, content } = parseResult.data;

    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    } // Create chunks from the note content
    const chunks = chunkText(content || "", DEFAULT_CHUNKING_OPTIONS);

    // Generate embeddings for all chunks first (outside transaction)
    console.log(`🔄 Generating embeddings for ${chunks.length} chunks...`);

    // Create embedding texts for all chunks
    const embeddingTexts = chunks.map((chunk) =>
      createEmbeddingText(title, chunk.content)
    );

    // Use batch processing to respect rate limits
    const embeddings = await getBatchEmbeddings(embeddingTexts, 5); // Process 5 at a time

    // Combine chunks with their embeddings
    const chunksWithEmbeddings = chunks.map((chunk, index) => ({
      chunk,
      embedding: embeddings[index],
    }));

    console.log(`✅ Generated all embeddings`);

    const note = await prisma.$transaction(async (tx) => {
      const note = await tx.note.create({
        data: {
          title,
          content,
          userId,
        },
      });

      // Create chunks and prepare vector upserts
      const chunkOperations = [];
      const vectorUpserts = [];

      for (const { chunk, embedding } of chunksWithEmbeddings) {
        const vectorId = `${note.id}_chunk_${chunk.chunkIndex}`;

        // Create chunk in database
        chunkOperations.push(
          tx.noteChunk.create({
            data: {
              noteId: note.id,
              content: chunk.content,
              chunkIndex: chunk.chunkIndex,
              startIndex: chunk.startIndex,
              endIndex: chunk.endIndex,
              vectorId,
            },
          })
        );

        // Prepare vector upsert
        vectorUpserts.push({
          id: vectorId,
          values: embedding,
          metadata: {
            userId,
            noteId: note.id,
            noteTitle: title,
            chunkIndex: chunk.chunkIndex,
            startIndex: chunk.startIndex,
            endIndex: chunk.endIndex,
            contentLength: chunk.content.length,
          },
        });
      }

      // Execute chunk operations
      await Promise.all(chunkOperations);

      // Upsert to vector database
      await notesIndex.upsert(vectorUpserts);

      return note;
    });

    return Response.json({ note }, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();

    const parseResult = updateNoteSchema.safeParse(body);

    if (!parseResult.success) {
      console.error(parseResult.error);
      return Response.json({ error: "Invalid input" }, { status: 400 });
    }

    const { id, title, content } = parseResult.data;

    const note = await prisma.note.findUnique({ where: { id } });

    if (!note) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    const { userId } = await auth();

    if (!userId || userId !== note.userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    } // Create chunks from the updated content
    const chunks = chunkText(content || "", DEFAULT_CHUNKING_OPTIONS);

    // Generate embeddings for all chunks first (outside transaction)
    console.log(`🔄 Generating embeddings for ${chunks.length} chunks...`);

    // Create embedding texts for all chunks
    const embeddingTexts = chunks.map((chunk) =>
      createEmbeddingText(title, chunk.content)
    );

    // Use batch processing to respect rate limits
    const embeddings = await getBatchEmbeddings(embeddingTexts, 5); // Process 5 at a time

    // Combine chunks with their embeddings
    const chunksWithEmbeddings = chunks.map((chunk, index) => ({
      chunk,
      embedding: embeddings[index],
    }));

    console.log(`✅ Generated all embeddings`);

    const updatedNote = await prisma.$transaction(async (tx) => {
      const updatedNote = await tx.note.update({
        where: { id },
        data: {
          title,
          content,
        },
      });

      // Delete existing chunks and vectors
      const existingChunks = await tx.noteChunk.findMany({
        where: { noteId: id },
      });

      // Delete from vector database
      if (existingChunks.length > 0) {
        const vectorIds = existingChunks.map((chunk) => chunk.vectorId);
        await notesIndex.deleteMany(vectorIds);
      }

      // Delete chunks from database
      await tx.noteChunk.deleteMany({
        where: { noteId: id },
      });

      // Create new chunks and embeddings
      const chunkOperations = [];
      const vectorUpserts = [];

      for (const { chunk, embedding } of chunksWithEmbeddings) {
        const vectorId = `${id}_chunk_${chunk.chunkIndex}`;

        // Create chunk in database
        chunkOperations.push(
          tx.noteChunk.create({
            data: {
              noteId: id,
              content: chunk.content,
              chunkIndex: chunk.chunkIndex,
              startIndex: chunk.startIndex,
              endIndex: chunk.endIndex,
              vectorId,
            },
          })
        );

        // Prepare vector upsert
        vectorUpserts.push({
          id: vectorId,
          values: embedding,
          metadata: {
            userId,
            noteId: id,
            noteTitle: title,
            chunkIndex: chunk.chunkIndex,
            startIndex: chunk.startIndex,
            endIndex: chunk.endIndex,
            contentLength: chunk.content.length,
          },
        });
      }

      // Execute chunk operations
      await Promise.all(chunkOperations);

      // Upsert to vector database
      await notesIndex.upsert(vectorUpserts);

      return updatedNote;
    });

    return Response.json({ updatedNote }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();

    const parseResult = deleteNoteSchema.safeParse(body);

    if (!parseResult.success) {
      console.error(parseResult.error);
      return Response.json({ error: "Invalid input" }, { status: 400 });
    }

    const { id } = parseResult.data;

    const note = await prisma.note.findUnique({ where: { id } });

    if (!note) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    const { userId } = await auth();

    if (!userId || userId !== note.userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.$transaction(async (tx) => {
      // Get all chunks for this note to delete from vector database
      const chunks = await tx.noteChunk.findMany({
        where: { noteId: id },
      });

      // Delete from vector database
      if (chunks.length > 0) {
        const vectorIds = chunks.map((chunk) => chunk.vectorId);
        await notesIndex.deleteMany(vectorIds);
      }

      // Delete note (chunks will be deleted due to cascade)
      await tx.note.delete({ where: { id } });
    });

    return Response.json({ message: "note deleted" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
