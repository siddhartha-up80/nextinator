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

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const parseResult = createNoteSchema.safeParse(body);

    if (!parseResult.success) {
      console.error(parseResult.error);
      return Response.json({ error: "Invalid input" }, { status: 400 });
    }

    const { title, content } = parseResult.data;

    // Extract additional fields for PDF uploads
    const sourceType = body.sourceType || "text";
    const fileName = body.fileName || null;

    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`📝 Creating ${sourceType} note: "${title}"`);
    if (sourceType === "pdf") {
      console.log(`📄 PDF file: ${fileName}`);
      console.log(
        `📄 Extracted content length: ${content?.length || 0} characters`
      );
    } // Create chunks from the note content
    const chunks = chunkText(content || "", DEFAULT_CHUNKING_OPTIONS);
    console.log(`📝 Created ${chunks.length} chunks`); // Generate embeddings for all chunks first (outside transaction)
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

    // Now perform database operations in transaction
    const note = await prisma.$transaction(
      async (tx) => {
        const note = await tx.note.create({
          data: {
            title,
            content,
            userId,
          },
        });

        console.log(`📝 Created note with ID: ${note.id}`);

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
              content: chunk.content, // Include the actual content
              chunkIndex: chunk.chunkIndex,
              startIndex: chunk.startIndex,
              endIndex: chunk.endIndex,
              contentLength: chunk.content.length,
              sourceType: sourceType, // Use the sourceType from request
              ...(fileName && { fileName }), // Include fileName if provided
            },
          });
        }

        // Execute chunk operations
        await Promise.all(chunkOperations);

        // Upsert to vector database (outside transaction to avoid timeout)
        // Store vectorUpserts to execute after transaction
        (note as any).vectorUpserts = vectorUpserts;

        return note;
      },
      { timeout: 15000 } // Example: Increase timeout to 15 seconds
    );

    // Execute vector upserts after successful database transaction
    console.log(
      `🔄 Upserting ${
        (note as any).vectorUpserts.length
      } vectors to Pinecone...`
    );
    await notesIndex.upsert((note as any).vectorUpserts);
    console.log(`✅ Vector upsert completed`);

    // Clean up the temporary property
    delete (note as any).vectorUpserts;
    return Response.json({ note }, { status: 201 });
  } catch (error) {
    console.error("❌ Error creating note:", error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("timeout")) {
        return Response.json(
          {
            error:
              "Processing timeout. Please try with a smaller file or check your connection.",
          },
          { status: 408 }
        );
      }
      if (error.message.includes("embedding")) {
        return Response.json(
          {
            error: "Failed to generate embeddings. Please try again.",
          },
          { status: 503 }
        );
      }
    }

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

    const updatedNote = await prisma.$transaction(
      async (tx) => {
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

        // Delete chunks from database
        await tx.noteChunk.deleteMany({
          where: { noteId: id },
        });

        // Create new chunks
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
              content: chunk.content, // Include the actual content
              chunkIndex: chunk.chunkIndex,
              startIndex: chunk.startIndex,
              endIndex: chunk.endIndex,
              contentLength: chunk.content.length,
              sourceType: "text", // Mark as text source
            },
          });
        }

        // Execute chunk operations
        await Promise.all(chunkOperations);

        // Store vector operations for execution after transaction
        (updatedNote as any).existingChunks = existingChunks;
        (updatedNote as any).vectorUpserts = vectorUpserts;

        return updatedNote;
      },
      { timeout: 15000 } // Example: Increase timeout to 15 seconds
    );

    // Delete from vector database after transaction
    if ((updatedNote as any).existingChunks.length > 0) {
      const vectorIds = (updatedNote as any).existingChunks.map(
        (chunk: any) => chunk.vectorId
      );
      await notesIndex.deleteMany(vectorIds);
    }

    // Upsert new vectors to database
    await notesIndex.upsert((updatedNote as any).vectorUpserts);

    // Clean up temporary properties
    delete (updatedNote as any).existingChunks;
    delete (updatedNote as any).vectorUpserts;

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

export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "12");
    const search = url.searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    // Build where clause for search
    const whereClause = {
      userId,
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { content: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    // Get total count for pagination
    const totalCount = await prisma.note.count({
      where: whereClause,
    });

    // Get paginated notes
    const notes = await prisma.note.findMany({
      where: whereClause,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    });

    return Response.json({
      notes,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasMore: skip + notes.length < totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
