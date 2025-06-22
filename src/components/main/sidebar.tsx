"use client";

import Link from "next/link";
import React, { useState } from "react";
import { Button } from "../ui/button";
import {
  Database,
  MessageSquare,
  Notebook,
  ChevronDown,
  ChevronRight,
  FolderIcon,
} from "lucide-react";
import Addnotedialog from "./addnotedialog";
import Image from "next/image";

const Sidebar = ({ allNotes, groups }: any) => {
  const [showAddNoteDialog, setShowNoteDialog] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState<{
    [key: string]: boolean;
  }>({});

  const getColorClass = (color: string) => {
    const colorMap: { [key: string]: string } = {
      "#6366f1": "bg-indigo-500",
      "#8b5cf6": "bg-violet-500",
      "#06b6d4": "bg-cyan-500",
      "#10b981": "bg-emerald-500",
      "#f59e0b": "bg-amber-500",
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
      <div className="md:fixed w-full left-0 top-0 md:bg-gray-50 h-screen md:w-[270px] md:border-r dark:bg-black dark:text-white z-50">
        <div className="space-y-8 md:h-full h-max md:px-3 md:py-4">
          <div className="flex flex-col gap-8">
            <span className="ml-2">
              <h3>
                <Link
                  href={`/`}
                  className="text-2xl md:text-3xl font-bold flex gap-x-1 flex-row leading-tight items-center"
                >
                  <span>
                    <Image
                      height={50}
                      width={50}
                      className="bg-cover mx-auto bg-center object-cover rounded-full"
                      src="/images/logo.jpg"
                      alt="logo"
                    />
                  </span>
                  <span>Next</span>
                  <span className="text-rose-600">Inator</span>
                </Link>
              </h3>
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <Link href={"/inator"} className="">
                <Button
                  variant={"ghost"}
                  className="justify-start px-3 gap-2 text-base font-semibold w-full"
                >
                  <MessageSquare size={24} /> <h3>Chat Bot-Inator</h3>
                </Button>
              </Link>
              <Link href={`/inator/alldata`} className="">
                <Button
                  variant={"ghost"}
                  className="justify-start px-3 gap-2 text-base font-semibold w-full"
                >
                  <Database size={24} />
                  <h3 className="">
                    {allNotes.length === 0 ? "Add New Data ⤵️" : "Your Data"}
                  </h3>
                </Button>
              </Link>
            </div>{" "}
            <div className="px-4 pr-6 flex flex-col gap-2 max-h-[50vh] flex-nowrap overflow-auto flex-shrink-0">
              {/* Ungrouped Notes */}
              {groupedNotes["ungrouped"] &&
                groupedNotes["ungrouped"].length > 0 && (
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleGroup("ungrouped")}
                      className="justify-start px-2 h-8 text-sm font-medium text-gray-600 dark:text-gray-300"
                    >
                      {expandedGroups["ungrouped"] ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                      <FolderIcon size={16} className="ml-1 mr-2" />
                      Ungrouped ({groupedNotes["ungrouped"].length})
                    </Button>
                    {expandedGroups["ungrouped"] && (
                      <div className="ml-6 flex flex-col gap-1">
                        {groupedNotes["ungrouped"].map((note: any) => (
                          <Button
                            className="flex flex-row gap-2 min-h-[32px] text-start justify-start pl-2 flex-shrink-0 w-full h-[fit-content]"
                            variant={"ghost"}
                            size={"sm"}
                            onClick={() => handleNoteClick(note)}
                            key={note.id}
                          >
                            <Notebook size={16} className="shrink-0 flex" />
                            <p className="flex-wrap whitespace-normal flex-grow text-sm">
                              {note?.title ? `${note?.title}` : "No Title"}
                            </p>
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
                  <div key={group.id} className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleGroup(group.id)}
                      className="justify-start px-2 h-8 text-sm font-medium text-gray-600 dark:text-gray-300"
                    >
                      {expandedGroups[group.id] ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                      <div
                        className={`w-3 h-3 rounded-full ml-1 mr-2 ${getColorClass(
                          group.color
                        )}`}
                      />
                      {group.name} ({groupNotes.length})
                    </Button>
                    {expandedGroups[group.id] && (
                      <div className="ml-6 flex flex-col gap-1">
                        {groupNotes.map((note: any) => (
                          <Button
                            className="flex flex-row gap-2 min-h-[32px] text-start justify-start pl-2 flex-shrink-0 w-full h-[fit-content]"
                            variant={"ghost"}
                            size={"sm"}
                            onClick={() => handleNoteClick(note)}
                            key={note.id}
                          >
                            <Notebook size={16} className="shrink-0 flex" />
                            <p className="flex-wrap whitespace-normal flex-grow text-sm">
                              {note?.title ? `${note?.title}` : "No Title"}
                            </p>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto mt-4">
              <Button
                className="flex gap-2 items-center font-semibold text-start justify-center pl-2"
                variant={"default"}
                size={"lg"}
                onClick={() => setShowNoteDialog(true)}
              >
                <Notebook size={22} /> Add Data
              </Button>
            </div>
          </div>
          <div></div>
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
