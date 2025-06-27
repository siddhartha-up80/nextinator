"use client";

import { default as AIChatbox } from "@/components/main/aichatbox";
import { useChatSession } from "@/components/main/clientsidebarcontainer";
import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const ChatPage = () => {
  const { currentSessionId, setCurrentSessionId } = useChatSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [initialMessage, setInitialMessage] = useState<string | null>(null);

  // Get query parameter only once and then clear it
  useEffect(() => {
    const query = searchParams.get("q");
    const sessionId = searchParams.get("sessionId");

    // Handle existing session ID from URL
    if (sessionId && sessionId !== currentSessionId) {
      setCurrentSessionId(sessionId);
      // Remove sessionId from URL to keep it clean
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("sessionId");
      router.replace(newUrl.pathname + newUrl.search, { scroll: false });
    }

    // Handle new query
    if (query && !initialMessage) {
      setInitialMessage(query);
      // Clear the URL parameter to prevent reprocessing on refresh
      router.replace("/inator/chat", { scroll: false });
    }
  }, [
    searchParams,
    router,
    initialMessage,
    currentSessionId,
    setCurrentSessionId,
  ]);

  const handleSessionChange = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  const handleClearChat = () => {
    setInitialMessage(null); // Clear the initial message when chat is cleared
  };

  return (
    <div className="h-full">
      <AIChatbox
        sessionId={currentSessionId}
        onSessionChange={handleSessionChange}
        onClearChat={handleClearChat}
        initialMessage={initialMessage || undefined}
      />
    </div>
  );
};

export default ChatPage;
