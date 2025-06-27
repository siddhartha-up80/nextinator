"use client";

import React, { useState, createContext, useContext } from "react";
import Navbar from "./navbar";
import Sidebar from "./sidebar";
import { SharingProvider } from "./sharingstatus";
import { useSidebar } from "@/contexts/SidebarContext";

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
  const { isCollapsed } = useSidebar();

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
        <div className="flex h-screen">
          {/* Sidebar - visible on desktop below navbar, hidden on mobile */}
          <div
            className={`hidden md:block fixed left-0 top-16 h-[calc(100vh-4rem)] z-30 transition-all duration-300 ${
              isCollapsed ? "w-20" : "w-72"
            }`}
          >
            <Sidebar allNotes={allNotes} groups={groups} />
          </div>

          {/* Navbar - spans full width */}
          <Navbar
            allNotes={allNotes}
            groups={groups}
            onSelectChat={handleSelectChat}
            currentSessionId={currentSessionId}
          />

          {/* Main content */}
          {children && (
            <div
              className={`w-full pt-16  min-h-screen transition-all duration-300 ${
                isCollapsed ? "md:ml-20" : "md:ml-72"
              }`}
            >
              {children}
            </div>
          )}
        </div>
      </ChatSessionContext.Provider>
    </SharingProvider>
  );
};

export default ClientSidebarContainer;
