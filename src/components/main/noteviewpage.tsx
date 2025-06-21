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
import { Button } from "../ui/button";
import { ArrowLeft, Edit, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "../ui/toast";
import { ConfirmDialog } from "../ui/confirm-dialog";

interface NoteViewPageProps {
  note: NoteModel;
}

const NoteViewPage = ({ note }: NoteViewPageProps) => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const wasUpdated = note.updatedAt > note.createdAt;

  const createdUpdatedAtTimestamp = (
    wasUpdated ? note.updatedAt : note.createdAt
  ).toDateString();

  const handleGoBack = () => {
    router.back();
  };

  const handleDelete = async () => {
    setDeleteInProgress(true);

    try {
      const response = await fetch("/api/notes", {
        method: "DELETE",
        body: JSON.stringify({
          id: note.id,
        }),
      });
      if (!response.ok) throw Error("Status Code: " + response.status);

      showToast("Note deleted successfully!", "success");
      router.push("/inator");
    } catch (error) {
      console.error(error);
      showToast("Failed to delete note. Please try again later!", "error");
    } finally {
      setDeleteInProgress(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-card">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={handleGoBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft size={20} />
                Back
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowEditDialog(true)}
                  className="flex items-center gap-2"
                >
                  <Edit size={16} />
                  Edit
                </Button>{" "}
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={deleteInProgress}
                  className="flex items-center gap-2"
                >
                  <Trash size={16} />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Note Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="shadow-none border-0 bg-transparent">
            <CardHeader className="px-0">
              <CardTitle className="text-3xl">{note.title}</CardTitle>
              <CardDescription className="text-lg">
                {createdUpdatedAtTimestamp}
                {wasUpdated && " (updated)"}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <div className="prose max-w-none">
                <p className="whitespace-pre-line text-base leading-relaxed">
                  {note.content}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>{" "}
      <Addnotedialog
        open={showEditDialog}
        setOpen={setShowEditDialog}
        noteToEdit={note}
        onSuccess={() => {
          router.refresh();
          setShowEditDialog(false);
        }}
      />
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Note"
        description={`Are you sure you want to delete "${note.title}"? This action cannot be undone and the note will be permanently removed.`}
        confirmText="Delete Note"
        cancelText="Cancel"
        onConfirm={handleDelete}
        variant="destructive"
        loading={deleteInProgress}
      />
    </>
  );
};

export default NoteViewPage;
