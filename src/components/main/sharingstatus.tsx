"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface SharingContextType {
  sharingStatus: Record<string, { isShared: boolean; shareUrl?: string }>;
  updateSharingStatus: (
    sessionId: string,
    status: { isShared: boolean; shareUrl?: string }
  ) => void;
  removeSharingStatus: (sessionId: string) => void;
}

const SharingContext = createContext<SharingContextType | undefined>(undefined);

export function SharingProvider({ children }: { children: React.ReactNode }) {
  const [sharingStatus, setSharingStatus] = useState<
    Record<string, { isShared: boolean; shareUrl?: string }>
  >({});

  const updateSharingStatus = useCallback(
    (sessionId: string, status: { isShared: boolean; shareUrl?: string }) => {
      setSharingStatus((prev) => ({
        ...prev,
        [sessionId]: status,
      }));
    },
    []
  );

  const removeSharingStatus = useCallback((sessionId: string) => {
    setSharingStatus((prev) => {
      const newStatus = { ...prev };
      delete newStatus[sessionId];
      return newStatus;
    });
  }, []);

  return (
    <SharingContext.Provider
      value={{
        sharingStatus,
        updateSharingStatus,
        removeSharingStatus,
      }}
    >
      {children}
    </SharingContext.Provider>
  );
}

export function useSharingStatus() {
  const context = useContext(SharingContext);
  if (context === undefined) {
    throw new Error("useSharingStatus must be used within a SharingProvider");
  }
  return context;
}
