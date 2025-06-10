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
import { useState } from "react";
import { CheckCircle, Copy, Trash, FileText, Upload } from "lucide-react";
import { Button } from "../ui/button";
import pdfToText from "react-pdftotext";

interface AddnotedialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  noteToEdit?: any;
  onSuccess?: () => void;
}

const Addnotedialog = ({
  open,
  setOpen,
  noteToEdit,
  onSuccess,
}: AddnotedialogProps) => {
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploadMode, setUploadMode] = useState<"text" | "pdf">("text");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadInProgress, setUploadInProgress] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");

  const handleCopy = (content: any) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const router = useRouter();
  const form = useForm<CreateNoteSchema>({
    resolver: zodResolver(createNoteSchema),
    defaultValues: {
      title: noteToEdit?.title || "",
      content: noteToEdit?.content || "",
    },
  });
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        alert("Please select a valid PDF file.");
        event.target.value = "";
        return;
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert("File size must be less than 10MB.");
        event.target.value = "";
        return;
      }

      setSelectedFile(file);
      setUploadStatus("");
    }
  };
  async function processPDFAndUpload(title: string, file: File) {
    try {
      setUploadStatus("Extracting text from PDF...");

      // Extract text using react-pdftotext
      const extractedText = await pdfToText(file);

      console.log("Extracted text:", extractedText);

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error("No text content found in PDF");
      }
      setUploadStatus("Processing extracted text and generating embeddings...");

      // Send the extracted text to the backend
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content: extractedText,
          sourceType: "pdf",
          fileName: file.name,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to save PDF content";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      setUploadStatus("PDF processed successfully!");
      return response.json();
    } catch (error) {
      console.error("PDF processing error:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to process PDF: ${error.message}`);
      } else {
        throw new Error("Failed to process PDF: Unknown error occurred");
      }
    }
  }

  async function onSubmit(input: CreateNoteSchema) {
    console.log(JSON.stringify(input));
    try {
      if (uploadMode === "pdf" && selectedFile) {
        setUploadInProgress(true);
        await processPDFAndUpload(input.title, selectedFile);
        setSelectedFile(null);
        form.reset();
      } else if (noteToEdit) {
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

      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
      setOpen(false);
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong, Please try again later!"
      );
    } finally {
      setUploadInProgress(false);
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
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          // Reset state when dialog closes
          setUploadMode("text");
          setSelectedFile(null);
          setUploadStatus("");
          form.reset();
        }
      }}
    >
      <DialogContent className="min-w-[60vw]">
        <DialogHeader>
          <DialogTitle>{noteToEdit ? "Edit Data" : "Add Data"}</DialogTitle>
        </DialogHeader>

        {/* Mode Toggle */}
        {!noteToEdit && (
          <div className="flex gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Button
              type="button"
              variant={uploadMode === "text" ? "default" : "outline"}
              size="sm"
              onClick={() => setUploadMode("text")}
              className="flex items-center gap-2"
            >
              <FileText size={16} />
              Text Input
            </Button>
            <Button
              type="button"
              variant={uploadMode === "pdf" ? "default" : "outline"}
              size="sm"
              onClick={() => setUploadMode("pdf")}
              className="flex items-center gap-2"
            >
              <Upload size={16} />
              PDF Upload
            </Button>
          </div>
        )}

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
            {uploadMode === "text" || noteToEdit ? (
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
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">Upload PDF File</label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label
                    htmlFor="pdf-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload size={32} className="text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedFile
                        ? selectedFile.name
                        : "Click to select a PDF file"}
                    </span>
                    <span className="text-xs text-gray-500">
                      PDF files only, max 10MB
                    </span>
                  </label>
                </div>{" "}
                {selectedFile && (
                  <div className="text-sm text-green-600 dark:text-green-400">
                    ✓ File selected: {selectedFile.name}
                  </div>
                )}
                {uploadStatus && (
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    {uploadStatus}
                  </div>
                )}
              </div>
            )}{" "}
            <DialogFooter className="gap-1 flex-row w-full">
              <div className="gap-1 flex-row w-full justify-between items-center flex">
                {uploadMode === "text" || noteToEdit ? (
                  <LoadingButton
                    variant={"secondary"}
                    loading={deleteInProgress}
                    disabled={form.formState.isSubmitting || uploadInProgress}
                    onClick={() => handleCopy(form.getValues("content"))}
                    type="button"
                    className="w-max"
                  >
                    {copied ? (
                      <>
                        Copied <CheckCircle size={18} className="ml-2" />
                      </>
                    ) : (
                      <>
                        Copy <Copy size={18} className="ml-2" />
                      </>
                    )}
                  </LoadingButton>
                ) : (
                  <div /> /* Empty div for spacing */
                )}
                <div className="gap-2 flex-row justify-between items-center flex">
                  {noteToEdit && (
                    <LoadingButton
                      variant={"secondary"}
                      loading={deleteInProgress}
                      disabled={form.formState.isSubmitting || uploadInProgress}
                      onClick={deleteNote}
                      type="button"
                      className="w-max"
                    >
                      <Trash />
                    </LoadingButton>
                  )}
                  <LoadingButton
                    type="submit"
                    loading={form.formState.isSubmitting || uploadInProgress}
                    disabled={
                      deleteInProgress ||
                      (uploadMode === "pdf" && !selectedFile)
                    }
                    className="w-max"
                  >
                    {uploadMode === "pdf" && !noteToEdit
                      ? "Upload & Process PDF"
                      : "Submit"}
                  </LoadingButton>
                </div>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default Addnotedialog;
