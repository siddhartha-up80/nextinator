//@ts-nocheck

import { notesIndex } from "@/lib/db/pinecone";
import openai, { getEmbedding } from "@/lib/openai";
import { auth } from "@clerk/nextjs";
import { ChatCompletionMessage } from "openai/resources/index.mjs";
import { OpenAIStream, StreamingTextResponse } from "ai";
import prisma from "@/lib/db/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages: ChatCompletionMessage[] = body.messages;

    const messageTruncated = messages.slice(-6);

    const embedding = await getEmbedding(
      messageTruncated.map((message) => message.content).join("\n")
    );
    const { userId } = auth();

    const vectorQueryResponse = await notesIndex.query({
      vector: embedding,
      topK: 5,
      filter: { userId },
    });

    const relevantNotes = await prisma?.note.findMany({
      where: {
        id: {
          in: vectorQueryResponse.matches.map((match) => match.id),
        },
      },
    });

    // console.log("relevant notes found: ", relevantNotes);

    const systemMessage: ChatCompletionMessage = {
      role: "system",
      content:
        "You are an intelligent custom data app. You answer the user's question based on their existing custom data. You have to only response in text format which contains easy and simple to say words which we speak normally and do not use hard to speak words." +
        "The relevant data for this query are:\n" +
        relevantNotes
          ?.map((note) => `Title: ${note.title}\n\nContent:\n${note.content}`)
          .join("\n\n"),
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      stream: false,
      messages: [systemMessage, ...messageTruncated],
    });

    console.log(response.choices[0].message.content);
    // const stream = OpenAIStream(response);
    // return new StreamingTextResponse(stream);
    return new Response(response.choices[0].message.content);
  } catch (error) {
    console.log(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
