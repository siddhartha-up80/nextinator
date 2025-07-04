"use client";

import { createNoteSchema, CreateNoteSchema } from "@/lib/validation/note";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
} from "../ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import LoadingButton from "./loadingbutton";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  CheckCircle, 
  Copy, 
  Trash, 
  FileText, 
  Upload, 
  Plus,
  X,
  Pin
} from "lucide-react";
import { Button } from "../ui/button";
import { useToast } from "@/components/ui/toast";
import { getPinnedNotes, setPinnedNotes, isNotePinned } from "@/lib/pin-utils";
import pdfToText from "react-pdftotext";

interface AddnotedialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  noteToEdit?: any;
  onSuccess?: () => void;
}

interface Group {
  id: string;
  name: string;
  color: string;
  _count: {
    notes: number;
  };
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
  const [groups, setGroups] = useState<Group[]>([]);
  const [showNewGroupInput, setShowNewGroupInput] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const { showToast } = useToast();

  // Pin functionality
  const togglePin = (noteId: string) => {
    const pinnedNotes = getPinnedNotes();
    const isCurrentlyPinned = pinnedNotes.includes(noteId);
    
    let updatedPinnedNotes;
    if (isCurrentlyPinned) {
      updatedPinnedNotes = pinnedNotes.filter((id: string) => id !== noteId);
      showToast("Note unpinned", "success");
    } else {
      updatedPinnedNotes = [...pinnedNotes, noteId];
      showToast("Note pinned", "success");
    }
    
    setPinnedNotes(updatedPinnedNotes);
    setIsPinned(!isCurrentlyPinned);
    
    // Close dialog and refresh the page to update the note order
    setOpen(false);
    if (onSuccess) {
      onSuccess();
    } else {
      router.refresh();
    }
  };

  // Check if current note is pinned on load
  useEffect(() => {
    if (noteToEdit?.id) {
      setIsPinned(isNotePinned(noteToEdit.id));
    } else {
      setIsPinned(false);
    }
  }, [noteToEdit]);

  const handleCopy = (content: any) => {
    navigator.clipboard
      .writeText(content)
      .then(() => {
        setCopied(true);
        showToast("Content copied to clipboard!", "success");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((error) => {
        console.error("Failed to copy content:", error);
        showToast("Failed to copy content", "error");
      });
  };

  const router = useRouter();
  const form = useForm<CreateNoteSchema>({
    resolver: zodResolver(createNoteSchema),
    defaultValues: {
      title: noteToEdit?.title || "",
      content: noteToEdit?.content || "",
      groupId: noteToEdit?.groupId || "",
    },
  });

  // Fetch groups when dialog opens
  useEffect(() => {
    if (open) {
      fetchGroups();
    }
  }, [open]);

  // Reset form when noteToEdit changes
  useEffect(() => {
    if (open) {
      form.reset({
        title: noteToEdit?.title || "",
        content: noteToEdit?.content || "",
        groupId: noteToEdit?.groupId || "",
      });
    } else {
      // Clear form when dialog closes
      form.reset({
        title: "",
        content: "",
        groupId: "",
      });
      setUploadMode("text");
      setSelectedFile(null);
      setUploadStatus("");
      setShowNewGroupInput(false);
      setNewGroupName("");
    }
  }, [noteToEdit, open, form]);

  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/groups");
      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups);
      }
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    }
  };

  const createNewGroup = async () => {
    if (!newGroupName.trim()) return;

    setCreatingGroup(true);
    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newGroupName.trim(),
          color: "blue", // Default color
        }),
      });

      if (response.ok) {
        const newGroup = await response.json();
        setGroups((prev) => [...prev, newGroup.group]);
        form.setValue("groupId", newGroup.group.id);
        setNewGroupName("");
        setShowNewGroupInput(false);
        showToast("Group created successfully!", "success");
      } else {
        throw new Error("Failed to create group");
      }
    } catch (error) {
      console.error("Error creating group:", error);
      showToast("Failed to create group", "error");
    } finally {
      setCreatingGroup(false);
    }
  };
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        showToast("Please select a valid PDF file.", "error");
        event.target.value = "";
        return;
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        showToast("File size must be less than 10MB.", "error");
        event.target.value = "";
        return;
      }

      setSelectedFile(file);
      setUploadStatus("");
      showToast("PDF file selected successfully", "success");
    }
  };
  async function processPDFAndUpload(
    title: string,
    file: File,
    groupId?: string
  ) {
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
          groupId: groupId || null,
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
      showToast("PDF uploaded and processed successfully!", "success");
      return response.json();
    } catch (error) {
      console.error("PDF processing error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      showToast(`Failed to process PDF: ${errorMessage}`, "error");
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
        await processPDFAndUpload(input.title, selectedFile, input.groupId);
        setSelectedFile(null);
        form.reset();
        showToast("Note created from PDF successfully!", "success");
      } else if (noteToEdit) {
        const response = await fetch("/api/notes", {
          method: "PUT",
          body: JSON.stringify({
            id: noteToEdit.id,
            ...input,
          }),
        });
        if (!response.ok) throw Error("Status Code: " + response.status);
        showToast("Note updated successfully!", "success");
      } else {
        const response = await fetch("/api/notes", {
          method: "POST",
          body: JSON.stringify(input),
        });
        if (!response.ok) throw Error("Status Code: " + response.status);
        form.reset();
        showToast("Note created successfully!", "success");
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
      setOpen(false);
    } catch (error) {
      console.error(error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Something went wrong, Please try again later!";
      showToast(errorMessage, "error");
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

      showToast("Note deleted successfully!", "success");
      router.refresh();
      setOpen(false);
    } catch (error) {
      console.error(error);
      showToast("Failed to delete note. Please try again later!", "error");
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
          setIsPinned(false);
          form.reset();
        }
      }}
    >
      <DialogContent 
        className="max-w-[600px] h-[80vh] p-0 rounded-xl border-0 shadow-2xl overflow-hidden dark:shadow-gray-900/50 bg-white dark:bg-gray-800 [&>button]:hidden"
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col">
            {/* Header with pin and close */}
            <div className="flex items-center justify-between p-3 pb-1">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => noteToEdit?.id ? togglePin(noteToEdit.id) : null}
                  className={`p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${
                    isPinned ? 'text-orange-500' : 'text-gray-600 dark:text-gray-400'
                  } ${!noteToEdit?.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={!noteToEdit?.id ? "Save note first to pin" : (isPinned ? "Unpin note" : "Pin note")}
                  disabled={!noteToEdit?.id}
                >
                  <Pin className="w-4 h-4" />
                </Button>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-gray-600 dark:text-gray-400"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Mode Toggle for new notes */}
            {!noteToEdit && (
              <div className="px-3 pb-1">
                <div className="flex gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-lg">
                  <Button
                    type="button"
                    variant={uploadMode === "text" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setUploadMode("text")}
                    className="flex items-center gap-2 rounded-md"
                  >
                    <FileText className="w-4 h-4" />
                    Text
                  </Button>
                  <Button
                    type="button"
                    variant={uploadMode === "pdf" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setUploadMode("pdf")}
                    className="flex items-center gap-2 rounded-md"
                  >
                    <Upload className="w-4 h-4" />
                    PDF
                  </Button>
                </div>
              </div>
            )}

            {/* Title Field */}
            <div className="px-3 pb-1">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Title"
                        {...field}
                        className="border-0 bg-transparent text-lg font-medium placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-0 focus:border-0 px-0 shadow-none text-gray-900 dark:text-gray-100"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Content Field */}
            <div className="px-3 pb-2 flex-1 flex flex-col">
              {uploadMode === "pdf" && !noteToEdit ? (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                    <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Drop PDF here or click to browse</p>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="pdf-upload"
                    />
                    <label
                      htmlFor="pdf-upload"
                      className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer transition-colors"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose PDF
                    </label>
                  </div>
                  {selectedFile && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-green-800 dark:text-green-200 text-sm">✓ {selectedFile.name}</p>
                    </div>
                  )}
                  {uploadStatus && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-blue-800 dark:text-blue-200 text-sm">{uploadStatus}</p>
                    </div>
                  )}
                </div>
              ) : (
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem className="flex-1 flex flex-col">
                      <FormControl className="flex-1">
                        <Textarea
                          placeholder="Take a note..."
                          {...field}
                          className="border-0 bg-transparent resize-none h-full min-h-[150px] placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-0 focus:border-0 px-0 shadow-none text-gray-900 dark:text-gray-100"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Group Selection */}
            <div className="px-3 pb-2">
              <FormField
                control={form.control}
                name="groupId"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <select
                            {...field}
                            className="flex-1 w-[70%] px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                          >
                            <option value="" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">No Group</option>
                            {groups.map((group) => (
                              <option key={group.id} value={group.id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                                {group.name} ({group._count.notes} notes)
                              </option>
                            ))}
                          </select>

                          {!showNewGroupInput ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowNewGroupInput(true)}
                              className="w-[30%] text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Create Group
                            </Button>
                          ) : (
                            <div className="w-[30%] flex gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setShowNewGroupInput(false);
                                  setNewGroupName("");
                                }}
                                className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs px-2"
                              >
                                Cancel
                              </Button>
                            </div>
                          )}
                        </div>

                        {showNewGroupInput && (
                          <div className="flex gap-2">
                            <Input
                              placeholder="Group name"
                              value={newGroupName}
                              onChange={(e) => setNewGroupName(e.target.value)}
                              onKeyPress={(e) =>
                                e.key === "Enter" && createNewGroup()
                              }
                              className="text-sm flex-1"
                            />
                            <LoadingButton
                              type="button"
                              size="sm"
                              loading={creatingGroup}
                              onClick={createNewGroup}
                              disabled={!newGroupName.trim()}
                              className="px-4"
                            >
                              Add
                            </LoadingButton>
                          </div>
                        )}
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between px-3 py-2 border-t border-black/10 dark:border-white/10">
              <div className="flex items-center gap-2">
                {/* Copy Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(form.getValues("content"))}
                  className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm"
                  title="Copy content"
                >
                  {copied ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>

                {/* Delete Button (only for existing notes) */}
                {noteToEdit && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={deleteNote}
                    disabled={deleteInProgress}
                    className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm"
                    title="Delete note"
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Right side actions */}
              <div className="flex items-center gap-2">
                {/* Submit Button */}
                <LoadingButton
                  type="submit"
                  loading={form.formState.isSubmitting || uploadInProgress}
                  disabled={
                    deleteInProgress ||
                    (uploadMode === "pdf" && !selectedFile && !noteToEdit)
                  }
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium"
                >
                  {uploadMode === "pdf" && !noteToEdit
                    ? "Upload PDF"
                    : noteToEdit
                    ? "Update"
                    : "Done"}
                </LoadingButton>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default Addnotedialog;
