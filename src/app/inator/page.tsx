"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  Database,
  Plus,
  Send,
  Search,
  FileText,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  Calendar,
  Clock,
  PieChart,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import Addnotedialog from "@/components/main/addnotedialog";
import { useUser } from "@clerk/nextjs";

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  group?: {
    color: string;
    name: string;
  };
}

const Inator = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [recentChats, setRecentChats] = useState<any[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [totalChats, setTotalChats] = useState(0);
  const [sharedChats, setSharedChats] = useState(0);
  const router = useRouter();
  const { user } = useUser();

  // Fetch latest notes
  const fetchLatestNotes = async () => {
    try {
      setLoadingNotes(true);
      const response = await fetch("/api/notes?page=1&limit=10&latest=true");
      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes);
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setLoadingNotes(false);
    }
  };

  // Fetch latest chat sessions
  const fetchLatestChats = async () => {
    try {
      setLoadingChats(true);
      const response = await fetch("/api/chat-sessions?limit=4");
      if (response.ok) {
        const data = await response.json();
        setRecentChats(data.sessions || []);
      }
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
    } finally {
      setLoadingChats(false);
    }
  };

  // Fetch chat statistics
  const fetchChatStats = async () => {
    try {
      // Fetch with a high limit to get all sessions for accurate shared count
      const response = await fetch("/api/chat-sessions?limit=1000");
      if (response.ok) {
        const data = await response.json();
        // Use the total count from API response
        setTotalChats(data.total || 0);
        // Count shared chats from all returned sessions
        const shared =
          data.sessions?.filter((chat: any) => chat.isShared).length || 0;
        setSharedChats(shared);
      }
    } catch (error) {
      console.error("Error fetching chat stats:", error);
    }
  };

  useEffect(() => {
    fetchLatestNotes();
    fetchLatestChats();
    fetchChatStats();
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Navigate to chat page with the query as a URL parameter
      router.push(`/inator/chat?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleNoteClick = (note: Note) => {
    setEditingNote(note);
    setShowEditDialog(true);
  };

  // Function to format chat title from first message or default
  const getChatTitle = (chat: any) => {
    if (chat.messages && chat.messages.length > 0) {
      const firstUserMessage = chat.messages.find(
        (msg: any) => msg.role === "user"
      );
      if (firstUserMessage) {
        return (
          firstUserMessage.content.substring(0, 50) +
          (firstUserMessage.content.length > 50 ? "..." : "")
        );
      }
    }
    return `Chat Session`;
  };

  // Function to format relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMins < 60) {
      return `${diffInMins} min${diffInMins !== 1 ? "s" : ""} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
    } else {
      return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;
    }
  };

  const handleNoteEditSuccess = () => {
    fetchLatestNotes(); // Refetch notes after editing
  };

  // Function to get varied character limits for different visual heights
  const getContentLimit = (index: number) => {
    const limits = [120, 280, 180, 350, 150, 400, 200, 320, 250, 160];
    return limits[index % limits.length];
  };

  // Function to get varied line clamps for different visual heights
  const getLineClamp = (index: number) => {
    const clamps = [
      "line-clamp-3",
      "line-clamp-8",
      "line-clamp-5",
      "line-clamp-10",
      "line-clamp-4",
      "line-clamp-12",
      "line-clamp-6",
      "line-clamp-9",
      "line-clamp-7",
      "line-clamp-4",
    ];
    return clamps[index % clamps.length];
  };

  const getColorClass = (color: string) => {
    const colorMap: { [key: string]: string } = {
      red: "bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800",
      blue: "bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
      green:
        "bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800",
      yellow:
        "bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
      purple:
        "bg-purple-100 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800",
      pink: "bg-pink-100 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800",
      orange:
        "bg-orange-100 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
      gray: "bg-gray-100 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800",
    };
    return (
      colorMap[color] ||
      "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
    );
  };

  const quickStats = [
    {
      label: "Total Notes",
      value: notes.length.toString(),
      icon: FileText,
      color: "text-blue-600",
    },
    {
      label: "Chat Sessions",
      value: "18",
      icon: MessageSquare,
      color: "text-green-600",
    },
    {
      label: "Data Sources",
      value: "7",
      icon: BarChart3,
      color: "text-purple-600",
    },
    {
      label: "Active Projects",
      value: "5",
      icon: Activity,
      color: "text-orange-600",
    },
  ];

  const recentActivity = [
    { action: "Created new note", time: "2 hours ago", icon: FileText },
    {
      action: "Chat session completed",
      time: "4 hours ago",
      icon: MessageSquare,
    },
    { action: "Data uploaded", time: "1 day ago", icon: BarChart3 },
    { action: "Project updated", time: "2 days ago", icon: Activity },
  ];

  const quickActions = [
    {
      label: "Start New Chat",
      icon: MessageSquare,
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      label: "Create Note",
      icon: FileText,
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      label: "Upload Data",
      icon: BarChart3,
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      label: "View Analytics",
      icon: PieChart,
      color: "bg-orange-500 hover:bg-orange-600",
    },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto ">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Welcome {user?.firstName || user?.fullName || "back"}
        </h1>
      </div>

      {/* Recent Activity */}
      <div className="mb-8">
        <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Recent Chat Sessions
          </h2>
          {loadingChats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg animate-pulse"
                >
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentChats.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentChats.map((chat, index) => (
                <Link
                  key={chat.id}
                  href={`/inator/chat?sessionId=${chat.id}`}
                  className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 cursor-pointer"
                >
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1 truncate">
                      {getChatTitle(chat)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {getRelativeTime(chat.updatedAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                No chat sessions yet
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Start a conversation to see your recent chats
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-200">
              <Search className="absolute left-6 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Ask something from your data..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 pl-14 pr-4 py-6 text-lg bg-transparent border-none rounded-full focus:outline-none focus:ring-0 placeholder-gray-400"
              />
              <Button
                onClick={handleSearch}
                disabled={!searchQuery.trim()}
                className="mr-2 px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:text-gray-500 text-white rounded-full transition-colors duration-200"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>

            {/* Add Data Button */}
            <Button
              onClick={() => setShowAddDialog(true)}
              className="px-4 py-6 bg-red-300 hover:bg-red-00 text-black rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
              title="Add Data"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Add Data</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Latest Notes Grid */}
      <div className="mb-8">
        {loadingNotes ? (
          <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {[...Array(8)].map((_, i) => (
              <Card
                key={i}
                className="p-4 animate-pulse break-inside-avoid mb-4"
              >
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {notes.map((note, index) => (
              <Card
                key={note.id}
                className={`p-4 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] break-inside-avoid mb-4 ${getColorClass(
                  note.group?.color || "gray"
                )}`}
                onClick={() => handleNoteClick(note)}
              >
                <div className="flex flex-col">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                    {note.title || "Untitled"}
                  </h3>
                  <p
                    className={`text-gray-600 dark:text-gray-300 text-sm mb-3 ${getLineClamp(
                      index
                    )} overflow-hidden`}
                  >
                    {note.content.length > getContentLimit(index)
                      ? note.content.substring(0, getContentLimit(index)) +
                        "..."
                      : note.content}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    {note.group && (
                      <span className="px-2 py-1 rounded-full bg-white/50 dark:bg-gray-800/50">
                        {note.group.name}
                      </span>
                    )}
                    <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Card>
            ))}

            {/* View All Notes Card */}
            <Link href="/inator/alldata">
              <Card className="p-6 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-dashed border-blue-300 dark:border-blue-700 flex items-center justify-center break-inside-avoid mb-4">
                <div className="text-center">
                  <Eye className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-blue-700 dark:text-blue-300">
                    View All Notes
                  </h3>
                  <p className="text-blue-600 dark:text-blue-400 text-sm">
                    See your complete collection
                  </p>
                </div>
              </Card>
            </Link>
          </div>
        )}
      </div>

      {/* Performance Overview */}
      <div className="mt-8">
        <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <FileText className="w-12 h-12 text-blue-500 mx-auto mb-2" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Total Notes
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {notes.length} notes created
              </p>
            </div>
            <div className="text-center">
              <Users className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Shared Chats
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {sharedChats} shared sessions
              </p>
            </div>
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-red-500 mx-auto mb-2" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Total Chats
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {totalChats} chat sessions
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Upcoming Tasks */}
      <div className="mt-8">
        <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Upcoming Tasks
          </h2>
          <div className="space-y-3">
            {[
              {
                task: "Review quarterly data analysis",
                due: "Today, 3:00 PM",
                priority: "high",
              },
              {
                task: "Update project documentation",
                due: "Tomorrow, 10:00 AM",
                priority: "medium",
              },
              {
                task: "Team meeting preparation",
                due: "Friday, 2:00 PM",
                priority: "low",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      item.priority === "high"
                        ? "bg-red-500"
                        : item.priority === "medium"
                        ? "bg-red-500"
                        : "bg-green-500"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.task}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {item.due}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Note Edit Dialog */}
      <Addnotedialog
        open={showEditDialog}
        setOpen={setShowEditDialog}
        noteToEdit={editingNote}
        onSuccess={handleNoteEditSuccess}
      />

      {/* Add Data Dialog */}
      <Addnotedialog
        open={showAddDialog}
        setOpen={setShowAddDialog}
        onSuccess={handleNoteEditSuccess}
      />
    </div>
  );
};

export default Inator;
