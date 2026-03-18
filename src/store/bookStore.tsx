import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";
import type {
    AppSettings,
    Book,
    BookAttachment,
    Bookmark,
    Note,
} from "@/types/book";

const BOOKS_KEY = "secondbrain_books";
const NOTES_KEY = "secondbrain_notes";
const SETTINGS_KEY = "secondbrain_settings";

// Valid placement values for command palette anchoring.
const COMMAND_PALETTE_POSITIONS = new Set([
    "top-left",
    "top-center",
    "top-right",
    "center-left",
    "center-center",
    "center-right",
    "bottom-left",
    "bottom-center",
    "bottom-right",
]);

function loadBooks(): Book[] {
    try {
        const parsed = JSON.parse(localStorage.getItem(BOOKS_KEY) || "[]");
        // Migration layer for old localStorage payloads.
        return parsed.map((book: Book) => ({
            groupId: null,
            isFavorite: false,
            readingDates: [],
            bookmarks: [],
            attachments: [],
            ...book,
        }));
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

function loadSettings(): AppSettings {
    const defaults: AppSettings = {
        showIcons: true,
        commandPalettePosition: "top-center",
        stackGroups: false,
        stackMaxVisible: 3,
        autoScrollSpeed: 0,
        sidebarVisible: true,
        showCalendarHeatmap: true,
    };

    try {
        const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") as
            Partial<AppSettings> & { commandPalettePosition?: string };
        const legacyPosition = String(stored.commandPalettePosition ?? "");
        let normalizedPosition = defaults.commandPalettePosition;

        if (legacyPosition === "top") normalizedPosition = "top-center";
        else if (legacyPosition === "center") normalizedPosition = "center-center";
        else if (legacyPosition && COMMAND_PALETTE_POSITIONS.has(legacyPosition)) {
            normalizedPosition = legacyPosition as AppSettings["commandPalettePosition"];
        }

        return {
            ...defaults,
            ...stored,
            commandPalettePosition: normalizedPosition,
        };
    } catch {
        return defaults;
    }
}

const todayISO = () => new Date().toISOString().split("T")[0];

// Seed data shown for first-time users.
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
        groupId: null,
        isFavorite: true,
        readingDates: [todayISO()],
        bookmarks: [],
        attachments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastOpenedAt: new Date().toISOString(),
    },
    {
        id: "seed-2",
        title: "The Pragmatic Programmer",
        author: "David Thomas & Andrew Hunt",
        description: "From journeyman to master - a guide to software craftsmanship.",
        cover: null,
        format: "pdf",
        fileUrl: null,
        audioUrl: null,
        rating: 5,
        progress: 32,
        currentPage: 87,
        totalPages: 352,
        tags: ["programming", "craft"],
        groupId: null,
        isFavorite: false,
        readingDates: [todayISO()],
        bookmarks: [],
        attachments: [],
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
    showNotes: boolean;
    isCommandOpen: boolean;
    isSettingsOpen: boolean;
    isAddBookOpen: boolean;
    isShortcutsOpen: boolean;
    audioUrl: string | null;
    isPlaying: boolean;
    settings: AppSettings;
    // Actions
    addBook: (book: Omit<Book, "id" | "createdAt" | "updatedAt">) => Book;
    updateBook: (id: string, patch: Partial<Book>) => void;
    deleteBook: (id: string) => void;
    openBook: (id: string) => void;
    closeBook: () => void;
    saveProgress: (id: string, progress: number, currentPage?: number) => void;
    toggleFavorite: (id: string) => void;
    addBookmark: (bookId: string, bm: Omit<Bookmark, "id" | "createdAt">) => void;
    removeBookmark: (bookId: string, bmId: string) => void;
    addAttachment: (
        bookId: string,
        attachment: Omit<BookAttachment, "id" | "createdAt">,
    ) => void;
    removeAttachment: (bookId: string, attachmentId: string) => void;
    addNote: (bookId: string, title: string) => Note;
    updateNote: (id: string, patch: Partial<Note>) => void;
    deleteNote: (id: string) => void;
    openNote: (id: string) => void;
    setShowNotes: (v: boolean) => void;
    setCommandOpen: (v: boolean) => void;
    setSettingsOpen: (v: boolean) => void;
    setAddBookOpen: (v: boolean) => void;
    setShortcutsOpen: (v: boolean) => void;
    setAudioUrl: (url: string | null) => void;
    setPlaying: (v: boolean) => void;
    updateSettings: (patch: Partial<AppSettings>) => void;
    notesForBook: (bookId: string) => Note[];
    getLastReadBook: () => Book | null;
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
    const [showNotes, setShowNotes] = useState(false);
    const [isCommandOpen, setCommandOpen] = useState(false);
    const [isSettingsOpen, setSettingsOpen] = useState(false);
    const [isAddBookOpen, setAddBookOpen] = useState(false);
    const [isShortcutsOpen, setShortcutsOpen] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isPlaying, setPlaying] = useState(false);
    const [settings, setSettings] = useState<AppSettings>(loadSettings);

    // Persist store slices.
    useEffect(() => {
        localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
    }, [books]);
    useEffect(() => {
        localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    }, [notes]);
    useEffect(() => {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }, [settings]);

    // Global shell shortcuts.
    useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                setCommandOpen((v) => !v);
            }
            if ((event.metaKey || event.ctrlKey) && event.key === ",") {
                event.preventDefault();
                setSettingsOpen((v) => !v);
            }
            if (event.key === "Escape") {
                setCommandOpen(false);
                setSettingsOpen(false);
                setShortcutsOpen(false);
                setAddBookOpen(false);
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    const addBook = useCallback((data: Omit<Book, "id" | "createdAt" | "updatedAt">) => {
        const now = new Date().toISOString();
        const book: Book = {
            ...data,
            attachments: data.attachments ?? [],
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
        };
        setBooks((prev) => [book, ...prev]);
        return book;
    }, []);

    const updateBook = useCallback((id: string, patch: Partial<Book>) => {
        const updatedAt = new Date().toISOString();
        setBooks((prev) =>
            prev.map((book) =>
                book.id === id ? { ...book, ...patch, updatedAt } : book,
            ),
        );
        setActiveBook((prev) =>
            prev?.id === id ? { ...prev, ...patch, updatedAt } : prev,
        );
    }, []);

    const deleteBook = useCallback((id: string) => {
        setBooks((prev) => prev.filter((book) => book.id !== id));
        setNotes((prev) => prev.filter((note) => note.bookId !== id));
        setActiveBook((prev) => (prev?.id === id ? null : prev));
    }, []);

    const openBook = useCallback(
        (id: string) => {
            const book = books.find((item) => item.id === id);
            if (!book) return;

            const today = todayISO();
            const readingDates = book.readingDates.includes(today)
                ? book.readingDates
                : [...book.readingDates, today];

            const updatedBook: Book = {
                ...book,
                readingDates,
                lastOpenedAt: new Date().toISOString(),
            };

            setActiveBook(updatedBook);
            setBooks((prev) => prev.map((item) => (item.id === id ? updatedBook : item)));
            if (updatedBook.audioUrl) {
                setAudioUrl(updatedBook.audioUrl);
            }
        },
        [books],
    );

    const closeBook = useCallback(() => {
        setActiveBook(null);
        setShowNotes(false);
    }, []);

    const saveProgress = useCallback(
        (id: string, progress: number, currentPage?: number) => {
            updateBook(id, {
                progress: Math.min(100, Math.max(0, progress)),
                ...(currentPage !== undefined ? { currentPage } : {}),
            });
        },
        [updateBook],
    );

    const toggleFavorite = useCallback((id: string) => {
        setBooks((prev) =>
            prev.map((book) =>
                book.id === id
                    ? {
                          ...book,
                          isFavorite: !book.isFavorite,
                          updatedAt: new Date().toISOString(),
                      }
                    : book,
            ),
        );
        setActiveBook((prev) =>
            prev?.id === id ? { ...prev, isFavorite: !prev.isFavorite } : prev,
        );
    }, []);

    const addBookmark = useCallback(
        (bookId: string, bm: Omit<Bookmark, "id" | "createdAt">) => {
            const bookmark: Bookmark = {
                ...bm,
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
            };

            setBooks((prev) =>
                prev.map((book) =>
                    book.id === bookId
                        ? { ...book, bookmarks: [...book.bookmarks, bookmark] }
                        : book,
                ),
            );
            setActiveBook((prev) =>
                prev?.id === bookId
                    ? { ...prev, bookmarks: [...prev.bookmarks, bookmark] }
                    : prev,
            );
        },
        [],
    );

    const removeBookmark = useCallback((bookId: string, bookmarkId: string) => {
        setBooks((prev) =>
            prev.map((book) =>
                book.id === bookId
                    ? {
                          ...book,
                          bookmarks: book.bookmarks.filter((bookmark) => bookmark.id !== bookmarkId),
                      }
                    : book,
            ),
        );
        setActiveBook((prev) =>
            prev?.id === bookId
                ? {
                      ...prev,
                      bookmarks: prev.bookmarks.filter((bookmark) => bookmark.id !== bookmarkId),
                  }
                : prev,
        );
    }, []);

    const addAttachment = useCallback(
        (bookId: string, attachmentData: Omit<BookAttachment, "id" | "createdAt">) => {
            const attachment: BookAttachment = {
                ...attachmentData,
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
            };

            setBooks((prev) =>
                prev.map((book) =>
                    book.id === bookId
                        ? { ...book, attachments: [...(book.attachments || []), attachment] }
                        : book,
                ),
            );
            setActiveBook((prev) =>
                prev?.id === bookId
                    ? { ...prev, attachments: [...(prev.attachments || []), attachment] }
                    : prev,
            );
        },
        [],
    );

    const removeAttachment = useCallback((bookId: string, attachmentId: string) => {
        setBooks((prev) =>
            prev.map((book) =>
                book.id === bookId
                    ? {
                          ...book,
                          attachments: (book.attachments || []).filter(
                              (attachment) => attachment.id !== attachmentId,
                          ),
                      }
                    : book,
            ),
        );
        setActiveBook((prev) =>
            prev?.id === bookId
                ? {
                      ...prev,
                      attachments: (prev.attachments || []).filter(
                          (attachment) => attachment.id !== attachmentId,
                      ),
                  }
                : prev,
        );
    }, []);

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
            prev.map((note) =>
                note.id === id ? { ...note, ...patch, updatedAt: new Date().toISOString() } : note,
            ),
        );
        setActiveNote((prev) => (prev?.id === id ? { ...prev, ...patch } : prev));
    }, []);

    const deleteNote = useCallback((id: string) => {
        setNotes((prev) => prev.filter((note) => note.id !== id));
        setActiveNote((prev) => (prev?.id === id ? null : prev));
    }, []);

    const openNote = useCallback(
        (id: string) => {
            const note = notes.find((item) => item.id === id);
            if (!note) return;
            setActiveNote(note);
            setShowNotes(true);
            openBook(note.bookId);
        },
        [notes, openBook],
    );

    const notesForBook = useCallback(
        (bookId: string) => notes.filter((note) => note.bookId === bookId),
        [notes],
    );

    const getLastReadBook = useCallback((): Book | null => {
        const openedBooks = books.filter((book) => book.lastOpenedAt);
        if (openedBooks.length === 0) return null;
        return openedBooks.reduce((latest, current) =>
            latest.lastOpenedAt! > current.lastOpenedAt! ? latest : current,
        );
    }, [books]);

    const updateSettings = useCallback((patch: Partial<AppSettings>) => {
        setSettings((prev) => ({ ...prev, ...patch }));
    }, []);

    return (
        <BookContext.Provider
            value={{
                books,
                notes,
                activeBook,
                activeNote,
                showNotes,
                isCommandOpen,
                isSettingsOpen,
                isAddBookOpen,
                isShortcutsOpen,
                audioUrl,
                isPlaying,
                settings,
                addBook,
                updateBook,
                deleteBook,
                openBook,
                closeBook,
                saveProgress,
                toggleFavorite,
                addBookmark,
                removeBookmark,
                addAttachment,
                removeAttachment,
                addNote,
                updateNote,
                deleteNote,
                openNote,
                setShowNotes,
                setCommandOpen,
                setSettingsOpen,
                setAddBookOpen,
                setShortcutsOpen,
                setAudioUrl,
                setPlaying,
                updateSettings,
                notesForBook,
                getLastReadBook,
            }}
        >
            {children}
        </BookContext.Provider>
    );
}

export function useBooks() {
    const context = useContext(BookContext);
    if (!context) throw new Error("useBooks must be used inside BookProvider");
    return context;
}
