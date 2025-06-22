"use client";

import React, { useState, createContext, useContext } from "react";
import Navbar from "./navbar";
import Sidebar from "./sidebar";
import { SharingProvider } from "./sharingstatus";

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
  groups: any[];
  children?: React.ReactNode;
}

const ClientSidebarContainer = ({
  allNotes,
  groups,
  children,
}: ClientSidebarContainerProps) => {
  const [currentSessionId, setCurrentSessionId] = useState<
    string | undefined
  >();
  const handleSelectChat = (sessionId: string) => {
    // Handle empty string as undefined (for new chats)
    setCurrentSessionId(sessionId || undefined);
  };
  return (
    <SharingProvider>
      <ChatSessionContext.Provider
        value={{
          currentSessionId,
          setCurrentSessionId,
        }}
      >
        <div>
          <div>
            {" "}
            <Navbar
              allNotes={allNotes}
              groups={groups}
              onSelectChat={handleSelectChat}
              currentSessionId={currentSessionId}
            />
          </div>{" "}
          <div className="hidden md:block">
            <Sidebar allNotes={allNotes} groups={groups} />
          </div>
          {children && (
            <div className="md:ml-[270px] md:mt-14 mt-20 p-4 md:p-0">
              {children}
            </div>
          )}
        </div>
      </ChatSessionContext.Provider>
    </SharingProvider>
  );
};

export default ClientSidebarContainer;
