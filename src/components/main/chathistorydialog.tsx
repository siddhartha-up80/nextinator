"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { History, MessageSquare, Trash2, Edit3, Plus } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
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
}

export default function ChatHistoryDialog({
  onSelectChat,
  currentSessionId,
}: ChatHistoryDialogProps) {
  const { user } = useUser();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const fetchSessions = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch("/api/chat-sessions");
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error("Failed to fetch chat sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      fetchSessions();
    }
  }, [isOpen, user]);
  const createNewChat = () => {
    // Instead of creating a session immediately, just clear the current chat
    // The session will be created when the first message is sent
    console.log(
      "createNewChat called - calling onSelectChat with empty string"
    );
    onSelectChat(""); // Empty string to indicate new/empty chat
    setIsOpen(false);
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this chat?")) return;

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
      }
    } catch (error) {
      console.error("Failed to delete chat session:", error);
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
      }
    } catch (error) {
      console.error("Failed to update chat title:", error);
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
    console.log(session.messages);
    if (session.messages && session.messages.length > 0) {
      // Find the last user message (from the end)
      const lastUserMessage = [...session.messages]
        .reverse()
        .find((m) => m.role === "user");
      if (lastUserMessage) {
        return lastUserMessage.content.slice(0, 60) + "...";
      }
    }
    return "No messages yet";
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <History size={16} className="mr-2" />
          Chat History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <MessageSquare size={20} className="mr-2" />
              Chat History
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
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-2 mt-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading chats...
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare size={48} className="mx-auto mb-2 opacity-50" />
              No chat history yet
              <p className="text-sm mt-2">Start a new conversation!</p>
            </div>
          ) : (
            sessions.map((session) => (
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
                      <h4 className="font-medium text-sm truncate">
                        {session.title}
                      </h4>
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
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
