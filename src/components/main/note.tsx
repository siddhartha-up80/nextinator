"use client";

import { Note as NoteModel } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { useRouter } from "next/navigation";

interface NoteProps {
  note: NoteModel;
}

const Note = ({ note }: NoteProps) => {
  const router = useRouter();

  const wasUpdated = note.updatedAt > note.createdAt;

  const createdUpdatedAtTimestamp = (
    wasUpdated ? note.updatedAt : note.createdAt
  ).toDateString();

  const handleClick = () => {
    router.push(`/inator/note/${note.id}`);
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-all duration-300 ease-in-out hover:shadow-red-500 max-w-[90vw]"
      onClick={handleClick}
    >
      <CardHeader>
        <CardTitle>{note.title}</CardTitle>
        <CardDescription>
          {createdUpdatedAtTimestamp}
          {wasUpdated && " (updated)"}
        </CardDescription>
      </CardHeader>
      <CardContent className="md:max-h-[50vh] max-h-[80vh] overflow-y-auto">
        <p className="whitespace-pre-line">{note.content}</p>
      </CardContent>
    </Card>
  );
};

export default Note;
