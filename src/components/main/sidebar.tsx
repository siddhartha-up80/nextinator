"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import { Button } from "../ui/button";
import {
  Database,
  MessageSquare,
  Notebook,
  ChevronDown,
  ChevronRight,
  FolderIcon,
  Home,
  Plus,
} from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";
import Addnotedialog from "./addnotedialog";

const Sidebar = ({ allNotes, groups }: any) => {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();
  const [showAddNoteDialog, setShowNoteDialog] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState<{
    [key: string]: boolean;
  }>({});

  // Helper function to check if a route is active
  const isActive = (route: string) => {
    if (route === "/inator") {
      return pathname === "/inator" || pathname === "/";
    }
    if (route === "/inator/chat") {
      return pathname === "/inator/chat";
    }
    if (route === "/inator/alldata") {
      return pathname === "/inator/alldata";
    }
    return pathname.startsWith(route);
  };

  // Helper function to get button classes based on active state
  const getButtonClasses = (route: string, isChat: boolean = false) => {
    const baseClasses = isCollapsed
      ? "w-full justify-center px-3 py-3 rounded-lg mx-2 transition-colors duration-200"
      : "w-full justify-start px-6 py-3 rounded-r-full mx-0 transition-colors duration-200";
    const activeClasses = isCollapsed
      ? "text-gray-900 dark:text-gray-100 bg-red-100 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/30"
      : "text-gray-900 dark:text-gray-100 bg-red-100 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/30 border-r-4 border-red-500";
    const inactiveClasses =
      "text-gray-700 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-red-900/20";

    return `${baseClasses} ${
      isActive(route) ? activeClasses : inactiveClasses
    }`;
  };

  // Helper function to get icon classes based on active state
  const getIconClasses = (route: string, defaultColor: string) => {
    const baseClasses = isCollapsed ? "w-5 h-5" : "w-5 h-5 mr-4";
    const activeColor = "text-red-600 dark:text-red-500";

    return `${baseClasses} ${isActive(route) ? activeColor : defaultColor}`;
  };

  const getColorClass = (color: string) => {
    const colorMap: { [key: string]: string } = {
      "#6366f1": "bg-indigo-500",
      "#8b5cf6": "bg-violet-500",
      "#06b6d4": "bg-cyan-500",
      "#10b981": "bg-emerald-500",
      "#f59e0b": "bg-red-500",
      "#ef4444": "bg-red-500",
      "#ec4899": "bg-pink-500",
      "#84cc16": "bg-lime-500",
      "#6b7280": "bg-gray-500",
      "#1f2937": "bg-gray-800",
    };
    return colorMap[color] || "bg-indigo-500";
  };

  // Initialize expanded state for groups that have notes
  React.useEffect(() => {
    if (groups && allNotes) {
      const initialExpandedState: { [key: string]: boolean } = {};

      // Auto-expand ungrouped if there are ungrouped notes
      const ungroupedNotes = allNotes.filter((note: any) => !note.groupId);
      if (ungroupedNotes.length > 0) {
        initialExpandedState["ungrouped"] = true;
      }

      // Auto-expand groups that have notes
      groups.forEach((group: any) => {
        const groupNotes = allNotes.filter(
          (note: any) => note.groupId === group.id
        );
        if (groupNotes.length > 0) {
          initialExpandedState[group.id] = true;
        }
      });

      setExpandedGroups(initialExpandedState);
    }
  }, [groups, allNotes]);
  const handleNoteClick = (note: any) => {
    setSelectedNote(note);
  };

  const handleEditDialogClose = () => {
    setSelectedNote(null);
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Group notes by group
  const groupedNotes = React.useMemo(() => {
    const grouped: { [key: string]: any[] } = {};

    allNotes.forEach((note: any) => {
      const groupId = note.groupId || "ungrouped";
      if (!grouped[groupId]) {
        grouped[groupId] = [];
      }
      grouped[groupId].push(note);
    });

    return grouped;
  }, [allNotes]);

  return (
    <>
      <div className="w-full h-screen ">
        <div className="flex flex-col h-full pt-4 md:pt-0">
          {/* Header - removed border */}
          {/* Navigation Items */}
          <div className="flex-1 pt-6 pb-4">
            <div className="space-y-2">
              {/* Home */}
              <Link href="/inator" className="block">
                <Button
                  variant="ghost"
                  className={getButtonClasses("/inator")}
                  title={isCollapsed ? "Home" : ""}
                >
                  <Home
                    className={getIconClasses(
                      "/inator",
                      "text-blue-600 dark:text-blue-500"
                    )}
                  />
                  {!isCollapsed && (
                    <span className="text-sm font-medium">Home</span>
                  )}
                </Button>
              </Link>

              {/* Chat Bot */}
              <Link href="/inator/chat" className="block">
                <Button
                  variant="ghost"
                  className={getButtonClasses("/inator/chat")}
                  title={isCollapsed ? "Chat Bot" : ""}
                >
                  <MessageSquare
                    className={getIconClasses(
                      "/inator/chat",
                      "text-green-600 dark:text-green-500"
                    )}
                  />
                  {!isCollapsed && (
                    <span className="text-sm font-medium">Chat Bot</span>
                  )}
                </Button>
              </Link>

              {/* Your Data */}
              <Link href="/inator/alldata" className="block">
                <Button
                  variant="ghost"
                  className={getButtonClasses("/inator/alldata")}
                  title={isCollapsed ? "Your Data" : ""}
                >
                  <Database
                    className={getIconClasses(
                      "/inator/alldata",
                      "text-purple-600 dark:text-purple-500"
                    )}
                  />
                  {!isCollapsed && (
                    <span className="text-sm font-medium">
                      {allNotes.length === 0 ? "Add New Data" : "Your Data"}
                    </span>
                  )}
                </Button>
              </Link>

              {/* Add Data Button */}
              <Button
                variant="ghost"
                onClick={() => setShowNoteDialog(true)}
                className={
                  isCollapsed
                    ? "w-full justify-center px-3 py-3 rounded-lg mx-2 transition-colors duration-200 text-gray-700 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-red-900/20"
                    : "w-full justify-start px-6 py-3 rounded-r-full mx-0 transition-colors duration-200 text-gray-700 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-red-900/20"
                }
                title={isCollapsed ? "Add Data" : ""}
              >
                <Plus
                  className={
                    isCollapsed
                      ? "w-5 h-5 text-red-600 dark:text-red-500"
                      : "w-5 h-5 mr-4 text-red-600 dark:text-red-500"
                  }
                />
                {!isCollapsed && (
                  <span className="text-sm font-medium">Add Data</span>
                )}
              </Button>
            </div>

            {/* Groups Section */}
            {!isCollapsed && groups && groups.length > 0 && (
              <div className="mt-8">
                <div className="px-6 py-2">
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Labels
                  </h3>
                </div>
                <div className="space-y-2">
                  {groups.map((group: any) => {
                    const groupNotes = groupedNotes[group.id] || [];
                    return (
                      <Button
                        key={group.id}
                        variant="ghost"
                        className="w-full justify-start px-6 py-3 text-gray-700 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-r-full mx-0"
                      >
                        <div
                          className={`w-5 h-5 rounded-full mr-4 ${getColorClass(
                            group.color
                          )}`}
                        />
                        <span className="text-sm font-medium flex-1 text-left">
                          {group.name}
                        </span>
                        {groupNotes.length > 0 && (
                          <span className="text-xs text-gray-400 ml-2">
                            {groupNotes.length}
                          </span>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notes within groups - collapsible */}
            {!isCollapsed && Object.keys(groupedNotes).length > 0 && (
              <div className="mt-8 px-4">
                <div className="max-h-[40vh] overflow-y-auto">
                  {/* Ungrouped Notes */}
                  {groupedNotes["ungrouped"] &&
                    groupedNotes["ungrouped"].length > 0 && (
                      <div className="mb-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleGroup("ungrouped")}
                          className="w-full justify-start px-2 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                        >
                          {expandedGroups["ungrouped"] ? (
                            <ChevronDown size={14} />
                          ) : (
                            <ChevronRight size={14} />
                          )}
                          <FolderIcon size={14} className="ml-1 mr-2" />
                          <span className="text-xs">
                            Ungrouped ({groupedNotes["ungrouped"].length})
                          </span>
                        </Button>
                        {expandedGroups["ungrouped"] && (
                          <div className="ml-6 space-y-1">
                            {groupedNotes["ungrouped"].map((note: any) => (
                              <Button
                                key={note.id}
                                variant="ghost"
                                size="sm"
                                onClick={() => handleNoteClick(note)}
                                className="w-full justify-start px-2 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                              >
                                <Notebook size={14} className="mr-2 shrink-0" />
                                <span className="text-xs truncate">
                                  {note?.title || "No Title"}
                                </span>
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                  {/* Grouped Notes */}
                  {groups?.map((group: any) => {
                    const groupNotes = groupedNotes[group.id] || [];
                    if (groupNotes.length === 0) return null;

                    return (
                      <div key={group.id} className="mb-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleGroup(group.id)}
                          className="w-full justify-start px-2 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                        >
                          {expandedGroups[group.id] ? (
                            <ChevronDown size={14} />
                          ) : (
                            <ChevronRight size={14} />
                          )}
                          <div
                            className={`w-3 h-3 rounded-full ml-1 mr-2 ${getColorClass(
                              group.color
                            )}`}
                          />
                          <span className="text-xs">
                            {group.name} ({groupNotes.length})
                          </span>
                        </Button>
                        {expandedGroups[group.id] && (
                          <div className="ml-6 space-y-1">
                            {groupNotes.map((note: any) => (
                              <Button
                                key={note.id}
                                variant="ghost"
                                size="sm"
                                onClick={() => handleNoteClick(note)}
                                className="w-full justify-start px-2 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                              >
                                <Notebook size={14} className="mr-2 shrink-0" />
                                <span className="text-xs truncate">
                                  {note?.title || "No Title"}
                                </span>
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Section - removed border */}
          <div className="p-4">
            <Button
              onClick={() => setShowNoteDialog(true)}
              className={`w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 rounded-lg ${
                isCollapsed ? "px-3" : ""
              }`}
              title={isCollapsed ? "Add Note" : ""}
            >
              <Notebook size={18} className={isCollapsed ? "" : "mr-2"} />
              {!isCollapsed && "Add Note"}
            </Button>
          </div>
        </div>
      </div>
      {selectedNote && (
        <Addnotedialog
          open={true}
          setOpen={handleEditDialogClose}
          noteToEdit={selectedNote}
        />
      )}
      <Addnotedialog open={showAddNoteDialog} setOpen={setShowNoteDialog} />
    </>
  );
};

export default Sidebar;
