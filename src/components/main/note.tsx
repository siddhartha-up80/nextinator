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
import { FolderIcon, Pin } from "lucide-react";
import { isNotePinned } from "@/lib/pin-utils";
import { useEffect, useState } from "react";

interface NoteWithGroup extends NoteModel {
  group?: {
    id: string;
    name: string;
    color: string;
  } | null;
}

interface NoteProps {
  note: NoteWithGroup;
}

const Note = ({ note }: NoteProps) => {
  const router = useRouter();
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    setIsPinned(isNotePinned(note.id));
  }, [note.id]);

  const wasUpdated = note.updatedAt > note.createdAt;

  const createdUpdatedAtTimestamp = (
    wasUpdated ? note.updatedAt : note.createdAt
  ).toDateString();

  const handleClick = () => {
    router.push(`/inator/note/${note.id}`);
  };

  return (
    <Card
      className={`cursor-pointer hover:shadow-md transition-all duration-300 ease-in-out hover:shadow-red-500 max-w-[90vw] ${
        isPinned ? 'ring-2 ring-orange-200 dark:ring-orange-800' : ''
      }`}
      onClick={handleClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {isPinned && <Pin className="w-4 h-4 text-orange-500" />}
              {note.title}
              {note.group && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <FolderIcon size={12} />
                  <span>{note.group.name}</span>
                </div>
              )}
            </CardTitle>
            <CardDescription>
              {createdUpdatedAtTimestamp}
              {wasUpdated && " (updated)"}
            </CardDescription>
          </div>
          {note.group && (
            <div
              className="w-3 h-3 rounded-full bg-indigo-500 flex-shrink-0"
              title={note.group.name}
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="md:max-h-[50vh] max-h-[80vh] overflow-y-auto">
        <p className="whitespace-pre-line">{note.content}</p>
      </CardContent>
    </Card>
  );
};

export default Note;
