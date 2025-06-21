"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { Bot, Send, Share2, Loader2, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "@/components/main/markdown.css";

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
  const scrollRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use the chat hook with custom API endpoint for shared chat
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
  });

  // Auto scroll to bottom function
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  // Fetch shared chat data
  useEffect(() => {
    const fetchSharedChat = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/shared-chat/${token}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError(
              "This shared chat is no longer available or sharing has been disabled."
            );
          } else {
            setError("Failed to load shared chat.");
          }
          return;
        }

        const data: SharedChatData = await response.json();
        setSharedChatData(data);

        // Load existing messages
        const existingMessages = data.messages.map((msg) => ({
          id: msg.id,
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }));
        setMessages(existingMessages);
      } catch (err) {
        setError("Failed to load shared chat.");
        console.error("Error fetching shared chat:", err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchSharedChat();
    }
  }, [token, setMessages]);

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
  }, [loading]);

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast("Share link copied to clipboard!", "success");
    } catch (err) {
      console.error("Failed to copy link:", err);
      showToast("Failed to copy link to clipboard", "error");
    }
  };

  if (loading) {
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
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 px-4 py-2">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{sharedChatData?.title}</h1>
            <p className="text-sm text-muted-foreground">
              Shared Chat •{" "}
              {new Date(sharedChatData?.createdAt || "").toLocaleDateString()}
            </p>
          </div>
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
        </div>

        {/* Input Area - exact same structure as aichatbox */}
        <div className="">
          <form
            onSubmit={handleSubmit}
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
            </Button>
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
