"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  History,
  MessageSquare,
  Trash2,
  Edit3,
  Plus,
  Loader2,
  Share2,
  Copy,
  CheckCircle,
  Shield,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useSharingStatus } from "./sharingstatus";
import { useToast } from "@/components/ui/toast";
import { smartTruncate } from "@/lib/utils";

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  isShared?: boolean;
  shareToken?: string;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    createdAt: string;
  }>;
}

interface ChatHistoryDialogProps {
  onSelectChat: (sessionId: string) => void;
  currentSessionId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export default function ChatHistoryDialog({
  onSelectChat,
  currentSessionId,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  trigger,
}: ChatHistoryDialogProps) {
  const { user } = useUser();
  const { updateSharingStatus: updateGlobalSharingStatus } = useSharingStatus();
  const { showToast } = useToast();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Use external state if provided, otherwise use internal state
  const isOpen = externalOpen !== undefined ? externalOpen : internalIsOpen;
  const setIsOpen =
    externalOnOpenChange !== undefined
      ? externalOnOpenChange
      : setInternalIsOpen;
  const [editTitle, setEditTitle] = useState("");
  const [sharingStatus, setSharingStatus] = useState<
    Record<string, { loading: boolean; copied: boolean; shareUrl?: string }>
  >({});
  const [unshareDialog, setUnshareDialog] = useState<{
    open: boolean;
    sessionId: string;
    sessionTitle: string;
  }>({ open: false, sessionId: "", sessionTitle: "" });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    sessionId: string;
    sessionTitle: string;
  }>({ open: false, sessionId: "", sessionTitle: "" });
  const [unsharingLoading, setUnsharingLoading] = useState(false);
  const [deletingLoading, setDeletingLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const SESSIONS_PER_PAGE = 10;
  const fetchSessions = async (pageNum: number = 1, reset: boolean = true) => {
    if (!user) return;

    if (reset) {
      setLoading(true);
      setSessions([]);
      setPage(1);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await fetch(
        `/api/chat-sessions?page=${pageNum}&limit=${SESSIONS_PER_PAGE}`
      );
      if (response.ok) {
        const data = await response.json();
        const newSessions = data.sessions || data; // Handle both array and object response
        const total = data.total || newSessions.length;

        if (reset) {
          setSessions(newSessions);
        } else {
          setSessions((prev) => [...prev, ...newSessions]);
        } // Initialize sharing status for shared sessions
        const sharedSessions = newSessions.filter(
          (session: ChatSession) => session.isShared && session.shareToken
        );
        if (sharedSessions.length > 0) {
          const newSharingStatus: Record<
            string,
            { loading: boolean; copied: boolean; shareUrl?: string }
          > = {};
          sharedSessions.forEach((session: ChatSession) => {
            if (session.shareToken) {
              newSharingStatus[session.id] = {
                loading: false,
                copied: false,
                shareUrl: `${window.location.origin}/shared-chat/${session.shareToken}`,
              };
            }
          });

          setSharingStatus((prev) =>
            reset ? newSharingStatus : { ...prev, ...newSharingStatus }
          );
        }

        // Check if there are more sessions to load
        const currentTotal = reset
          ? newSessions.length
          : sessions.length + newSessions.length;
        setHasMore(
          currentTotal < total && newSessions.length === SESSIONS_PER_PAGE
        );
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Failed to fetch chat sessions:", error);
      showToast("Failed to load chat history", "error");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };
  useEffect(() => {
    if (isOpen && user) {
      fetchSessions(1, true);
    }
  }, [isOpen, user]);

  // Infinite scroll logic
  const handleScroll = useCallback(() => {
    if (!scrollRef.current || loading || loadingMore || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const threshold = 100; // Load more when 100px from bottom

    if (scrollHeight - scrollTop - clientHeight < threshold) {
      fetchSessions(page + 1, false);
    }
  }, [loading, loadingMore, hasMore, page]);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll);
      return () => scrollElement.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);
  const createNewChat = () => {
    // Instead of creating a session immediately, just clear the current chat
    // The session will be created when the first message is sent
    onSelectChat(""); // Empty string to indicate new/empty chat
    setIsOpen(false);
  };
  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // Find the session for the title and show confirmation dialog
    const session = sessions.find((s) => s.id === sessionId);
    setDeleteDialog({
      open: true,
      sessionId,
      sessionTitle: session?.title || "this chat",
    });
  };

  const confirmDeleteSession = async () => {
    const sessionId = deleteDialog.sessionId;
    const sessionTitle = deleteDialog.sessionTitle;
    if (!sessionId) return;

    setDeletingLoading(true);
    try {
      const response = await fetch(`/api/chat-sessions?id=${sessionId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setSessions(sessions.filter((s) => s.id !== sessionId));
        if (currentSessionId === sessionId) {
          // If current session is deleted, start a new empty chat
          createNewChat();
        }
        // Refresh the list to maintain pagination
        fetchSessions(1, true);
        showToast(`"${sessionTitle}" deleted successfully`, "success");
        setDeleteDialog({ open: false, sessionId: "", sessionTitle: "" });
      } else {
        showToast("Failed to delete chat", "error");
      }
    } catch (error) {
      console.error("Failed to delete chat session:", error);
      showToast("Failed to delete chat", "error");
    } finally {
      setDeletingLoading(false);
    }
  };

  const startEditing = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const saveTitle = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat-sessions/${sessionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editTitle,
        }),
      });

      if (response.ok) {
        setSessions(
          sessions.map((s) =>
            s.id === sessionId ? { ...s, title: editTitle } : s
          )
        );
        setEditingId(null);
        showToast("Chat title updated successfully", "success");
      } else {
        showToast("Failed to update chat title", "error");
      }
    } catch (error) {
      console.error("Failed to update chat title:", error);
      showToast("Failed to update chat title", "error");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };
  const getPreviewText = (session: ChatSession) => {
    if (session.messages && session.messages.length > 0) {
      // Find the last user message (from the end)
      const lastUserMessage = [...session.messages]
        .reverse()
        .find((m) => m.role === "user");
      if (lastUserMessage) {
        return smartTruncate(lastUserMessage.content, 60);
      }
    }
    return "No messages yet";
  };

  const shareSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    setSharingStatus((prev) => ({
      ...prev,
      [sessionId]: { ...prev[sessionId], loading: true },
    }));

    try {
      const response = await fetch(`/api/chat-sessions/${sessionId}/share`, {
        method: "POST",
      });
      if (response.ok) {
        const data = await response.json();
        setSharingStatus((prev) => ({
          ...prev,
          [sessionId]: {
            loading: false,
            copied: false,
            shareUrl: data.shareUrl,
          },
        }));

        // Update the session in the list to show it's shared
        setSessions(
          sessions.map((s) =>
            s.id === sessionId
              ? { ...s, isShared: true, shareToken: data.shareToken }
              : s
          )
        ); // Update global sharing status for navbar sync
        updateGlobalSharingStatus(sessionId, {
          isShared: true,
          shareUrl: data.shareUrl,
        });
        showToast("Chat shared successfully", "success");
      } else {
        showToast("Failed to share chat", "error");
      }
    } catch (error) {
      console.error("Failed to share session:", error);
      showToast("Failed to share chat", "error");
      setSharingStatus((prev) => ({
        ...prev,
        [sessionId]: { ...prev[sessionId], loading: false },
      }));
    }
  };
  const unshareSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // Find the session title for the dialog
    const session = sessions.find((s) => s.id === sessionId);
    setUnshareDialog({
      open: true,
      sessionId,
      sessionTitle: session?.title || "this chat",
    });
  };

  const confirmUnshareSession = async () => {
    const sessionId = unshareDialog.sessionId;
    if (!sessionId) return;

    setUnsharingLoading(true);
    try {
      const response = await fetch(`/api/chat-sessions/${sessionId}/share`, {
        method: "DELETE",
      });
      if (response.ok) {
        setSharingStatus((prev) => {
          const newState = { ...prev };
          delete newState[sessionId];
          return newState;
        });

        // Update the session in the list to show it's no longer shared
        setSessions(
          sessions.map((s) =>
            s.id === sessionId
              ? { ...s, isShared: false, shareToken: undefined }
              : s
          )
        ); // Update global sharing status for navbar sync
        updateGlobalSharingStatus(sessionId, { isShared: false });
        showToast("Chat sharing disabled successfully", "success");
        setUnshareDialog({ open: false, sessionId: "", sessionTitle: "" });
      } else {
        showToast("Failed to disable sharing", "error");
      }
    } catch (error) {
      console.error("Failed to unshare session:", error);
      showToast("Failed to disable sharing", "error");
    } finally {
      setUnsharingLoading(false);
    }
  };
  const copyShareLink = async (
    sessionId: string,
    shareUrl: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(shareUrl);
      setSharingStatus((prev) => ({
        ...prev,
        [sessionId]: { ...prev[sessionId], copied: true },
      }));

      // Show toast notification
      showToast("Share link copied to clipboard!", "success");

      // Reset copied status after 2 seconds
      setTimeout(() => {
        setSharingStatus((prev) => ({
          ...prev,
          [sessionId]: { ...prev[sessionId], copied: false },
        }));
      }, 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
      showToast("Failed to copy link to clipboard", "error");

      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setSharingStatus((prev) => ({
          ...prev,
          [sessionId]: { ...prev[sessionId], copied: true },
        }));
        showToast("Share link copied to clipboard!", "success");
        setTimeout(() => {
          setSharingStatus((prev) => ({
            ...prev,
            [sessionId]: { ...prev[sessionId], copied: false },
          }));
        }, 2000);
      } catch (fallbackError) {
        console.error("Fallback copy failed:", fallbackError);
        showToast("Failed to copy link to clipboard", "error");
      }
      document.body.removeChild(textArea);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!trigger && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <History size={16} className="mr-2" />
            <span className="hidden md:block">Chat History</span>
          </Button>
        </DialogTrigger>
      )}
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <MessageSquare size={20} className="mr-2 shrink-0" />
              <span>Chat History</span>
            </span>
            <Button
              size="sm"
              type="button"
              className="mr-3"
              onClick={() => createNewChat()}
            >
              <Plus size={16} className="mr-1" />
              New
            </Button>
          </DialogTitle>
          <DialogDescription>
            Select a chat to continue the conversation
          </DialogDescription>
        </DialogHeader>{" "}
        <div className="flex-1 overflow-y-auto space-y-2 mt-4" ref={scrollRef}>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="animate-spin mx-auto mb-2" size={32} />
              Loading chats...
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare size={48} className="mx-auto mb-2 opacity-50" />
              No chat history yet
              <p className="text-sm mt-2">Start a new conversation!</p>
            </div>
          ) : (
            <>
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors ${
                    currentSessionId === session.id
                      ? "bg-accent border-primary"
                      : ""
                  }`}
                  onClick={() => {
                    onSelectChat(session.id);
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      {" "}
                      {editingId === session.id ? (
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={() => saveTitle(session.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              saveTitle(session.id);
                            }
                            if (e.key === "Escape") {
                              setEditingId(null);
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="h-8 text-sm"
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-sm truncate">
                            {session.title}
                          </h4>{" "}
                          {session.isShared && (
                            <div title="Shared chat">
                              <Share2 className="w-3 h-3 text-blue-500 flex-shrink-0" />
                            </div>
                          )}
                        </div>
                      )}
                      {/* <p className="text-xs text-muted-foreground truncate mt-1">
                        {getPreviewText(session)}
                      </p> */}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(session.updatedAt)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => startEditing(session, e)}
                        className="h-6 w-6 p-0"
                      >
                        <Edit3 size={12} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => deleteSession(session.id, e)}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 size={12} />
                      </Button>{" "}
                      {/* Share/Copy Link Button */}
                      {session.isShared ? (
                        <div className="flex items-center space-x-1">
                          {sharingStatus[session.id]?.shareUrl && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) =>
                                copyShareLink(
                                  session.id,
                                  sharingStatus[session.id].shareUrl!,
                                  e
                                )
                              }
                              className="h-6 w-6 p-0"
                              title="Copy share link"
                            >
                              {sharingStatus[session.id]?.copied ? (
                                <CheckCircle
                                  className="text-green-500"
                                  size={12}
                                />
                              ) : (
                                <Copy size={12} />
                              )}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => unshareSession(session.id, e)}
                            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700"
                            title="Disable sharing"
                          >
                            <Shield size={12} />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => shareSession(session.id, e)}
                          className="h-6 w-6 p-0"
                          disabled={sharingStatus[session.id]?.loading}
                        >
                          {sharingStatus[session.id]?.loading ? (
                            <Loader2 className="animate-spin" size={12} />
                          ) : (
                            <Share2 size={12} />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading more indicator */}
              {loadingMore && (
                <div className="text-center py-4 text-muted-foreground">
                  <Loader2 className="animate-spin mx-auto mb-2" size={20} />
                  Loading more chats...
                </div>
              )}

              {/* End of list indicator */}
              {!hasMore && sessions.length > 0 && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No more chats to load
                </div>
              )}
            </>
          )}{" "}
        </div>
      </DialogContent>{" "}
      {/* Unshare Confirmation Dialog */}
      <ConfirmDialog
        open={unshareDialog.open}
        onOpenChange={(open) => setUnshareDialog({ ...unshareDialog, open })}
        title="Disable Chat Sharing"
        description={`Are you sure you want to disable sharing for "${unshareDialog.sessionTitle}"? The shared link will no longer work and other users won't be able to access this conversation.`}
        confirmText="Disable Sharing"
        cancelText="Cancel"
        onConfirm={confirmUnshareSession}
        variant="destructive"
        loading={unsharingLoading}
      />
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Delete Chat"
        description={`Are you sure you want to delete "${deleteDialog.sessionTitle}"? This action cannot be undone and all messages in this conversation will be permanently removed.`}
        confirmText="Delete Chat"
        cancelText="Cancel"
        onConfirm={confirmDeleteSession}
        variant="destructive"
        loading={deletingLoading}
      />
    </Dialog>
  );
}
