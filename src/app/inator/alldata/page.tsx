"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { Note as NoteModel } from "@prisma/client";
import Note from "@/components/main/note";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";

interface NotesResponse {
  notes: NoteModel[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasMore: boolean;
  };
}

const Page = () => {
  const { user, isLoaded } = useUser();
  const [notes, setNotes] = useState<NoteModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout>();

  const NOTES_PER_PAGE = 9;

  const fetchNotes = useCallback(
    async (
      pageNum: number = 1,
      searchTerm: string = "",
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

  // Initial load
  useEffect(() => {
    if (isLoaded && user) {
      fetchNotes(1, search, true);
    }
  }, [isLoaded, user, fetchNotes]);

  // Search with debounce
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      fetchNotes(1, search, true);
    }, 300);

    setSearchTimeout(timeout);

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [search, fetchNotes]); // Infinite scroll logic
  const handleScroll = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;

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
    );

    // Load more when user is 200px from the bottom
    if (scrollTop + windowHeight >= documentHeight - 200) {
      console.log("Infinite scroll triggered - loading more notes");
      fetchNotes(page + 1, search, false);
    }
  }, [loading, loadingMore, hasMore, page, search, fetchNotes]);

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
      {/* Search Input */}
      <div className="mb-6 relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

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
      </div>

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

      {/* Loading Indicator */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading notes...</span>
        </div>
      )}

      {/* End of results indicator */}
      {!loading && !hasMore && notes.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>You've reached the end of your notes!</p>
        </div>
      )}
    </div>
  );
};

export default Page;
