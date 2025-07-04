/**
 * Utility functions for handling pinned notes using localStorage
 */

export const getPinnedNotes = (): string[] => {
  if (typeof window !== 'undefined') {
    const pinned = localStorage.getItem('pinnedNotes');
    return pinned ? JSON.parse(pinned) : [];
  }
  return [];
};

export const setPinnedNotes = (pinnedIds: string[]): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('pinnedNotes', JSON.stringify(pinnedIds));
  }
};

export const isNotePinned = (noteId: string): boolean => {
  const pinnedNotes = getPinnedNotes();
  return pinnedNotes.includes(noteId);
};

export const toggleNotePin = (noteId: string): boolean => {
  const pinnedNotes = getPinnedNotes();
  const isCurrentlyPinned = pinnedNotes.includes(noteId);
  
  let updatedPinnedNotes;
  if (isCurrentlyPinned) {
    updatedPinnedNotes = pinnedNotes.filter((id: string) => id !== noteId);
  } else {
    updatedPinnedNotes = [...pinnedNotes, noteId];
  }
  
  setPinnedNotes(updatedPinnedNotes);
  return !isCurrentlyPinned; // Return new pinned state
};

/**
 * Sort notes with pinned notes first
 * @param notes Array of notes with id property
 * @returns Sorted array with pinned notes first
 */
export const sortNotesWithPinned = <T extends { id: string; createdAt?: string | Date }>(notes: T[]): T[] => {
  const pinnedNotes = getPinnedNotes();
  
  const pinned = notes.filter(note => pinnedNotes.includes(note.id));
  const unpinned = notes.filter(note => !pinnedNotes.includes(note.id));
  
  // Sort each group by creation date (newest first)
  const sortByDate = (a: T, b: T) => {
    if (!a.createdAt || !b.createdAt) return 0;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  };
  
  pinned.sort(sortByDate);
  unpinned.sort(sortByDate);
  
  // Debug logging
  if (pinnedNotes.length > 0) {
    console.log('Pinned notes found:', pinnedNotes);
    console.log('Pinned notes in list:', pinned.length);
    console.log('Total notes:', notes.length);
  }
  
  return [...pinned, ...unpinned];
};
