import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Book, Note, AppView } from "@/types/book";

const BOOKS_KEY = "secondbrain_books";
const NOTES_KEY = "secondbrain_notes";

function loadBooks(): Book[] {
  try {
    return JSON.parse(localStorage.getItem(BOOKS_KEY) || "[]");
  } catch {
    return [];
  }
}

function loadNotes(): Note[] {
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY) || "[]");
  } catch {
    return [];
  }
}

// ── Demo seed books (no real files — placeholders) ──
const SEED_BOOKS: Book[] = [
  {
    id: "seed-1",
    title: "Deep Work",
    author: "Cal Newport",
    description:
      "Rules for focused success in a distracted world. A must-read for knowledge workers.",
    cover: null,
    format: "audio",
    fileUrl: null,
    audioUrl: "https://www.youtube.com/watch?v=gTaJhjQHcf8",
    rating: 5,
    progress: 74,
    currentPage: 0,
    totalPages: 0,
    tags: ["productivity", "focus"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastOpenedAt: null,
  },
  {
    id: "seed-2",
    title: "The Pragmatic Programmer",
    author: "David Thomas & Andrew Hunt",
    description:
      "From journeyman to master — a guide to software craftsmanship.",
    cover: null,
    format: "pdf",
    fileUrl: null,
    audioUrl: null,
    rating: 5,
    progress: 32,
    currentPage: 87,
    totalPages: 352,
    tags: ["programming", "craft"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastOpenedAt: null,
  },
];

interface BookStore {
  books: Book[];
  notes: Note[];
  activeBook: Book | null;
  activeNote: Note | null;
  currentView: AppView;
  showNotes: boolean;
  isCommandOpen: boolean;
  audioUrl: string | null;
  isPlaying: boolean;
  // Actions
  addBook: (book: Omit<Book, "id" | "createdAt" | "updatedAt">) => Book;
  updateBook: (id: string, patch: Partial<Book>) => void;
  deleteBook: (id: string) => void;
  openBook: (id: string) => void;
  closeBook: () => void;
  saveProgress: (id: string, progress: number, currentPage?: number) => void;
  addNote: (bookId: string, title: string) => Note;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  openNote: (id: string) => void;
  setView: (v: AppView) => void;
  setShowNotes: (v: boolean) => void;
  setCommandOpen: (v: boolean) => void;
  setAudioUrl: (url: string | null) => void;
  setPlaying: (v: boolean) => void;
  notesForBook: (bookId: string) => Note[];
}

const BookContext = createContext<BookStore | null>(null);

export function BookProvider({ children }: { children: React.ReactNode }) {
  const [books, setBooks] = useState<Book[]>(() => {
    const stored = loadBooks();
    return stored.length > 0 ? stored : SEED_BOOKS;
  });
  const [notes, setNotes] = useState<Note[]>(loadNotes);
  const [activeBook, setActiveBook] = useState<Book | null>(null);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [currentView, setCurrentView] = useState<AppView>("library");
  const [showNotes, setShowNotes] = useState(false);
  const [isCommandOpen, setCommandOpen] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setPlaying] = useState(false);

  // Persist books & notes
  useEffect(() => {
    localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
  }, [books]);
  useEffect(() => {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  }, [notes]);

  // Global Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const addBook = useCallback(
    (data: Omit<Book, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString();
      const book: Book = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };
      setBooks((prev) => [book, ...prev]);
      return book;
    },
    []
  );

  const updateBook = useCallback((id: string, patch: Partial<Book>) => {
    setBooks((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, ...patch, updatedAt: new Date().toISOString() } : b
      )
    );
    setActiveBook((prev) =>
      prev?.id === id ? { ...prev, ...patch, updatedAt: new Date().toISOString() } : prev
    );
  }, []);

  const deleteBook = useCallback((id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
    if (activeBook?.id === id) {
      setActiveBook(null);
      setCurrentView("library");
    }
  }, [activeBook]);

  const openBook = useCallback(
    (id: string) => {
      const book = books.find((b) => b.id === id);
      if (!book) return;
      const updated = { ...book, lastOpenedAt: new Date().toISOString() };
      setActiveBook(updated);
      setBooks((prev) =>
        prev.map((b) => (b.id === id ? updated : b))
      );
      setCurrentView("reader");
      if (book.audioUrl) {
        setAudioUrl(book.audioUrl);
      }
    },
    [books]
  );

  const closeBook = useCallback(() => {
    setActiveBook(null);
    setCurrentView("library");
    setShowNotes(false);
  }, []);

  const saveProgress = useCallback(
    (id: string, progress: number, currentPage?: number) => {
      updateBook(id, {
        progress: Math.min(100, Math.max(0, progress)),
        ...(currentPage !== undefined ? { currentPage } : {}),
      });
    },
    [updateBook]
  );

  const addNote = useCallback((bookId: string, title: string) => {
    const now = new Date().toISOString();
    const note: Note = {
      id: crypto.randomUUID(),
      bookId,
      title,
      content: `# ${title}\n\n`,
      createdAt: now,
      updatedAt: now,
    };
    setNotes((prev) => [note, ...prev]);
    setActiveNote(note);
    return note;
  }, []);

  const updateNote = useCallback((id: string, patch: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n
      )
    );
    setActiveNote((prev) =>
      prev?.id === id ? { ...prev, ...patch } : prev
    );
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (activeNote?.id === id) setActiveNote(null);
  }, [activeNote]);

  const openNote = useCallback(
    (id: string) => {
      const note = notes.find((n) => n.id === id);
      if (note) {
        setActiveNote(note);
        setShowNotes(true);
        const book = books.find((b) => b.id === note.bookId);
        if (book) {
          setActiveBook(book);
          setCurrentView("reader");
        }
      }
    },
    [notes, books]
  );

  const notesForBook = useCallback(
    (bookId: string) => notes.filter((n) => n.bookId === bookId),
    [notes]
  );

  return (
    <BookContext.Provider
      value={{
        books,
        notes,
        activeBook,
        activeNote,
        currentView,
        showNotes,
        isCommandOpen,
        audioUrl,
        isPlaying,
        addBook,
        updateBook,
        deleteBook,
        openBook,
        closeBook,
        saveProgress,
        addNote,
        updateNote,
        deleteNote,
        openNote,
        setView: setCurrentView,
        setShowNotes,
        setCommandOpen,
        setAudioUrl,
        setPlaying,
        notesForBook,
      }}
    >
      {children}
    </BookContext.Provider>
  );
}

export function useBooks() {
  const ctx = useContext(BookContext);
  if (!ctx) throw new Error("useBooks must be used inside BookProvider");
  return ctx;
}
