"use client";

import { cn, smartTruncate } from "@/lib/utils";
import { useChat } from "@ai-sdk/react";
import {
  Bot,
  CheckCircle,
  Copy,
  RefreshCw,
  StepForward,
  Trash,
  XCircle,
} from "lucide-react";
import { Message } from "ai";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { useEffect, useRef, useState, useCallback } from "react";
import { Input } from "../ui/input";
import { AutoExpandingTextarea } from "../ui/auto-expanding-textarea";
import { Button } from "../ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./markdown.css";
import { useToast } from "@/components/ui/toast";
import { useChatSettings } from "./settingsdialog";

interface AIChatboxProps {
  open?: boolean;
  onclose?: () => void;
  sessionId?: string;
  onSessionChange?: (sessionId: string) => void;
  initialMessage?: string;
  onClearChat?: () => void;
}

export default function AIChatbox({
  open,
  onclose,
  sessionId,
  onSessionChange,
  initialMessage,
  onClearChat,
}: AIChatboxProps) {
  const settings = useChatSettings();
  const [chatKey, setChatKey] = useState(0);
  const [preservedMessages, setPreservedMessages] = useState<Message[]>([]);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    setMessages,
    append,
    isLoading,
    error,
  } = useChat({
    api: "/api/chat",
    body: {
      settings,
    },
    id: `chat-${chatKey}`, // This forces a new chat instance when settings change
  });

  // Preserve messages when settings change and force chat to reinitialize
  useEffect(() => {
    if (messages.length > 0) {
      setPreservedMessages([...messages]);
    }
    setChatKey((prev) => prev + 1);
  }, [settings.responseType, settings.customPrompt]);

  // Restore preserved messages after chat reinitializes
  useEffect(() => {
    if (preservedMessages.length > 0 && messages.length === 0) {
      setMessages(preservedMessages);
      setPreservedMessages([]);
    }
  }, [chatKey, messages, preservedMessages, setMessages]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(
    sessionId || null
  );
  const [sessionTitle, setSessionTitle] = useState<string>("New Chat");
  const [dynamicQuestions, setDynamicQuestions] = useState<string[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState<boolean>(true);
  const [questionsCache, setQuestionsCache] = useState<{
    questions: string[];
    timestamp: number;
    nextRefreshIn?: number;
  } | null>(null);
  const [isRateLimited, setIsRateLimited] = useState<boolean>(false);
  const [initialMessageProcessed, setInitialMessageProcessed] =
    useState<boolean>(false);
  // Handle Enter key for submit (but allow Shift+Enter for new lines)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Trigger form submit if we have content
      if (input.trim()) {
        const form = e.currentTarget.form;
        if (form) {
          const submitEvent = new Event("submit", {
            cancelable: true,
            bubbles: true,
          });
          form.dispatchEvent(submitEvent);
        }
      }
    }
  };

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isCreatingSession = useRef<boolean>(false);
  const { showToast } = useToast();

  // Function to fetch dynamic questions
  const fetchDynamicQuestions = async (force: boolean = false) => {
    try {
      setLoadingQuestions(true);
      setIsRateLimited(false);

      // Check local cache first if not forcing refresh
      if (!force && questionsCache) {
        const timeSinceCache = Date.now() - questionsCache.timestamp;
        const cacheValidTime = 5 * 60 * 1000; // 5 minutes

        if (timeSinceCache < cacheValidTime) {
          console.log("Using local cached questions");
          setDynamicQuestions(questionsCache.questions);
          setLoadingQuestions(false);
          return;
        }
      }

      const url = force
        ? "/api/generate-questions?force=true"
        : "/api/generate-questions";
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setDynamicQuestions(data.questions || []);

        // Update local cache
        setQuestionsCache({
          questions: data.questions || [],
          timestamp: Date.now(),
          nextRefreshIn: data.nextRefreshIn,
        });

        // Handle different scenarios
        if (force && !data.cached) {
          // Successfully generated new questions on force refresh
          showToast("New questions generated!", "success");
        } else if (force && data.cached && data.nextRefreshIn) {
          // Force refresh but still rate limited
          setIsRateLimited(true);
          const minutes = Math.ceil(data.nextRefreshIn / 60);
          showToast(
            `New questions available in ${minutes} minute${
              minutes > 1 ? "s" : ""
            }.`,
            "info"
          );
        }
        // Don't show any toast for regular cached responses
      } else {
        console.error("Failed to fetch questions");
        // Fallback questions if API fails
        const fallbackQuestions = [
          "Summarize key points from my notes",
          "Help me find specific information in my documents",
          "Create practice questions from my study materials",
          "Extract important dates and deadlines",
          "Compare different topics in my notes",
        ];
        setDynamicQuestions(fallbackQuestions);
        showToast("Using fallback questions due to connection error", "error");
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      // Fallback questions
      const fallbackQuestions = [
        "Summarize key points from my notes",
        "Help me find specific information in my documents",
        "Create practice questions from my study materials",
        "Extract important dates and deadlines",
        "Compare different topics in my notes",
      ];
      setDynamicQuestions(fallbackQuestions);
      showToast("Using fallback questions due to error", "error");
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Load dynamic questions on component mount and when session clears
  useEffect(() => {
    if (messages.length === 0) {
      fetchDynamicQuestions();
    }
  }, [messages.length]);

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

  // Reset initial message processed flag when initialMessage changes
  useEffect(() => {
    if (initialMessage) {
      setInitialMessageProcessed(false);
    }
  }, [initialMessage]);

  // Handle initial message from URL parameter
  useEffect(() => {
    if (
      initialMessage &&
      initialMessage.trim() !== "" &&
      messages.length === 0 &&
      !isLoading &&
      !initialMessageProcessed
    ) {
      setInitialMessageProcessed(true);

      // Use append to directly add the message and trigger AI response
      append({
        role: "user",
        content: initialMessage.trim(),
      });
    }
  }, [
    initialMessage,
    messages.length,
    isLoading,
    initialMessageProcessed,
    append,
  ]);

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
      showToast("Failed to load chat session", "error");
    }
  };
  const saveChatSession = useCallback(
    async (overrideMessages?: Message[]) => {
      const messagesToSave = overrideMessages || messages;

      if (messagesToSave.length === 0) return;

      // Prevent multiple simultaneous session creations
      if (!currentSessionId && !isCreatingSession.current) {
        isCreatingSession.current = true;
      } else if (!currentSessionId && isCreatingSession.current) {
        // Another save is already in progress, skip this one
        return;
      }

      try {
        // Save messages to database
        const response = await fetch("/api/chat-messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId: currentSessionId,
            messages: messagesToSave,
            createSession: !currentSessionId, // Create session if none exists
          }),
        });

        if (response.ok) {
          const result = await response.json();

          // If a new session was created, update our current session ID
          if (result.sessionId && !currentSessionId) {
            setCurrentSessionId(result.sessionId);
            onSessionChange?.(result.sessionId);
            isCreatingSession.current = false; // Reset the flag
          } // Auto-generate title from first user message if still "New Chat"
          if (sessionTitle === "New Chat" && messagesToSave.length > 0) {
            const firstUserMessage = messagesToSave.find(
              (m) => m.role === "user"
            );
            if (firstUserMessage) {
              const newTitle = smartTruncate(firstUserMessage.content, 50);
              setSessionTitle(newTitle);

              // Update session title in database
              const sessionIdToUpdate = result.sessionId || currentSessionId;
              if (sessionIdToUpdate) {
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
        }
      } catch (error) {
        console.error("Failed to save chat session:", error);
        showToast("Failed to save chat session", "error");
        isCreatingSession.current = false; // Reset flag on error
      }
    },
    [messages, currentSessionId, sessionTitle, onSessionChange]
  );
  // Auto-save messages when they change, but debounce rapid changes
  useEffect(() => {
    if (messages.length > 0) {
      const saveTimeout = setTimeout(() => {
        saveChatSession();
      }, 1000); // Debounce saves by 1 second

      return () => clearTimeout(saveTimeout);
    }
  }, [messages, saveChatSession]);
  const clearChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setSessionTitle("New Chat");
    setInitialMessageProcessed(false); // Reset initial message flag
    isCreatingSession.current = false; // Reset the flag
    onSessionChange?.("");
    onClearChat?.(); // Notify parent component
    showToast("Chat cleared successfully", "success");
    // Fetch new questions when chat is cleared
    fetchDynamicQuestions();
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
    <div className="flex h-[calc(100vh-80px)] fixed top-16 bottom-0 mx-auto flex-col  justify-between overflow-hidden min-w-[80vw]">
      <div
        className="overflow-y-auto px-2 pt-2 flex-1 h-full w-full overflow-x-hidden"
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
          <div className="flex flex-col items-center justify-start md:px-4 px-2 py-6 h-full overflow-y-auto">
            <div className="flex gap-1 justify-center text-center max-w-2xl mb-6 text-sm mt-4">
              <Bot />
              Add your data and Ask the Bot-Inator, it will answer questions
              based on your data. Try using these prompts ⤵️!
            </div>

            {loadingQuestions ? (
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating personalized questions from your notes...
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 justify-center max-w-6xl mx-auto px-2 mb-6">
                  {dynamicQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant={"secondary"}
                      size={"sm"}
                      className="text-xs whitespace-normal text-center h-auto py-3 px-4 max-w-[300px] break-words leading-relaxed min-h-[48px] flex items-center justify-center"
                      onClick={() => {
                        const syntheticEvent = {
                          target: {
                            value: question,
                          },
                        };
                        handleInputChange(
                          syntheticEvent as React.ChangeEvent<HTMLTextAreaElement>
                        );
                      }}
                    >
                      {question}
                    </Button>
                  ))}
                </div>

                <Button
                  variant={"outline"}
                  onClick={() => fetchDynamicQuestions(true)}
                  className="mt-4 mb-4"
                  disabled={loadingQuestions}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${
                      loadingQuestions ? "animate-spin" : ""
                    }`}
                  />
                  {isRateLimited
                    ? "Refresh (Rate Limited)"
                    : "Get New Questions"}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
      <div className="pb-[calc(8vh)] md:pb-0 mx-auto">
        <form
          onSubmit={handleSubmit}
          className="m-1 flex gap-1 max-w-5xl mx-auto items-center"
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
          <AutoExpandingTextarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask something from your data..."
            className="flex-1 min-w-[60vw] mx-auto"
            ref={inputRef}
            minRows={1}
            maxRows={10}
          />
          <Button type="submit" id="sendbutton" className="shrink-0">
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
  const { showToast } = useToast();

  const isAiMessage = role === "assistant";
  const handleCopy = () => {
    navigator.clipboard
      .writeText(content)
      .then(() => {
        setCopied(true);
        showToast("Message copied to clipboard!", "success");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((error) => {
        console.error("Failed to copy message:", error);
        showToast("Failed to copy message", "error");
      });
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
              ? "bg-white dark:bg-gray-800 markdown-content"
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
                // eslint-disable-next-line jsx-a11y/no-redundant-roles, react/jsx-key
                li: ({ children }) => <li className="mb-1">{children}</li>,
                code: ({ children, className, ...props }) => {
                  const isInline = !className;
                  return isInline ? (
                    <code className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-1 rounded text-sm font-mono">
                      {children}
                    </code>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
                pre: ({ children }) => (
                  <pre className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 rounded-md overflow-x-auto text-sm mb-2">
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
          <div className="text-sm text-red-600 flex items-center gap-1 mt-1">
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
