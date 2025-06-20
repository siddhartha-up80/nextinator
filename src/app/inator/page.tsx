"use client";

import { default as AIChatbox } from "@/components/main/aichatbox";
import { useChatSession } from "@/components/main/clientsidebarcontainer";
import React from "react";

const Inator = () => {
  const { currentSessionId, setCurrentSessionId } = useChatSession();

  const handleSessionChange = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  return (
    <div>
      <AIChatbox
        sessionId={currentSessionId}
        onSessionChange={handleSessionChange}
      />
    </div>
  );
};

export default Inator;
