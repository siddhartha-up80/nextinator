import prisma from "@/lib/db/prisma";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import NoteViewPage from "@/components/main/noteviewpage";

interface NotePageProps {
  params: Promise<{ id: string }>;
}

async function NoteDetailPage({ params }: NotePageProps) {
  const { userId } = await auth();

  if (!userId) {
    throw Error("User ID undefined");
  }

  const { id } = await params;

  const note = await prisma.note.findUnique({
    where: { id: id, userId: userId },
  });

  if (!note) {
    notFound();
  }

  return <NoteViewPage note={note} />;
}

export default NoteDetailPage;
