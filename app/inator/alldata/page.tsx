import React from "react";
import { auth } from "@clerk/nextjs";
import prisma from "@/lib/db/prisma";
import { Metadata } from "next";
import Note from "@/components/main/note";

export const metadata: Metadata = {
  title: "Nextinator | Your All Data",
};

const Page = async () => {
  const { userId } = auth();

  if (!userId) throw Error("userId undefined");

  const allNotes = await prisma?.note.findMany({ where: { userId } });

  return (
    <div className="py-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {allNotes.map((note) => (
          <Note note={note} key={note.id} />
        ))}
        {allNotes.length === 0 && (
          <div className="text-center col-span-full">
            <h1 className="text-2xl font-bold">
              Oh no!
              <br />
              You haven't added any data yet.
            </h1>
            <p className="mt-1 text-base">But you can change that!</p>
            <p className="mt-1 text-base">
              Just click on the "Add Data" button and add your custom data.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
