"use client";

import { Note as NoteModel } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { useState } from "react";
import Addnotedialog from "./addnotedialog";

interface NoteProps {
  note: NoteModel;
}

const Note = ({ note }: NoteProps) => {
  const [showEditDialog, setShowEditDialog] = useState(false);

  const wasUpdated = note.updatedAt > note.createdAt;

  const createdUpdatedAtTimestamp = (
    wasUpdated ? note.updatedAt : note.createdAt
  ).toDateString();

  return (
    <>
      <Card
        className="cursor-pointer  hover:shadow-md transition-all duration-300 ease-in-out hover:shadow-red-500 max-w-[90vw]"
        onClick={() => setShowEditDialog(true)}
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
      <Addnotedialog
        open={showEditDialog}
        setOpen={setShowEditDialog}
        noteToEdit={note}
      />
    </>
  );
};

export default Note;
