"use client";

import { cn } from "@/lib/utils";
import { useChat } from "@ai-sdk/react";
import {
  Bot,
  CheckCircle,
  Copy,
  StepForward,
  Trash,
  XCircle,
} from "lucide-react";
import { Message } from "ai";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { useEffect, useRef, useState, useCallback } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./markdown.css";

interface AIChatboxProps {
  open?: boolean;
  onclose?: () => void;
  sessionId?: string;
  onSessionChange?: (sessionId: string) => void;
}

export default function AIChatbox({
  open,
  onclose,
  sessionId,
  onSessionChange,
}: AIChatboxProps) {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    setMessages,
    isLoading,
    error,
  } = useChat();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(
    sessionId || null
  );
  const [sessionTitle, setSessionTitle] = useState<string>("New Chat");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLInputElement>(null);
  // Load chat session when sessionId changes
  useEffect(() => {
    // Convert both to string for comparison, treating undefined as empty string
    const sessionIdStr = sessionId || "";
    const currentSessionIdStr = currentSessionId || "";

    if (sessionIdStr !== currentSessionIdStr) {
      if (sessionIdStr === "") {
        // Empty string or undefined means start a new chat
        clearChat();
      } else {
        loadChatSession(sessionIdStr);
      }
    }
  }, [sessionId, currentSessionId]);

  const loadChatSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat-sessions/${sessionId}`);
      if (response.ok) {
        const session = await response.json();
        setMessages(
          session.messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
          }))
        );
        setCurrentSessionId(sessionId);
        setSessionTitle(session.title);
      }
    } catch (error) {
      console.error("Failed to load chat session:", error);
    }
  };
  const saveChatSession = useCallback(async () => {
    if (messages.length === 0) return;

    try {
      // Save messages to database
      const response = await fetch("/api/chat-messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: currentSessionId,
          messages: messages,
          createSession: !currentSessionId, // Create session if none exists
        }),
      });

      if (response.ok) {
        const result = await response.json();

        // If a new session was created, update our current session ID
        if (result.sessionId && !currentSessionId) {
          setCurrentSessionId(result.sessionId);
          onSessionChange?.(result.sessionId);
        }

        // Auto-generate title from first user message if still "New Chat"
        if (sessionTitle === "New Chat" && messages.length > 0) {
          const firstUserMessage = messages.find((m) => m.role === "user");
          if (firstUserMessage) {
            const newTitle = firstUserMessage.content.slice(0, 50) + "...";
            setSessionTitle(newTitle);

            // Update session title in database
            const sessionIdToUpdate = result.sessionId || currentSessionId;
            await fetch(`/api/chat-sessions/${sessionIdToUpdate}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                title: newTitle,
              }),
            });
          }
        }
      }
    } catch (error) {
      console.error("Failed to save chat session:", error);
    }
  }, [messages, currentSessionId, sessionTitle, onSessionChange]);

  // Auto-save messages when they change
  useEffect(() => {
    if (messages.length > 0) {
      saveChatSession();
    }
  }, [messages, saveChatSession]);
  const clearChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setSessionTitle("New Chat");
    onSessionChange?.("");
  };
  // Initialize with empty state - session will be created when first message is sent
  useEffect(() => {
    if (!currentSessionId && !sessionId && messages.length === 0) {
      // Just set up empty state, don't create session yet
      setSessionTitle("New Chat");
    }
  }, []);

  useEffect(() => {
    if (inputRef.current) {
      if (scrollRef.current)
        scrollRef.current.scrollTop = scrollRef.current?.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  const lastMessageIsUser = messages[messages.length - 1]?.role === "user";

  return (
    <div className="flex h-[92%] fixed bottom-0 md:w-[80%] w-[92%] mx-auto flex-col bg-background justify-between">
      <div
        className="mt-3 overflow-y-auto px-3 flex-1 h-full w-full"
        ref={scrollRef}
      >
        {" "}
        {messages.map((message, index) => (
          <ChatMessage
            message={message}
            key={message.id}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            isLastMessage={index === messages.length - 1}
          />
        ))}{" "}
        {isLoading && lastMessageIsUser && (
          <ChatMessage
            message={{
              role: "assistant",
              content: "Thinking...",
            }}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            isLastMessage={true}
          />
        )}
        {error && (
          <ChatMessage
            message={{
              role: "assistant",
              content: "Something went wrong. Please Try Again.",
            }}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            isLastMessage={true}
          />
        )}
        {!error && messages.length === 0 && (
          <div className="gap-2 flex h-full flex-col items-center justify-center">
            <div className="flex gap-3 items-center justify-center">
              <Bot />
              Add your data and Ask the Bot-Inator, it will answer the question
              based on your data. Try using these prompts ⤵️!
            </div>
            <Button
              variant={"secondary"}
              size={"sm"}
              onClick={async () => {
                const syntheticEvent = {
                  target: {
                    value:
                      "Give sample email for applying to the given Job Description: ",
                  },
                };
                handleInputChange(
                  syntheticEvent as React.ChangeEvent<HTMLInputElement>
                );
              }}
            >
              Give sample email for applying to the given Job Description:
            </Button>{" "}
            <Button
              variant={"secondary"}
              size={"sm"}
              onClick={async () => {
                const syntheticEvent = {
                  target: {
                    value: "Customize my cover letter for this job role: ",
                  },
                };
                handleInputChange(
                  syntheticEvent as React.ChangeEvent<HTMLInputElement>
                );
              }}
            >
              Customize my cover letter for this job role:
            </Button>{" "}
            <Button
              variant={"secondary"}
              size={"sm"}
              onClick={async () => {
                const syntheticEvent = {
                  target: {
                    value:
                      "Give sample questions with answers which can be asked from me for this role: ",
                  },
                };
                handleInputChange(
                  syntheticEvent as React.ChangeEvent<HTMLInputElement>
                );
              }}
            >
              Give sample questions with answers which can be asked from me for
              this role:
            </Button>
            <Button
              variant={"secondary"}
              size={"sm"}
              onClick={async () => {
                const syntheticEvent = {
                  target: {
                    value:
                      " Give sample answer for this question in 100 words: ",
                  },
                };
                handleInputChange(
                  syntheticEvent as React.ChangeEvent<HTMLInputElement>
                );
              }}
            >
              Give sample answer for this question in 100 words:
            </Button>
            <Button
              variant={"secondary"}
              size={"sm"}
              onClick={async () => {
                const syntheticEvent = {
                  target: {
                    value: " Give sample answer for this question: ",
                  },
                };
                handleInputChange(
                  syntheticEvent as React.ChangeEvent<HTMLInputElement>
                );
              }}
            >
              Give sample answer for this question:
            </Button>
            <Button
              variant={"secondary"}
              size={"sm"}
              onClick={async () => {
                const syntheticEvent = {
                  target: {
                    value:
                      " Give sample answer for this question based on my resume: ",
                  },
                };
                handleInputChange(
                  syntheticEvent as React.ChangeEvent<HTMLInputElement>
                );
              }}
            >
              Give sample answer for this question based on my resume:
            </Button>{" "}
            <Button
              variant={"secondary"}
              size={"sm"}
              onClick={async () => {
                const syntheticEvent = {
                  target: {
                    value:
                      " Give sample answer for this question based on my introduction: ",
                  },
                };
                handleInputChange(
                  syntheticEvent as React.ChangeEvent<HTMLInputElement>
                );
              }}
            >
              Give sample answer for this question based on my introduction:
            </Button>
          </div>
        )}
      </div>
      <div className="">
        <form
          onSubmit={handleSubmit}
          className="m-3 flex gap-1 max-w-5xl mx-auto"
        >
          {" "}
          <Button
            title="Clear Chat"
            variant="outline"
            size="icon"
            className="shrink-0"
            type="button"
            onClick={clearChat}
          >
            <Trash />
          </Button>
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Say Something..."
            className=""
            ref={inputRef}
          />
          <Button type="submit" id="sendbutton">
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}

function ChatMessage({
  message: { role, content },
  handleInputChange,
  handleSubmit,
  isLoading,
  isLastMessage,
}: {
  message: Pick<Message, "role" | "content">;
  handleInputChange: any;
  handleSubmit: any;
  isLoading: boolean;
  isLastMessage: boolean;
}) {
  const { user } = useUser();
  const [copied, setCopied] = useState(false);

  const isAiMessage = role === "assistant";

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContinue = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // First, update the input value to "Continue"
    handleInputChange({ target: { value: "Continue" } });

    // Then submit the form after a short delay to ensure the input is updated
    setTimeout(() => {
      const syntheticEvent = {
        preventDefault: () => {},
        currentTarget: {
          reset: () => {},
        },
      } as React.FormEvent<HTMLFormElement>;

      handleSubmit(syntheticEvent);
    }, 50); // Small delay to ensure state update

    handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
  };

  return (
    <div
      className={cn(
        "mb-3 flex items-center",
        isAiMessage ? "me-5 justify-start" : "ms-5 justify-end"
      )}
    >
      {isAiMessage && <Bot className="mr-2 shrink-0" />}
      <div className="space-y-2">
        {" "}
        <div
          className={cn(
            "rounded-md border px-3 py-2",
            isAiMessage
              ? "bg-background markdown-content"
              : "bg-primary text-primary-foreground whitespace-pre-line"
          )}
        >
          {isAiMessage ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Custom styling for markdown elements
                h1: ({ children }) => (
                  <h1 className="text-2xl font-bold mb-2">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-semibold mb-2">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg font-medium mb-1">{children}</h3>
                ),
                p: ({ children }) => <p className="mb-2">{children}</p>,
                ul: ({ children }) => (
                  <ul className="list-disc list-outside ml-4 mb-2">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-outside ml-4 mb-2">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li>{children}</li>,
                code: ({ children, className, ...props }) => {
                  const isInline = !className;
                  return isInline ? (
                    <code className="bg-gray-100 dark:bg-gray-800 text-white px-1 rounded text-sm font-mono">
                      {children}
                    </code>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
                pre: ({ children }) => (
                  <pre className="bg-gray-100 dark:bg-gray-900 text-white p-2 rounded-md overflow-x-auto text-sm mb-2">
                    {children}
                  </pre>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-gray-300 pl-3 italic mb-2">
                    {children}
                  </blockquote>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto mb-2">
                    <table className="min-w-full border border-gray-300 dark:border-gray-700">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border border-gray-300 dark:border-gray-700 px-2 py-1 bg-gray-100 dark:bg-gray-800 font-semibold text-left text-sm">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-gray-300 dark:border-gray-700 px-2 py-1 text-sm">
                    {children}
                  </td>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold">{children}</strong>
                ),
                em: ({ children }) => <em className="italic">{children}</em>,
              }}
            >
              {content}
            </ReactMarkdown>
          ) : (
            content
          )}
        </div>{" "}
        {isAiMessage && !isLoading && (
          <div className="flex justify-between w-full">
            <Button variant={"secondary"} size={"sm"} onClick={handleCopy}>
              {copied ? (
                <>
                  Copied <CheckCircle size={18} className="ml-2" />
                </>
              ) : (
                <>
                  Copy <Copy size={18} className="ml-2" />
                </>
              )}
            </Button>
            {isLastMessage && (
              <Button
                variant={"secondary"}
                type="button"
                size={"sm"}
                onClick={handleContinue}
              >
                Continue Response <StepForward size={18} className="ml-2" />
              </Button>
            )}
          </div>
        )}
        {isAiMessage && !isLoading && isLastMessage && (
          <div className="text-sm text-yellow-600 flex items-center gap-1 mt-1">
            <XCircle size={16} className="inline" />
            Tips: Delete <Trash size={12} />
            current chat before starting a new question which is not related to
            the current queries.
          </div>
        )}
      </div>

      {!isAiMessage && user?.imageUrl && (
        <Image
          src={user.imageUrl}
          alt="User Image"
          width={100}
          height={100}
          className="ml-2 h-10 w-10 rounded-full object-cover"
        />
      )}
    </div>
  );
}
