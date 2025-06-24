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
import { useChatHistory } from "@/contexts/ChatHistoryContext";

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

interface OptimizedChatHistoryDialogProps {
  onSelectChat: (sessionId: string) => void;
  currentSessionId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export default function OptimizedChatHistoryDialog({
  onSelectChat,
  currentSessionId,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  trigger,
}: OptimizedChatHistoryDialogProps) {
  const { user } = useUser();
  const { updateSharingStatus: updateGlobalSharingStatus } = useSharingStatus();
  const { showToast } = useToast();
  const {
    sessions,
    loading,
    loadingMore,
    hasMore,
    error,
    prefetchSessions,
    loadMoreSessions,
    refreshSessions,
    updateSession,
    removeSession,
  } = useChatHistory();

  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // Use external state if provided, otherwise use internal state
  const isOpen = externalOpen !== undefined ? externalOpen : internalIsOpen;
  const setIsOpen =
    externalOnOpenChange !== undefined
      ? externalOnOpenChange
      : setInternalIsOpen;

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

  // Prefetch data when component mounts or user becomes available
  useEffect(() => {
    if (user) {
      prefetchSessions();
    }
  }, [user, prefetchSessions]);

  // Initialize sharing status for shared sessions
  useEffect(() => {
    const sharedSessions = sessions.filter(
      (session: ChatSession) => session.isShared && session.shareToken
    );

    if (sharedSessions.length > 0) {
      const newSharingStatus: Record<
        string,
        { loading: boolean; copied: boolean; shareUrl?: string }
      > = {};

      sharedSessions.forEach((session: ChatSession) => {
        if (session.shareToken && !sharingStatus[session.id]) {
          newSharingStatus[session.id] = {
            loading: false,
            copied: false,
            shareUrl: `${window.location.origin}/shared-chat/${session.shareToken}`,
          };
        }
      });

      if (Object.keys(newSharingStatus).length > 0) {
        setSharingStatus((prev) => ({ ...prev, ...newSharingStatus }));
      }
    }
  }, [sessions, sharingStatus]);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (!scrollRef.current || loadingMore || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;

    if (isNearBottom) {
      loadMoreSessions();
    }
  }, [loadingMore, hasMore, loadMoreSessions]);

  // Add scroll listener
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll, { passive: true });
      return () => scrollElement.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  const handleDialogOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      // Ensure we have fresh data when opening
      if (sessions.length === 0 && !loading) {
        prefetchSessions();
      }
    }
  };

  const createNewChat = useCallback(() => {
    onSelectChat("");
    setIsOpen(false);
  }, [onSelectChat, setIsOpen]);

  const handleSelectChat = useCallback(
    (session: ChatSession) => {
      onSelectChat(session.id);
      setIsOpen(false);
    },
    [onSelectChat, setIsOpen]
  );

  const startEditing = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const saveEdit = async (sessionId: string) => {
    if (!editTitle.trim()) return;

    try {
      const response = await fetch(`/api/chat-sessions/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle.trim() }),
      });

      if (response.ok) {
        updateSession(sessionId, { title: editTitle.trim() });
        showToast("Chat renamed successfully", "success");
      } else {
        showToast("Failed to rename chat", "error");
      }
    } catch (error) {
      console.error("Error renaming chat:", error);
      showToast("Failed to rename chat", "error");
    }

    setEditingId(null);
    setEditTitle("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const handleShare = async (session: ChatSession) => {
    setSharingStatus((prev) => ({
      ...prev,
      [session.id]: { ...prev[session.id], loading: true },
    }));

    try {
      const response = await fetch(`/api/chat-sessions/${session.id}/share`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        const shareUrl = `${window.location.origin}/shared-chat/${data.shareToken}`;

        updateSession(session.id, {
          isShared: true,
          shareToken: data.shareToken,
        });

        setSharingStatus((prev) => ({
          ...prev,
          [session.id]: {
            loading: false,
            copied: false,
            shareUrl,
          },
        }));

        updateGlobalSharingStatus(session.id, {
          isShared: true,
          shareUrl: shareUrl,
        });
        showToast("Chat shared successfully", "success");
      } else {
        throw new Error("Failed to share chat");
      }
    } catch (error) {
      console.error("Error sharing chat:", error);
      showToast("Failed to share chat", "error");
      setSharingStatus((prev) => ({
        ...prev,
        [session.id]: { ...prev[session.id], loading: false },
      }));
    }
  };

  const copyShareLink = async (sessionId: string) => {
    const shareUrl = sharingStatus[sessionId]?.shareUrl;
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setSharingStatus((prev) => ({
        ...prev,
        [sessionId]: { ...prev[sessionId], copied: true },
      }));

      showToast("Share link copied to clipboard", "success");

      setTimeout(() => {
        setSharingStatus((prev) => ({
          ...prev,
          [sessionId]: { ...prev[sessionId], copied: false },
        }));
      }, 2000);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      showToast("Failed to copy link", "error");
    }
  };

  const confirmUnshare = (session: ChatSession) => {
    setUnshareDialog({
      open: true,
      sessionId: session.id,
      sessionTitle: session.title,
    });
  };

  const handleUnshare = async () => {
    if (!unshareDialog.sessionId) return;

    setUnsharingLoading(true);

    try {
      const response = await fetch(
        `/api/chat-sessions/${unshareDialog.sessionId}/share`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        updateSession(unshareDialog.sessionId, {
          isShared: false,
          shareToken: undefined,
        });

        setSharingStatus((prev) => {
          const newStatus = { ...prev };
          delete newStatus[unshareDialog.sessionId];
          return newStatus;
        }); // Update global sharing status for any remaining shared chats
        const hasOtherSharedChats = sessions.some(
          (s) => s.id !== unshareDialog.sessionId && s.isShared
        );
        if (!hasOtherSharedChats) {
          // If no other shared chats exist, we can remove this session from global status
          // The actual removal happens in the local state above
        }

        showToast("Chat unshared successfully", "success");
      } else {
        throw new Error("Failed to unshare chat");
      }
    } catch (error) {
      console.error("Error unsharing chat:", error);
      showToast("Failed to unshare chat", "error");
    }

    setUnsharingLoading(false);
    setUnshareDialog({ open: false, sessionId: "", sessionTitle: "" });
  };

  const confirmDelete = (session: ChatSession) => {
    setDeleteDialog({
      open: true,
      sessionId: session.id,
      sessionTitle: session.title,
    });
  };

  const handleDelete = async () => {
    if (!deleteDialog.sessionId) return;

    setDeletingLoading(true);

    try {
      const response = await fetch(
        `/api/chat-sessions/${deleteDialog.sessionId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        removeSession(deleteDialog.sessionId);
        showToast("Chat deleted successfully", "success");
      } else {
        throw new Error("Failed to delete chat");
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
      showToast("Failed to delete chat", "error");
    }

    setDeletingLoading(false);
    setDeleteDialog({ open: false, sessionId: "", sessionTitle: "" });
  };

  const getPreviewText = (session: ChatSession) => {
    if (session.messages && session.messages.length > 0) {
      const lastMessage = session.messages[session.messages.length - 1];
      return smartTruncate(lastMessage.content, 80);
    }
    return "No messages yet";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
        {!trigger && (
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <History size={16} className="mr-2" />
              <span className="hidden md:block">Chat History</span>
            </Button>
          </DialogTrigger>
        )}
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent className="max-w-4xl max-h-[80vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Chat History
            </DialogTitle>
            <DialogDescription>
              Manage your chat conversations. Click on any chat to continue the
              conversation.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col h-full max-h-[calc(80vh-120px)]">
            {/* New Chat Button */}
            <div className="px-6 py-4 border-b">
              <Button
                onClick={createNewChat}
                className="w-full justify-start gap-2"
                variant="outline"
              >
                <Plus className="w-4 h-4" />
                Start New Chat
              </Button>
            </div>{" "}
            {/* Sessions List */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto"
              onScroll={handleScroll}
            >
              {/* Show loading only if no sessions are cached AND currently loading */}
              {loading && sessions.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Loading chat history...
                </div>
              ) : error && sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-red-500">
                  <p>Error loading chat history</p>
                  <Button
                    variant="outline"
                    onClick={refreshSessions}
                    className="mt-2"
                  >
                    Try Again
                  </Button>
                </div>
              ) : sessions.length === 0 && !loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No chat history</h3>
                  <p className="text-sm text-center max-w-sm">
                    Start a new conversation to see your chat history here.
                  </p>
                </div>
              ) : (
                <div className="space-y-1 p-4">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`group relative p-4 rounded-lg border hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer transition-all ${
                        currentSessionId === session.id
                          ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                      onClick={() => handleSelectChat(session)}
                    >
                      {/* Session Content */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          {editingId === session.id ? (
                            <div
                              className="flex items-center gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="text-sm"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    saveEdit(session.id);
                                  } else if (e.key === "Escape") {
                                    cancelEdit();
                                  }
                                }}
                              />
                              <Button
                                size="sm"
                                onClick={() => saveEdit(session.id)}
                                disabled={!editTitle.trim()}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEdit}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium truncate text-sm">
                                  {session.title}
                                </h3>
                                {session.isShared && (
                                  <Shield className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {getPreviewText(session)}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                {formatDate(session.updatedAt)}
                              </p>
                            </>
                          )}
                        </div>

                        {/* Action Buttons */}
                        {editingId !== session.id && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                            {session.isShared ? (
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyShareLink(session.id);
                                  }}
                                  disabled={
                                    !sharingStatus[session.id]?.shareUrl
                                  }
                                  className="h-7 w-7 p-0"
                                >
                                  {sharingStatus[session.id]?.copied ? (
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    confirmUnshare(session);
                                  }}
                                  className="h-7 w-7 p-0"
                                >
                                  <Shield className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShare(session);
                                }}
                                disabled={sharingStatus[session.id]?.loading}
                                className="h-7 w-7 p-0"
                              >
                                {sharingStatus[session.id]?.loading ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Share2 className="w-3 h-3" />
                                )}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => startEditing(session, e)}
                              className="h-7 w-7 p-0"
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmDelete(session);
                              }}
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Load More Indicator */}
                  {loadingMore && (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Loading more chats...
                    </div>
                  )}

                  {/* End of Results */}
                  {!hasMore && sessions.length > 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      You've reached the end of your chat history
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={unshareDialog.open}
        onOpenChange={(open) => setUnshareDialog({ ...unshareDialog, open })}
        title="Unshare Chat"
        description={`Are you sure you want to stop sharing "${unshareDialog.sessionTitle}"? The shared link will no longer work.`}
        confirmText="Unshare"
        cancelText="Cancel"
        onConfirm={handleUnshare}
        loading={unsharingLoading}
        variant="destructive"
      />

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Delete Chat"
        description={`Are you sure you want to delete "${deleteDialog.sessionTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        loading={deletingLoading}
        variant="destructive"
      />
    </>
  );
}
