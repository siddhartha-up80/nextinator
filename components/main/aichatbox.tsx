"use client";

import { cn } from "@/lib/utils";
import { useChat } from "ai/react";
import { Bot, Trash, XCircle } from "lucide-react";
import { Message } from "ai";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { useEffect, useRef } from "react";
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
          <ChatMessage message={message} key={message.id} />
        ))}
        {isLoading && lastMessageIsUser && (
          <ChatMessage
            message={{
              role: "assistant",
              content: "Thinking...",
            }}
          />
        )}
        {error && (
          <ChatMessage
            message={{
              role: "assistant",
              content: "Something went wrong. Please Try Again.",
            }}
          />
        )}
        {!error && messages.length === 0 && (
          <div className="gap-3 flex h-full items-center justify-center">
            <Bot />
            Add your data and Ask the Bot-Inator, it will answer the question
            based on your data!
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
          <Button type="submit">Send</Button>
        </form>
      </div>
    </div>
  );
}

function ChatMessage({
  message: { role, content },
}: {
  message: Pick<Message, "role" | "content">;
}) {
  const { user } = useUser();

  const isAiMessage = role === "assistant";

  return (
    <div
      className={cn(
        "mb-3 flex items-center",
        isAiMessage ? "me-5 justify-start" : "ms-5 justify-end"
      )}
    >
      {isAiMessage && <Bot className="mr-2 shrink-0" />}
      <p
        className={cn(
          "whitespace-pre-line rounded-md border px-3 py-2",
          isAiMessage ? "bg-background" : "bg-primary text-primary-foreground"
        )}
      >
        {content}
      </p>
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
