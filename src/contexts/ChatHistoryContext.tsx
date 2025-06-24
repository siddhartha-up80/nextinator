"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useUser } from "@clerk/nextjs";

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  isShared?: boolean;
  shareToken?: string;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    createdAt: string;
  }>;
}

interface ChatHistoryContextType {
  sessions: ChatSession[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  prefetchSessions: () => void;
  loadMoreSessions: () => void;
  refreshSessions: () => void;
  updateSession: (sessionId: string, updates: Partial<ChatSession>) => void;
  removeSession: (sessionId: string) => void;
  addSession: (session: ChatSession) => void;
}

const ChatHistoryContext = createContext<ChatHistoryContextType | null>(null);

export const useChatHistory = () => {
  const context = useContext(ChatHistoryContext);
  if (!context) {
    throw new Error("useChatHistory must be used within a ChatHistoryProvider");
  }
  return context;
};

interface ChatHistoryProviderProps {
  children: React.ReactNode;
}

export const ChatHistoryProvider: React.FC<ChatHistoryProviderProps> = ({
  children,
}) => {
  const { user } = useUser();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [prefetched, setPrefetched] = useState(false);

  const SESSIONS_PER_PAGE = 15;

  const fetchSessions = useCallback(
    async (pageNum: number = 1, reset: boolean = true) => {
      if (!user) return;

      if (reset) {
        setLoading(true);
        setSessions([]);
        setPage(1);
        setHasMore(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      try {
        const response = await fetch(
          `/api/chat-sessions?page=${pageNum}&limit=${SESSIONS_PER_PAGE}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch sessions: ${response.status}`);
        }

        const data = await response.json();
        const newSessions = data.sessions || data;
        const total = data.total || newSessions.length;

        if (reset) {
          setSessions(newSessions);
        } else {
          setSessions((prev) => [...prev, ...newSessions]);
        }

        // Check if there are more sessions to load
        const currentTotal = reset
          ? newSessions.length
          : sessions.length + newSessions.length;
        setHasMore(
          currentTotal < total && newSessions.length === SESSIONS_PER_PAGE
        );
        setPage(pageNum);

        if (reset) {
          setPrefetched(true);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch sessions"
        );
        console.error("Error fetching chat sessions:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [user, sessions.length]
  ); // Prefetch initial data when user is available
  useEffect(() => {
    if (user && !prefetched && !loading) {
      // Prefetch immediately without delay
      fetchSessions(1, true);
    }
  }, [user, prefetched, loading, fetchSessions]);

  // Also prefetch when the app becomes visible again (user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user && !loading && prefetched) {
        // Refresh data when user returns to the app (only if data was already prefetched)
        fetchSessions(1, true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [user, loading, fetchSessions, prefetched]);

  const prefetchSessions = useCallback(() => {
    if (!prefetched && !loading) {
      fetchSessions(1, true);
    }
  }, [prefetched, loading, fetchSessions]);

  const loadMoreSessions = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchSessions(page + 1, false);
    }
  }, [loadingMore, hasMore, page, fetchSessions]);

  const refreshSessions = useCallback(() => {
    setPrefetched(false);
    fetchSessions(1, true);
  }, [fetchSessions]);

  const updateSession = useCallback(
    (sessionId: string, updates: Partial<ChatSession>) => {
      setSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId ? { ...session, ...updates } : session
        )
      );
    },
    []
  );

  const removeSession = useCallback((sessionId: string) => {
    setSessions((prev) => prev.filter((session) => session.id !== sessionId));
  }, []);

  const addSession = useCallback((session: ChatSession) => {
    setSessions((prev) => [session, ...prev]);
  }, []);

  const value: ChatHistoryContextType = {
    sessions,
    loading,
    loadingMore,
    hasMore,
    error,
    prefetchSessions,
    loadMoreSessions,
    refreshSessions,
    updateSession,
    removeSession,
    addSession,
  };

  return (
    <ChatHistoryContext.Provider value={value}>
      {children}
    </ChatHistoryContext.Provider>
  );
};
