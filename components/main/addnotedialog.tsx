"use client";

import { createNoteSchema, CreateNoteSchema } from "@/lib/validation/note";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import LoadingButton from "./loadingbutton";
import { useRouter } from "next/navigation";
import { Note } from "@prisma/client";
import { useState } from "react";
import { Trash } from "lucide-react";

interface AddnotedialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  noteToEdit?: Note;
}

const Addnotedialog = ({ open, setOpen, noteToEdit }: AddnotedialogProps) => {
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  const router = useRouter();

  const form = useForm<CreateNoteSchema>({
    resolver: zodResolver(createNoteSchema),
    defaultValues: {
      title: noteToEdit?.title || "",
      content: noteToEdit?.content || "",
    },
  });

  async function onSubmit(input: CreateNoteSchema) {
    console.log(JSON.stringify(input));
    try {
      if (noteToEdit) {
        const response = await fetch("/api/notes", {
          method: "PUT",
          body: JSON.stringify({
            id: noteToEdit.id,
            ...input,
          }),
        });
        if (!response.ok) throw Error("Status Code: " + response.status);
      } else {
        const response = await fetch("/api/notes", {
          method: "POST",
          body: JSON.stringify(input),
        });

        if (!response.ok) throw Error("Status Code: " + response.status);
        form.reset();
      }

      router.refresh();
      setOpen(false);
    } catch (error) {
      console.error(error);
      alert("Something went wrong, Please try again later!");
    }
  }

  async function deleteNote() {
    if (!noteToEdit) return;
    setDeleteInProgress(true);

    try {
      const response = await fetch("/api/notes", {
        method: "DELETE",
        body: JSON.stringify({
          id: noteToEdit.id,
        }),
      });

      if (!response.ok) throw Error("Status Code: " + response.status);

      router.refresh();
      setOpen(false);
    } catch (error) {
      console.error(error);
      alert("Something went wrong, Please try again later!");
    } finally {
      setDeleteInProgress(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="min-w-[60vw]">
        <DialogHeader>
          <DialogTitle>{noteToEdit ? "Edit Data" : "Add Data"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Add title for your data" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add your data here"
                      className="min-h-[50vh]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="gap-1 flex-row justify-between">
              {noteToEdit && (
                <LoadingButton
                  variant={"secondary"}
                  loading={deleteInProgress}
                  disabled={form.formState.isSubmitting}
                  onClick={deleteNote}
                  type="button"
                  className="w-max"
                >
                  <Trash />
                </LoadingButton>
              )}
              <LoadingButton
                type="submit"
                loading={form.formState.isSubmitting}
                disabled={deleteInProgress}
                className="w-max"
              >
                Submit
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default Addnotedialog;
