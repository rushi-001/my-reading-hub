import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AppSettings, Book, BookFormat, Note } from "@/types/book";

export const BOOKS_KEY = "secondbrain_books";
export const NOTES_KEY = "secondbrain_notes";
export const SETTINGS_KEY = "secondbrain_settings";

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

const todayISO = () => new Date().toISOString().split("T")[0];

const DEFAULT_SETTINGS: AppSettings = {
    showIcons: true,
    commandPalettePosition: "top-center",
    stackGroups: false,
    stackMaxVisible: 3,
    autoScrollSpeed: 0,
    sidebarVisible: true,
    showCalendarHeatmap: true,
};

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

function loadBooks(): Book[] {
    try {
        const raw = JSON.parse(localStorage.getItem(BOOKS_KEY) || "[]") as Book[];
        const migrated = raw.map((book) => ({
            groupId: null,
            isFavorite: false,
            readingDates: [],
            bookmarks: [],
            attachments: [],
            ...book,
        }));
        return migrated.length > 0 ? migrated : SEED_BOOKS;
    } catch {
        return SEED_BOOKS;
    }
}

function loadNotes(): Note[] {
    try {
        return JSON.parse(localStorage.getItem(NOTES_KEY) || "[]") as Note[];
    } catch {
        return [];
    }
}

function loadSettings(): AppSettings {
    try {
        const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") as
            Partial<AppSettings> & { commandPalettePosition?: string };
        const legacyPosition = String(stored.commandPalettePosition ?? "");
        let normalizedPosition = DEFAULT_SETTINGS.commandPalettePosition;

        if (legacyPosition === "top") normalizedPosition = "top-center";
        else if (legacyPosition === "center") normalizedPosition = "center-center";
        else if (
            legacyPosition &&
            COMMAND_PALETTE_POSITIONS.has(legacyPosition)
        ) {
            normalizedPosition =
                legacyPosition as AppSettings["commandPalettePosition"];
        }

        return {
            ...DEFAULT_SETTINGS,
            ...stored,
            commandPalettePosition: normalizedPosition,
        };
    } catch {
        return DEFAULT_SETTINGS;
    }
}

export interface BookState {
    books: Book[];
    notes: Note[];
    activeBookId: string | null;
    activeNoteId: string | null;
    showNotes: boolean;
    isCommandOpen: boolean;
    isSettingsOpen: boolean;
    isAddBookOpen: boolean;
    isShortcutsOpen: boolean;
    audioUrl: string | null;
    isPlaying: boolean;
    settings: AppSettings;
    library: {
        items: Book[];
        query: string;
        filter: "all" | "favorites" | BookFormat;
        groupFilter: string;
        page: number;
        pageSize: number;
        totalItems: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        isLoading: boolean;
    };
    commandSearch: {
        query: string;
        results: Book[];
        totalItems: number;
        isLoading: boolean;
    };
    api: {
        isSyncing: boolean;
        lastError: string | null;
    };
}

const initialState: BookState = {
    books: loadBooks(),
    notes: loadNotes(),
    activeBookId: null,
    activeNoteId: null,
    showNotes: false,
    isCommandOpen: false,
    isSettingsOpen: false,
    isAddBookOpen: false,
    isShortcutsOpen: false,
    audioUrl: null,
    isPlaying: false,
    settings: loadSettings(),
    library: {
        items: [],
        query: "",
        filter: "all",
        groupFilter: "all",
        page: 1,
        pageSize: 24,
        totalItems: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
        isLoading: false,
    },
    commandSearch: {
        query: "",
        results: [],
        totalItems: 0,
        isLoading: false,
    },
    api: {
        isSyncing: false,
        lastError: null,
    },
};

export const bookSlice = createSlice({
    name: "book",
    initialState,
    reducers: {
        setBooks(state, action: PayloadAction<Book[]>) {
            state.books = action.payload.map((book) => ({
                groupId: null,
                isFavorite: false,
                readingDates: [],
                bookmarks: [],
                attachments: [],
                ...book,
            }));
        },
        setNotes(state, action: PayloadAction<Note[]>) {
            state.notes = action.payload;
        },
        setSettings(state, action: PayloadAction<AppSettings>) {
            state.settings = {
                ...DEFAULT_SETTINGS,
                ...action.payload,
            };
        },
        mergeBookFromApi(state, action: PayloadAction<Book>) {
            const incoming = action.payload;
            const existingIndex = state.books.findIndex((b) => b.id === incoming.id);
            const migrated = {
                groupId: null,
                isFavorite: false,
                readingDates: [],
                bookmarks: [],
                attachments: [],
                ...incoming,
            };
            if (existingIndex === -1) {
                state.books.unshift(migrated);
                return;
            }
            state.books[existingIndex] = migrated;
        },
        mergeNoteFromApi(state, action: PayloadAction<Note>) {
            const incoming = action.payload;
            const existingIndex = state.notes.findIndex((note) => note.id === incoming.id);
            if (existingIndex === -1) {
                state.notes.unshift(incoming);
                return;
            }
            state.notes[existingIndex] = incoming;
        },
        addBookLocal(state, action: PayloadAction<Book>) {
            state.books.unshift(action.payload);
        },
        updateBookLocal(
            state,
            action: PayloadAction<{ id: string; patch: Partial<Book> }>,
        ) {
            const { id, patch } = action.payload;
            state.books = state.books.map((book) =>
                book.id === id
                    ? { ...book, ...patch, updatedAt: new Date().toISOString() }
                    : book,
            );
        },
        deleteBookLocal(state, action: PayloadAction<string>) {
            const id = action.payload;
            state.books = state.books.filter((book) => book.id !== id);
            const removedNoteIds = new Set(
                state.notes
                    .filter((note) => note.bookId === id)
                    .map((note) => note.id),
            );
            state.notes = state.notes.filter((note) => note.bookId !== id);
            if (state.activeBookId === id) {
                state.activeBookId = null;
            }
            if (state.activeNoteId && removedNoteIds.has(state.activeNoteId)) {
                state.activeNoteId = null;
            }
        },
        addNoteLocal(state, action: PayloadAction<Note>) {
            state.notes.unshift(action.payload);
            state.activeNoteId = action.payload.id;
        },
        updateNoteLocal(
            state,
            action: PayloadAction<{ id: string; patch: Partial<Note> }>,
        ) {
            const { id, patch } = action.payload;
            state.notes = state.notes.map((note) =>
                note.id === id
                    ? { ...note, ...patch, updatedAt: new Date().toISOString() }
                    : note,
            );
        },
        deleteNoteLocal(state, action: PayloadAction<string>) {
            const id = action.payload;
            state.notes = state.notes.filter((note) => note.id !== id);
            if (state.activeNoteId === id) state.activeNoteId = null;
        },
        updateSettingsLocal(state, action: PayloadAction<Partial<AppSettings>>) {
            state.settings = { ...state.settings, ...action.payload };
        },
        setActiveBookId(state, action: PayloadAction<string | null>) {
            state.activeBookId = action.payload;
        },
        setActiveNoteId(state, action: PayloadAction<string | null>) {
            state.activeNoteId = action.payload;
        },
        setShowNotes(state, action: PayloadAction<boolean>) {
            state.showNotes = action.payload;
        },
        setCommandOpen(state, action: PayloadAction<boolean>) {
            state.isCommandOpen = action.payload;
        },
        setSettingsOpen(state, action: PayloadAction<boolean>) {
            state.isSettingsOpen = action.payload;
        },
        setAddBookOpen(state, action: PayloadAction<boolean>) {
            state.isAddBookOpen = action.payload;
        },
        setShortcutsOpen(state, action: PayloadAction<boolean>) {
            state.isShortcutsOpen = action.payload;
        },
        setAudioUrl(state, action: PayloadAction<string | null>) {
            state.audioUrl = action.payload;
            if (!action.payload) state.isPlaying = false;
        },
        setPlaying(state, action: PayloadAction<boolean>) {
            state.isPlaying = action.payload;
        },
        setApiSyncing(state, action: PayloadAction<boolean>) {
            state.api.isSyncing = action.payload;
        },
        setApiError(state, action: PayloadAction<string | null>) {
            state.api.lastError = action.payload;
        },
        setLibraryLoading(state, action: PayloadAction<boolean>) {
            state.library.isLoading = action.payload;
        },
        setLibraryResults(
            state,
            action: PayloadAction<{
                items: Book[];
                query: string;
                filter: "all" | "favorites" | BookFormat;
                groupFilter: string;
                page: number;
                pageSize: number;
                totalItems: number;
                totalPages: number;
                hasNextPage: boolean;
                hasPrevPage: boolean;
            }>,
        ) {
            state.library = {
                ...state.library,
                items: action.payload.items.map((book) => ({
                    groupId: null,
                    isFavorite: false,
                    readingDates: [],
                    bookmarks: [],
                    attachments: [],
                    ...book,
                })),
                query: action.payload.query,
                filter: action.payload.filter,
                groupFilter: action.payload.groupFilter,
                page: action.payload.page,
                pageSize: action.payload.pageSize,
                totalItems: action.payload.totalItems,
                totalPages: action.payload.totalPages,
                hasNextPage: action.payload.hasNextPage,
                hasPrevPage: action.payload.hasPrevPage,
            };
        },
        setCommandSearchLoading(state, action: PayloadAction<boolean>) {
            state.commandSearch.isLoading = action.payload;
        },
        setCommandSearchResults(
            state,
            action: PayloadAction<{
                query: string;
                items: Book[];
                totalItems: number;
            }>,
        ) {
            state.commandSearch = {
                ...state.commandSearch,
                query: action.payload.query,
                totalItems: action.payload.totalItems,
                results: action.payload.items.map((book) => ({
                    groupId: null,
                    isFavorite: false,
                    readingDates: [],
                    bookmarks: [],
                    attachments: [],
                    ...book,
                })),
            };
        },
        clearCommandSearch(state) {
            state.commandSearch = {
                query: "",
                results: [],
                totalItems: 0,
                isLoading: false,
            };
        },
    },
});

export const bookActions = bookSlice.actions;
export const bookReducer = bookSlice.reducer;
