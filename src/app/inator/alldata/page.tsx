"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useSearchParams, useRouter } from "next/navigation";
import { Note as NoteModel } from "@prisma/client";
import Note from "@/components/main/note";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, FolderIcon, Grid, List, Plus } from "lucide-react";

interface Group {
  id: string;
  name: string;
  color: string;
  _count: {
    notes: number;
  };
}

interface NoteWithGroup extends NoteModel {
  group?: {
    id: string;
    name: string;
    color: string;
  } | null;
}

interface NotesResponse {
  notes: NoteWithGroup[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasMore: boolean;
  };
}

const Page = () => {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [notes, setNotes] = useState<NoteWithGroup[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [viewMode, setViewMode] = useState<"all" | "grouped">("grouped");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout>();

  const NOTES_PER_PAGE = 9;

  // Handle URL parameters
  useEffect(() => {
    const groupParam = searchParams.get("group");
    if (groupParam) {
      setSelectedGroupId(groupParam);
      setViewMode("all"); // Switch to all notes view when filtering by group
    }
  }, [searchParams]);
  const fetchNotes = useCallback(
    async (
      pageNum: number = 1,
      searchTerm: string = "",
      groupId: string = "",
      reset: boolean = true
    ) => {
      if (!user) return;
      if (reset) {
        setLoading(true);
        setNotes([]);
        setPage(1);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const params = new URLSearchParams({
          page: pageNum.toString(),
          limit: NOTES_PER_PAGE.toString(),
          ...(searchTerm && { search: searchTerm }),
          ...(groupId && { groupId }),
        });
        const response = await fetch(`/api/notes?${params}`);
        if (response.ok) {
          const data: NotesResponse = await response.json();

          // Convert date strings to Date objects
          const notesWithDates = data.notes.map((note) => ({
            ...note,
            createdAt: new Date(note.createdAt),
            updatedAt: new Date(note.updatedAt),
          }));

          if (reset) {
            setNotes(notesWithDates);
          } else {
            setNotes((prev) => [...prev, ...notesWithDates]);
          }

          setHasMore(data.pagination.hasMore);
          setPage(pageNum);
        }
      } catch (error) {
        console.error("Failed to fetch notes:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [user]
  );
  const fetchGroups = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch("/api/groups");
      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups);
      }
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    }
  }, [user]);
  // Initial load
  useEffect(() => {
    if (isLoaded && user) {
      fetchGroups();
      fetchNotes(1, search, selectedGroupId, true);
    }
  }, [isLoaded, user, fetchNotes, fetchGroups]);

  // Search with debounce
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      fetchNotes(1, search, selectedGroupId, true);
    }, 300);

    setSearchTimeout(timeout);
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [search, fetchNotes]);
  // Handle group filter change
  useEffect(() => {
    if (user) {
      fetchNotes(1, search, selectedGroupId, true);
    }
  }, [selectedGroupId, user, fetchNotes]);
  // Infinite scroll logic
  const handleScroll = useCallback(() => {
    // Only enable infinite scroll when:
    // 1. In "all" view mode, OR
    // 2. When filtering by a specific group (selectedGroupId is set)
    // Disable when in grouped preview mode (viewMode === "grouped" && !selectedGroupId)
    if (loading || loadingMore || !hasMore) return;
    if (viewMode === "grouped" && !selectedGroupId) return;

    const scrollTop =
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop;
    const windowHeight =
      window.innerHeight || document.documentElement.clientHeight;
    const documentHeight = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    ); // Load more when user is 200px from the bottom
    if (scrollTop + windowHeight >= documentHeight - 200) {
      fetchNotes(page + 1, search, selectedGroupId, false);
    }
  }, [
    loading,
    loadingMore,
    hasMore,
    page,
    search,
    selectedGroupId,
    fetchNotes,
  ]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p>Please sign in to view your notes.</p>
      </div>
    );
  }
  return (
    <div className="py-5 md:px-5 mx-auto max-w-7xl">
      {" "}
      {/* Header Controls */}
      <div className="mb-6 space-y-4">
        {/* Search Input */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* View Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* View Mode Toggle or Back Button */}
          {selectedGroupId ? (
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedGroupId("");
                  setViewMode("grouped");
                  router.push("/inator/alldata");
                }}
              >
                ← Back to Groups
              </Button>
              <div className="text-sm text-muted-foreground">
                {selectedGroupId === "ungrouped"
                  ? "Viewing Ungrouped Notes"
                  : `Viewing: ${
                      groups.find((g) => g.id === selectedGroupId)?.name ||
                      "Unknown Group"
                    }`}
              </div>
            </div>
          ) : (
            <div className="flex rounded-lg border">
              <Button
                variant={viewMode === "grouped" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grouped")}
                className="rounded-r-none"
              >
                <FolderIcon size={16} className="mr-2" />
                Grouped
              </Button>
              <Button
                variant={viewMode === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("all")}
                className="rounded-l-none"
              >
                <Grid size={16} className="mr-2" />
                All Notes
              </Button>
            </div>
          )}{" "}
          {/* Group Filter (only show when in grouped mode and no specific group selected) */}
          {viewMode === "grouped" && !selectedGroupId && (
            <div className="flex gap-2 items-center">
              {" "}
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-background text-foreground"
                title="Filter by group"
              >
                <option value="">All Groups</option>
                <option value="ungrouped">Ungrouped Notes</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} ({group._count.notes})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>{" "}
      {/* Content */}
      {viewMode === "grouped" && !selectedGroupId ? (
        <GroupedNotesView groups={groups} />
      ) : (
        <RegularNotesView
          notes={notes}
          loading={loading}
          loadingMore={loadingMore}
          search={search}
          hasMore={hasMore}
        />
      )}{" "}
      {/* Loading Indicator */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading notes...</span>
        </div>
      )}
    </div>
  );
};

// Component for grouped view without filter
const GroupedNotesView = ({ groups }: { groups: Group[] }) => {
  const router = useRouter();
  const [groupNotes, setGroupNotes] = useState<{
    [key: string]: NoteWithGroup[];
  }>({});
  const [loadingGroups, setLoadingGroups] = useState<{
    [key: string]: boolean;
  }>({});
  const fetchGroupNotes = async (groupId: string | null) => {
    const key = groupId || "ungrouped";
    setLoadingGroups((prev) => ({ ...prev, [key]: true }));

    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "6", // Show first 6 notes per group
        groupId: groupId === null ? "ungrouped" : groupId,
      });

      const response = await fetch(`/api/notes?${params}`);
      if (response.ok) {
        const data = await response.json();

        const notesWithDates = data.notes.map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
        }));

        setGroupNotes((prev) => ({ ...prev, [key]: notesWithDates }));
      }
    } catch (error) {
      console.error(`Failed to fetch notes for group ${key}:`, error);
    } finally {
      setLoadingGroups((prev) => ({ ...prev, [key]: false }));
    }
  };

  useEffect(() => {
    // Fetch notes for each group
    groups.forEach((group) => {
      fetchGroupNotes(group.id);
    });

    // Also fetch ungrouped notes
    fetchGroupNotes(null);
  }, [groups]);

  return (
    <div className="space-y-8">
      {" "}
      {/* Ungrouped Notes */}
      <GroupSection
        title="Ungrouped Notes"
        color="#6b7280"
        notes={groupNotes["ungrouped"] || []}
        loading={loadingGroups["ungrouped"]}
        onViewAll={() => router.push("?group=ungrouped")}
      />
      {/* Grouped Notes */}
      {groups.map((group) => (
        <GroupSection
          key={group.id}
          title={group.name}
          color={group.color}
          count={group._count.notes}
          notes={groupNotes[group.id] || []}
          loading={loadingGroups[group.id]}
          onViewAll={() => router.push(`?group=${group.id}`)}
        />
      ))}
    </div>
  );
};

// Component for individual group section
const GroupSection = ({
  title,
  color,
  count,
  notes,
  loading,
  onViewAll,
}: {
  title: string;
  color: string;
  count?: number;
  notes: NoteWithGroup[];
  loading: boolean;
  onViewAll: () => void;
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {" "}
        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full bg-indigo-500`} />
          <h2 className="text-xl font-semibold">
            {title} {count !== undefined && `(${count})`}
          </h2>
        </div>
        {notes.length > 0 && (
          <Button variant="outline" size="sm" onClick={onViewAll}>
            View All
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="border rounded-lg p-4 animate-pulse"
            >
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : notes.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {notes.slice(0, 6).map((note) => (
            <Note note={note} key={note.id} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>No notes in this group yet.</p>
        </div>
      )}
    </div>
  );
};

// Component for regular notes view
const RegularNotesView = ({
  notes,
  loading,
  loadingMore,
  search,
  hasMore,
}: {
  notes: NoteWithGroup[];
  loading: boolean;
  loadingMore: boolean;
  search: string;
  hasMore: boolean;
}) => {
  return (
    <>
      {/* Notes Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mx-auto">
        {notes.map((note) => (
          <Note note={note} key={note.id} />
        ))}

        {/* Loading skeleton */}
        {loadingMore &&
          Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="border rounded-lg p-4 animate-pulse"
            >
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>
          ))}
      </div>{" "}
      {/* Empty State */}
      {!loading && notes.length === 0 && (
        <div className="text-center col-span-full mt-8">
          {search ? (
            <>
              <h1 className="text-2xl font-bold">No notes found</h1>
              <p className="mt-1 text-base">
                Try adjusting your search terms or clear the search to see all
                notes.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold">
                Oh no!
                <br />
                You haven't added any data yet.
              </h1>
              <p className="mt-1 text-base">But you can change that!</p>
              <p className="mt-1 text-base">
                Just click on the "Add Data" button and add your custom data.
              </p>
            </>
          )}
        </div>
      )}
      {/* End of results indicator */}
      {!loading && !hasMore && notes.length > 0 && (
        <div className="text-center py-8 text-gray-500 mt-8">
          <p>You've reached the end of your notes!</p>
        </div>
      )}
    </>
  );
};

export default Page;
