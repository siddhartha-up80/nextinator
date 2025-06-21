"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  Bot,
  Send,
  Share2,
  Loader2,
  AlertCircle,
  Database,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "@/components/main/markdown.css";
import {
  saveSharedChatToStorage,
  getSharedChatFromStorage,
  updateSharedChatInStorage,
} from "@/lib/shared-chat-storage";

interface SharedChatData {
  id: string;
  title: string;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    createdAt: string;
  }>;
}

function SharedChatContent() {
  const params = useParams();
  const token = params.token as string;
  const { showToast } = useToast();

  const [sharedChatData, setSharedChatData] = useState<SharedChatData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadedFromCache, setLoadedFromCache] = useState(false);
  const [usingExtendedCache, setUsingExtendedCache] = useState(false);
  const scrollRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isFetchingRef = useRef(false);
  const previousMessageCountRef = useRef(0); // Use the chat hook with custom API endpoint for shared chat
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    setMessages,
    isLoading,
    error: chatError,
  } = useChat({
    api: `/api/shared-chat/${token}/chat`,
  }); // Auto scroll to bottom function
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };
  // Fetch shared chat data
  useEffect(() => {
    const fetchSharedChat = async () => {
      // Prevent multiple concurrent requests
      if (isFetchingRef.current) return;

      try {
        isFetchingRef.current = true;
        setLoading(true);
        setError(null); // First, try to load from localStorage
        const cachedChat = getSharedChatFromStorage(token);

        if (cachedChat) {
          setSharedChatData({
            id: cachedChat.id,
            title: cachedChat.title,
            isShared: true,
            createdAt: cachedChat.createdAt,
            updatedAt: cachedChat.updatedAt,
            messages: cachedChat.messages,
          });

          // Load cached messages immediately
          const cachedMessages = cachedChat.messages.map((msg) => ({
            id: msg.id,
            role: msg.role as "user" | "assistant",
            content: msg.content,
          }));
          setMessages(cachedMessages);
          setLoadedFromCache(true);
          setLoading(false);

          // Show cache indicator
          showToast(
            "Loaded from cache - fetching latest updates...",
            "success"
          );
        }

        // Always try to fetch fresh data from server
        const response = await fetch(`/api/shared-chat/${token}`);

        if (!response.ok) {
          if (response.status === 404) {
            const errorMsg =
              "This shared chat is no longer available or sharing has been disabled.";
            setError(errorMsg); // If we had cached data but server says not found, clear cache
            if (cachedChat) {
              updateSharedChatInStorage(token, []); // Clear cached messages
              showToast("Shared chat is no longer available", "error");
            }
          } else {
            const errorMsg = "Failed to load shared chat.";
            setError(cachedChat ? null : errorMsg); // Don't show error if we have cache

            if (!cachedChat) {
              showToast(errorMsg, "error");
            } else {
              showToast("Using cached version - server unavailable", "error");
            }
          }
          return;
        }
        const data: SharedChatData = await response.json();

        // Check if localStorage has more recent messages
        const cachedChatUpdate = getSharedChatFromStorage(token);
        const serverMessageCount = data.messages.length;
        const cachedMessageCount = cachedChatUpdate
          ? cachedChatUpdate.messages.length
          : 0;
        if (cachedChatUpdate && cachedMessageCount > serverMessageCount) {
          // Use cached data as it has more messages (conversation continued)
          setSharedChatData({
            ...data, // Use server data for metadata
            messages: cachedChatUpdate.messages, // But use cached messages
          });

          const cachedMessages = cachedChatUpdate.messages.map((msg) => ({
            id: msg.id,
            role: msg.role as "user" | "assistant",
            content: msg.content,
          }));
          setMessages(cachedMessages);
          setUsingExtendedCache(true);

          if (loadedFromCache) {
            showToast("Continued with your conversation", "success");
          }
        } else {
          // Use server data (it's more recent or same)
          setSharedChatData(data);

          const freshMessages = data.messages.map((msg) => ({
            id: msg.id,
            role: msg.role as "user" | "assistant",
            content: msg.content,
          }));
          setMessages(freshMessages); // Save fresh data to localStorage
          saveSharedChatToStorage(token, data);

          if (loadedFromCache) {
            showToast("Updated with latest data", "success");
          }
        }
      } catch (err) {
        const errorMsg = "Failed to load shared chat.";
        console.error("Error fetching shared chat:", err); // If we have cached data, use it and show a warning
        const cachedChatFallback = getSharedChatFromStorage(token);
        if (cachedChatFallback && !loadedFromCache) {
          setSharedChatData({
            id: cachedChatFallback.id,
            title: cachedChatFallback.title,
            isShared: true,
            createdAt: cachedChatFallback.createdAt,
            updatedAt: cachedChatFallback.updatedAt,
            messages: cachedChatFallback.messages,
          });

          const cachedMessages = cachedChatFallback.messages.map((msg) => ({
            id: msg.id,
            role: msg.role as "user" | "assistant",
            content: msg.content,
          }));
          setMessages(cachedMessages);
          setLoadedFromCache(true);
          showToast("Using cached version - connection failed", "error");
        } else if (!cachedChatFallback) {
          setError(errorMsg);
          showToast(errorMsg, "error");
        }
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    };

    if (token) {
      fetchSharedChat();
    }
  }, [token]);
  // Auto-scroll exactly like in aichatbox
  useEffect(() => {
    if (inputRef.current) {
      if (scrollRef.current)
        scrollRef.current.scrollTop = scrollRef.current?.scrollHeight;
    }
  }, [messages]);

  // Scroll to bottom after initial data load
  useEffect(() => {
    if (!loading && messages.length > 0) {
      // Small delay to ensure the DOM is rendered
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [loading]); // Save messages to localStorage when new messages are added
  useEffect(() => {
    if (
      messages.length > 0 &&
      sharedChatData &&
      !loading &&
      !isFetchingRef.current
    ) {
      // Check if new messages were added
      const currentCount = messages.length;
      const previousCount = previousMessageCountRef.current;
      if (currentCount > previousCount) {
        // New messages detected, save immediately
        const messagesToSave = messages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
        }));
        updateSharedChatInStorage(token, messagesToSave);
      }

      // Update the previous count
      previousMessageCountRef.current = currentCount;
    }
  }, [messages, sharedChatData, token, loading]);
  // Save messages when component unmounts or page is about to close
  useEffect(() => {
    const saveOnUnload = () => {
      if (messages.length > 0 && sharedChatData) {
        const messagesToSave = messages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
        }));
        updateSharedChatInStorage(token, messagesToSave);
      }
    };

    const handleBeforeUnload = () => {
      saveOnUnload();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      saveOnUnload(); // Save on component unmount
    };
  }, [messages, sharedChatData, token]);

  // Periodic auto-save as backup (every 5 seconds)
  useEffect(() => {
    if (messages.length > 0 && sharedChatData && !loading) {
      const interval = setInterval(() => {
        const messagesToSave = messages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
        }));
        updateSharedChatInStorage(token, messagesToSave);
      }, 5000); // Save every 5 seconds

      return () => clearInterval(interval);
    }
  }, [messages, sharedChatData, token, loading]);
  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast("Share link copied to clipboard!", "success");
    } catch (err) {
      console.error("Failed to copy link:", err);
      showToast("Failed to copy link to clipboard", "error");
    }
  }; // Custom submit handler to ensure messages are saved
  const handleChatSubmit = (e: React.FormEvent) => {
    const currentInput = input.trim();
    handleSubmit(e);

    // Force save after a brief delay to ensure the message is added to state
    if (sharedChatData && currentInput) {
      setTimeout(() => {
        const messagesToSave = messages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
        }));
        updateSharedChatInStorage(token, messagesToSave);
      }, 100);
    }
  };
  if (loading && !loadedFromCache) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading shared chat...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold">Chat Not Available</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {" "}
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 px-4 py-2">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{sharedChatData?.title}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                Shared Chat •{" "}
                {new Date(sharedChatData?.createdAt || "").toLocaleDateString()}
              </span>{" "}
              {loadedFromCache && (
                <span className="flex items-center gap-1 text-blue-600">
                  <Database className="w-3 h-3" />
                  Cached
                </span>
              )}
              {usingExtendedCache && (
                <span className="flex items-center gap-1 text-orange-600 text-xs">
                  {" "}
                  Extended Chat
                </span>
              )}
            </div>
          </div>{" "}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyShareLink}
              className="flex items-center space-x-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Copy Link</span>
            </Button>
          </div>
        </div>
      </div>
      {/* Chat Container - exact same structure as aichatbox */}
      <div className="flex h-[92%] fixed bottom-0 w-full mx-auto flex-col bg-background justify-between">
        <div
          className="mt-3 overflow-y-auto px-3 flex-1 h-full w-full"
          ref={scrollRef}
        >
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Start chatting with this shared knowledge base!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>{" "}
        {/* Input Area - exact same structure as aichatbox */}
        <div className="">
          <form
            onSubmit={handleChatSubmit}
            className="m-3 flex gap-1 max-w-5xl mx-auto"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={copyShareLink}
              className="flex items-center space-x-2 shrink-0"
              type="button"
            >
              <Share2 className="w-4 h-4" />
              <span>Copy</span>
            </Button>{" "}
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask a question about the shared knowledge base..."
              disabled={isLoading}
              className=""
              ref={inputRef}
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
          {chatError && (
            <p className="text-sm text-red-500 mt-2 text-center">
              Error: {chatError.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SharedChatPage() {
  return <SharedChatContent />;
}
