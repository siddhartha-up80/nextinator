# Pin Functionality Documentation

## Overview
The pin functionality allows users to pin important notes to the top of their notes list. Pinned notes are stored in localStorage and persist across browser sessions.

## Files Created/Modified

### 1. `/src/lib/pin-utils.ts`
Utility functions for managing pinned notes:
- `getPinnedNotes()`: Gets array of pinned note IDs from localStorage
- `setPinnedNotes(ids)`: Saves pinned note IDs to localStorage  
- `isNotePinned(noteId)`: Checks if a specific note is pinned
- `toggleNotePin(noteId)`: Toggles pin state and returns new state
- `sortNotesWithPinned(notes)`: Sorts notes array with pinned notes first

### 2. `/src/components/main/addnotedialog.tsx`
Modified to include pin functionality:
- Pin button in header (only active for existing notes)
- Visual feedback with orange color when pinned
- Toast notifications for pin/unpin actions
- Auto-refresh notes list after pin state changes

### 3. `/src/components/main/note.tsx`
Modified to show pin indicators:
- Pin icon next to title for pinned notes
- Orange ring border for pinned notes
- Real-time pin state detection

## Usage in Notes List Component

To implement pinned note sorting in your notes list component, use the `sortNotesWithPinned` utility:

```tsx
import { sortNotesWithPinned } from "@/lib/pin-utils";

// In your notes list component
const NotesListComponent = ({ notes }) => {
  const sortedNotes = sortNotesWithPinned(notes);
  
  return (
    <div>
      {sortedNotes.map(note => (
        <Note key={note.id} note={note} />
      ))}
    </div>
  );
};
```

## Features

### Visual Indicators
- **Pin Button**: Orange when pinned, gray when unpinned
- **Note Cards**: Orange ring border and pin icon for pinned notes
- **Tooltips**: Helpful text explaining pin functionality

### Persistence
- Pin state is stored in localStorage as `pinnedNotes` array
- Survives browser refresh and new sessions
- No database changes required

### Sorting Logic
- Pinned notes appear first in the list
- Within pinned and unpinned groups, notes are sorted by creation date (newest first)
- Maintains existing sorting preferences while respecting pin priority

### User Experience
- Pin button disabled for new notes (must save first)
- Toast notifications for pin/unpin actions
- Immediate visual feedback
- Auto-refresh to show new order

## Example Integration

```tsx
// In your main notes page component
import { useEffect, useState } from 'react';
import { sortNotesWithPinned } from '@/lib/pin-utils';

const NotesPage = () => {
  const [notes, setNotes] = useState([]);
  
  const handleNoteUpdate = () => {
    // Refresh notes list after pin state changes
    fetchNotes();
  };
  
  const fetchNotes = async () => {
    // Your existing fetch logic
    const fetchedNotes = await fetch('/api/notes').then(res => res.json());
    setNotes(fetchedNotes);
  };
  
  // Sort notes with pinned ones first
  const sortedNotes = sortNotesWithPinned(notes);
  
  return (
    <div>
      {sortedNotes.map(note => (
        <Note key={note.id} note={note} />
      ))}
      
      <AddNoteDialog 
        onSuccess={handleNoteUpdate} // Refresh list after changes
        // ... other props
      />
    </div>
  );
};
```

## Technical Notes

- Uses localStorage for persistence (client-side only)
- Pin state is checked on component mount and updates
- Sorting happens on every render (consider memoization for large lists)
- Compatible with existing note structure (only requires `id` and optional `createdAt`)
- Works with any note type that has an `id` field

## Future Enhancements

- Database integration for cross-device sync
- Bulk pin/unpin operations
- Pin categories or priorities
- Pin date tracking
- Keyboard shortcuts for pinning
