import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
    AppSettings,
    Book,
    BookAttachment,
    BookFormat,
    Note,
} from "@/types/book";

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

type LegacyBookAttachment = Partial<BookAttachment> & { dataUrl?: string };

function normalizeAttachment(
    attachment: LegacyBookAttachment,
): BookAttachment {
    const fallbackUrl = attachment.dataUrl ?? "";
    const url =
        typeof attachment.url === "string" && attachment.url.length > 0
            ? attachment.url
            : fallbackUrl;

    return {
        id:
            typeof attachment.id === "string" && attachment.id.length > 0
                ? attachment.id
                : `attachment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: attachment.name ?? "Attachment",
        mimeType: attachment.mimeType ?? "application/octet-stream",
        size: Number.isFinite(attachment.size) ? Number(attachment.size) : 0,
        url,
        createdAt: attachment.createdAt ?? new Date().toISOString(),
    };
}

function normalizeBook(book: Book): Book {
    const legacyAttachments = Array.isArray(book.attachments)
        ? (book.attachments as LegacyBookAttachment[])
        : [];

    return {
        groupId: null,
        isFavorite: false,
        readingDates: [],
        bookmarks: [],
        ...book,
        attachments: legacyAttachments
            .map(normalizeAttachment)
            .filter((attachment) => attachment.url.length > 0),
    };
}

function loadBooks(): Book[] {
    try {
        const raw = JSON.parse(localStorage.getItem(BOOKS_KEY) || "[]") as Book[];
        const migrated = raw.map(normalizeBook);
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

function dedupeBooks(books: Book[]): Book[] {
    return Array.from(new Map(books.map((book) => [book.id, book])).values());
}

function recomputeLibraryPagination(
    library: BookState["library"],
) {
    const safePageSize = Math.max(1, library.pageSize);
    library.totalPages = Math.max(1, Math.ceil(library.totalItems / safePageSize));
    library.page = Math.min(Math.max(1, library.page), library.totalPages);
    library.hasPrevPage = library.page > 1;
    library.hasNextPage = library.page < library.totalPages;
}

function bookMatchesLibraryFilters(
    book: Book,
    library: BookState["library"],
): boolean {
    if (library.filter === "favorites" && !book.isFavorite) {
        return false;
    }

    if (
        library.filter !== "all" &&
        library.filter !== "favorites" &&
        book.format !== library.filter
    ) {
        return false;
    }

    if (library.groupFilter !== "all" && book.groupId !== library.groupFilter) {
        return false;
    }

    const normalizedQuery = library.query.trim().toLowerCase();
    if (!normalizedQuery) return true;

    const searchable = [
        book.title,
        book.author,
        book.description,
        ...book.tags,
        book.groupId ?? "",
    ]
        .join(" ")
        .toLowerCase();

    return searchable.includes(normalizedQuery);
}

function syncBookAcrossDerivedState(
    state: BookState,
    nextBook: Book,
    previousBook?: Book,
) {
    const previousMatched = previousBook
        ? bookMatchesLibraryFilters(previousBook, state.library)
        : false;
    const nextMatched = bookMatchesLibraryFilters(nextBook, state.library);
    const existingLibraryIndex = state.library.items.findIndex(
        (book) => book.id === nextBook.id,
    );

    if (existingLibraryIndex >= 0) {
        if (nextMatched) {
            state.library.items[existingLibraryIndex] = nextBook;
        } else {
            state.library.items.splice(existingLibraryIndex, 1);
        }
    } else if (nextMatched && state.library.page === 1) {
        state.library.items.unshift(nextBook);
    }

    if (!previousBook && nextMatched) {
        state.library.totalItems += 1;
    } else if (previousBook && previousMatched && !nextMatched) {
        state.library.totalItems = Math.max(0, state.library.totalItems - 1);
    } else if (previousBook && !previousMatched && nextMatched) {
        state.library.totalItems += 1;
    }

    state.library.items = dedupeBooks(state.library.items).slice(
        0,
        state.library.pageSize,
    );
    recomputeLibraryPagination(state.library);

    state.commandSearch.results = state.commandSearch.results.map((book) =>
        book.id === nextBook.id ? nextBook : book,
    );
}

function removeBookAcrossDerivedState(state: BookState, book: Book) {
    if (bookMatchesLibraryFilters(book, state.library)) {
        state.library.totalItems = Math.max(0, state.library.totalItems - 1);
    }

    state.library.items = state.library.items.filter((item) => item.id !== book.id);
    recomputeLibraryPagination(state.library);
    state.commandSearch.results = state.commandSearch.results.filter(
        (item) => item.id !== book.id,
    );
}

export const bookSlice = createSlice({
    name: "book",
    initialState,
    reducers: {
        setBooks(state, action: PayloadAction<Book[]>) {
            state.books = action.payload.map(normalizeBook);
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
            const migrated = normalizeBook(incoming);
            const previousBook =
                existingIndex === -1 ? undefined : state.books[existingIndex];
            if (existingIndex === -1) {
                state.books.unshift(migrated);
            } else {
                state.books[existingIndex] = migrated;
            }

            syncBookAcrossDerivedState(state, migrated, previousBook);
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
            const book = normalizeBook(action.payload);
            state.books.unshift(book);
            syncBookAcrossDerivedState(state, book);
        },
        updateBookLocal(
            state,
            action: PayloadAction<{ id: string; patch: Partial<Book> }>,
        ) {
            const { id, patch } = action.payload;
            const existingIndex = state.books.findIndex((book) => book.id === id);
            if (existingIndex === -1) return;

            const previousBook = state.books[existingIndex];
            const nextBook = normalizeBook({
                ...previousBook,
                ...patch,
                updatedAt: new Date().toISOString(),
            });

            state.books[existingIndex] = nextBook;
            syncBookAcrossDerivedState(state, nextBook, previousBook);
        },
        deleteBookLocal(state, action: PayloadAction<string>) {
            const id = action.payload;
            const removedBook = state.books.find((book) => book.id === id);
            state.books = state.books.filter((book) => book.id !== id);
            const removedNoteIds = new Set(
                state.notes
                    .filter((note) => note.bookId === id)
                    .map((note) => note.id),
            );
            state.notes = state.notes.filter((note) => note.bookId !== id);
            if (removedBook) {
                removeBookAcrossDerivedState(state, removedBook);
            }
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
                items: action.payload.items.map(normalizeBook),
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
                results: action.payload.items.map(normalizeBook),
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
