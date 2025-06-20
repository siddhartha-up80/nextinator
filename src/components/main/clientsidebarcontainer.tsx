"use client";

import React, { useState, createContext, useContext } from "react";
import Navbar from "./navbar";
import Sidebar from "./sidebar";

interface ChatSessionContextType {
  currentSessionId: string | undefined;
  setCurrentSessionId: (sessionId: string) => void;
}

const ChatSessionContext = createContext<ChatSessionContextType | undefined>(
  undefined
);

export const useChatSession = () => {
  const context = useContext(ChatSessionContext);
  if (!context) {
    throw new Error("useChatSession must be used within a ChatSessionProvider");
  }
  return context;
};

interface ClientSidebarContainerProps {
  allNotes: any[];
  children?: React.ReactNode;
}

const ClientSidebarContainer = ({
  allNotes,
  children,
}: ClientSidebarContainerProps) => {
  const [currentSessionId, setCurrentSessionId] = useState<
    string | undefined
  >();
  const handleSelectChat = (sessionId: string) => {
    // Handle empty string as undefined (for new chats)
    console.log(
      "handleSelectChat called with:",
      sessionId,
      "converting to:",
      sessionId || undefined
    );
    setCurrentSessionId(sessionId || undefined);
  };
  return (
    <ChatSessionContext.Provider
      value={{
        currentSessionId,
        setCurrentSessionId,
      }}
    >
      <div>
        <div>
          <Navbar
            allNotes={allNotes}
            onSelectChat={handleSelectChat}
            currentSessionId={currentSessionId}
          />
        </div>
        <div className="hidden md:block">
          <Sidebar allNotes={allNotes} />
        </div>
        {children && (
          <div className="md:ml-[270px] md:mt-14 mt-20 p-4 md:p-0">
            {children}
          </div>
        )}
      </div>
    </ChatSessionContext.Provider>
  );
};

export default ClientSidebarContainer;
