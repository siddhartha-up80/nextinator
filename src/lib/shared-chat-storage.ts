// SharedChat localStorage management utility
// Handles caching, cleanup, and trimming of shared chat data

interface StoredMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

interface StoredSharedChat {
  id: string;
  token: string;
  title: string;
  messages: StoredMessage[];
  lastAccessed: number;
  createdAt: string;
  updatedAt: string;
}

interface SharedChatStorage {
  chats: Record<string, StoredSharedChat>;
  lastCleanup: number;
}

const STORAGE_KEY = "nextinator_shared_chats";
const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB limit
const MAX_MESSAGES_PER_CHAT = 100; // Limit messages per chat
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
const CHAT_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

class SharedChatStorageManager {
  private getStorage(): SharedChatStorage {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return { chats: {}, lastCleanup: Date.now() };
      }
      return JSON.parse(stored);
    } catch (error) {
      console.warn("Failed to parse shared chat storage, resetting:", error);
      return { chats: {}, lastCleanup: Date.now() };
    }
  }
  private saveStorage(storage: SharedChatStorage): void {
    try {
      const serialized = JSON.stringify(storage);

      // Check if we're approaching localStorage limits
      if (serialized.length > MAX_STORAGE_SIZE) {
        this.performSizeBasedCleanup(storage);
        const cleanedSerialized = JSON.stringify(storage);
        localStorage.setItem(STORAGE_KEY, cleanedSerialized);
      } else {
        localStorage.setItem(STORAGE_KEY, serialized);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "QuotaExceededError") {
        this.performAggressiveCleanup(storage);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
        } catch (retryError) {
          console.error("Failed to save even after cleanup:", retryError);
          // Clear all shared chat storage as last resort
          localStorage.removeItem(STORAGE_KEY);
        }
      } else {
        console.error("Failed to save shared chat storage:", error);
      }
    }
  }

  private performSizeBasedCleanup(storage: SharedChatStorage): void {
    const chats = Object.values(storage.chats);

    // Sort by last accessed time (oldest first)
    chats.sort((a, b) => a.lastAccessed - b.lastAccessed);

    // Remove oldest 30% of chats
    const removeCount = Math.ceil(chats.length * 0.3);
    for (let i = 0; i < removeCount && i < chats.length; i++) {
      delete storage.chats[chats[i].token];
    }

    // Trim remaining chats
    Object.values(storage.chats).forEach((chat) => {
      this.trimChatMessages(chat);
    });
  }

  private performAggressiveCleanup(storage: SharedChatStorage): void {
    const chats = Object.values(storage.chats);

    // Sort by last accessed time and keep only the most recent 5 chats
    chats.sort((a, b) => b.lastAccessed - a.lastAccessed);

    const newChats: Record<string, StoredSharedChat> = {};
    for (let i = 0; i < Math.min(5, chats.length); i++) {
      const chat = chats[i];
      this.trimChatMessages(chat, 20); // Keep only 20 messages
      newChats[chat.token] = chat;
    }

    storage.chats = newChats;
  }

  private trimChatMessages(
    chat: StoredSharedChat,
    maxMessages: number = MAX_MESSAGES_PER_CHAT
  ): void {
    if (chat.messages.length > maxMessages) {
      // Keep the first message (context) and the most recent messages
      const firstMessage = chat.messages[0];
      const recentMessages = chat.messages.slice(-(maxMessages - 1));

      chat.messages = [firstMessage, ...recentMessages];
    }
  }

  private shouldPerformCleanup(storage: SharedChatStorage): boolean {
    return Date.now() - storage.lastCleanup > CLEANUP_INTERVAL;
  }

  private performRoutineCleanup(storage: SharedChatStorage): void {
    const now = Date.now();
    const chatsToRemove: string[] = [];

    // Remove expired chats
    Object.entries(storage.chats).forEach(([token, chat]) => {
      if (now - chat.lastAccessed > CHAT_EXPIRY) {
        chatsToRemove.push(token);
      }
    });

    chatsToRemove.forEach((token) => {
      delete storage.chats[token];
    });

    storage.lastCleanup = now;
  }

  // Public methods
  public saveSharedChat(
    token: string,
    chatData: {
      id: string;
      title: string;
      messages: Array<{
        id: string;
        role: string;
        content: string;
        createdAt: string;
      }>;
      createdAt: string;
      updatedAt: string;
    }
  ): void {
    const storage = this.getStorage();

    // Perform routine cleanup if needed
    if (this.shouldPerformCleanup(storage)) {
      this.performRoutineCleanup(storage);
    }

    const storedChat: StoredSharedChat = {
      id: chatData.id,
      token,
      title: chatData.title,
      messages: chatData.messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt,
      })),
      lastAccessed: Date.now(),
      createdAt: chatData.createdAt,
      updatedAt: chatData.updatedAt,
    };

    // Trim messages if needed
    this.trimChatMessages(storedChat);

    storage.chats[token] = storedChat;
    this.saveStorage(storage);
  }
  public getSharedChat(token: string): StoredSharedChat | null {
    const storage = this.getStorage();
    const chat = storage.chats[token];

    if (chat) {
      // Update last accessed time
      chat.lastAccessed = Date.now();
      this.saveStorage(storage);
      return chat;
    }

    return null;
  }
  public updateSharedChatMessages(
    token: string,
    messages: Array<{ id: string; role: string; content: string }>
  ): void {
    const storage = this.getStorage();
    const chat = storage.chats[token];

    if (chat) {
      // Update messages with new ones
      const updatedMessages = messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: new Date().toISOString(),
      }));

      chat.messages = updatedMessages;
      chat.lastAccessed = Date.now();
      chat.updatedAt = new Date().toISOString();

      // Trim if needed
      this.trimChatMessages(chat);
      this.saveStorage(storage);
    } else {
      console.warn("Chat not found in storage for token:", token);
    }
  }

  public removeSharedChat(token: string): void {
    const storage = this.getStorage();
    delete storage.chats[token];
    this.saveStorage(storage);
  }

  public clearAllSharedChats(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  public getStorageInfo(): {
    totalChats: number;
    totalSize: number;
    oldestChat: string | null;
    newestChat: string | null;
  } {
    const storage = this.getStorage();
    const chats = Object.values(storage.chats);
    const serialized = JSON.stringify(storage);

    let oldestChat: string | null = null;
    let newestChat: string | null = null;

    if (chats.length > 0) {
      const sorted = chats.sort((a, b) => a.lastAccessed - b.lastAccessed);
      oldestChat = sorted[0].title;
      newestChat = sorted[sorted.length - 1].title;
    }

    return {
      totalChats: chats.length,
      totalSize: serialized.length,
      oldestChat,
      newestChat,
    };
  }
}

// Create a singleton instance
export const sharedChatStorage = new SharedChatStorageManager();

// Export utility functions for easier use
export const saveSharedChatToStorage = (token: string, chatData: any) =>
  sharedChatStorage.saveSharedChat(token, chatData);

export const getSharedChatFromStorage = (token: string) =>
  sharedChatStorage.getSharedChat(token);

export const updateSharedChatInStorage = (token: string, messages: any[]) =>
  sharedChatStorage.updateSharedChatMessages(token, messages);

export const removeSharedChatFromStorage = (token: string) =>
  sharedChatStorage.removeSharedChat(token);

export const getSharedChatStorageInfo = () =>
  sharedChatStorage.getStorageInfo();
