"use client";

import { cn } from "@/lib/utils";
import { useChat } from "ai/react";
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
import { useEffect, useRef, useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

interface AIChatboxProps {
  open?: boolean;
  onclose?: () => void;
}

export default function AIChatbox({ open, onclose }: AIChatboxProps) {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    setMessages,
    isLoading,
    error,
  } = useChat();

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLInputElement>(null);

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
        {messages.map((message) => (
          <ChatMessage
            message={message}
            key={message.id}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
          />
        ))}
        {isLoading && lastMessageIsUser && (
          <ChatMessage
            message={{
              role: "assistant",
              content: "Thinking...",
            }}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
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
                      "Give sample email for applying to the given Job Description:",
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
                    value: "Customize my cover letter for this job role:",
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
                      "Give sample questions with answers which can be asked from me for this role:",
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
                      " Give sample answer for this question in 100 words:",
                  },
                };
                handleInputChange(
                  syntheticEvent as React.ChangeEvent<HTMLInputElement>
                );
              }}
            >
              Give sample answer for this question in 100 words:
            </Button>
          </div>
        )}
      </div>
      <div className="">
        <form
          onSubmit={handleSubmit}
          className="m-3 flex gap-1 max-w-5xl mx-auto"
        >
          <Button
            title="Clear Chat"
            variant="outline"
            size="icon"
            className="shrink-0"
            type="button"
            onClick={() => setMessages([])}
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
}: {
  message: Pick<Message, "role" | "content">;
  handleInputChange: any;
  handleSubmit: any;
  isLoading: boolean;
}) {
  const { user } = useUser();
  const [copied, setCopied] = useState(false);

  const isAiMessage = role === "assistant";

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset the copied state after 2 seconds
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
        <p
          className={cn(
            "whitespace-pre-line rounded-md border px-3 py-2",
            isAiMessage ? "bg-background" : "bg-primary text-primary-foreground"
          )}
        >
          {content}
        </p>
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
            <Button
              variant={"secondary"}
              size={"sm"}
              onClick={async () => {
                await handleInputChange({ target: { value: "Continue" } });

                document.getElementById("sendbutton")?.click();
              }}
            >
              Continue Response <StepForward size={18} className="ml-2" />
            </Button>
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
