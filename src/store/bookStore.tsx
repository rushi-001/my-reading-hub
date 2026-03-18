import { useCallback, useMemo } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import type {
    AppSettings,
    Book,
    BookAttachment,
    BookFormat,
    Bookmark,
    Note,
} from "@/types/book";
import type { AppDispatch, RootState } from "@/store/appStore";
import { bookActions } from "@/store/bookSlice";
import {
    commandSearchRequested,
    createBookRequested,
    createNoteRequested,
    deleteBookRequested,
    deleteNoteRequested,
    librarySearchRequested,
    updateBookRequested,
    updateNoteRequested,
    updateSettingsRequested,
} from "@/store/bookSagaActions";

const todayISO = () => new Date().toISOString().split("T")[0];

export interface BookStore {
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
    searchLibrary: (params: {
        query: string;
        filter: "all" | "favorites" | BookFormat;
        groupFilter: string;
        page: number;
        pageSize: number;
    }) => void;
    searchCommandBooks: (query: string, limit?: number) => void;
    clearCommandSearch: () => void;
    notesForBook: (bookId: string) => Note[];
    getLastReadBook: () => Book | null;
}

export function useBooks(): BookStore {
    const dispatch = useDispatch<AppDispatch>();
    const reduxStore = useStore();
    const state = useSelector((root: RootState) => root.book);

    const books = state.books;
    const notes = state.notes;
    const library = state.library;
    const commandSearch = state.commandSearch;
    const activeBook = useMemo(
        () => books.find((book) => book.id === state.activeBookId) ?? null,
        [books, state.activeBookId],
    );
    const activeNote = useMemo(
        () => notes.find((note) => note.id === state.activeNoteId) ?? null,
        [notes, state.activeNoteId],
    );

    const addBook = useCallback(
        (data: Omit<Book, "id" | "createdAt" | "updatedAt">) => {
            const now = new Date().toISOString();
            const book: Book = {
                ...data,
                id: crypto.randomUUID(),
                attachments: data.attachments ?? [],
                createdAt: now,
                updatedAt: now,
            };

            dispatch(bookActions.addBookLocal(book));
            dispatch(createBookRequested(book));
            return book;
        },
        [dispatch],
    );

    const updateBook = useCallback(
        (id: string, patch: Partial<Book>) => {
            dispatch(bookActions.updateBookLocal({ id, patch }));
            dispatch(updateBookRequested({ id, patch }));
        },
        [dispatch],
    );

    const deleteBook = useCallback(
        (id: string) => {
            dispatch(bookActions.deleteBookLocal(id));
            dispatch(deleteBookRequested(id));
        },
        [dispatch],
    );

    const openBook = useCallback(
        (id: string) => {
            const latestState = reduxStore.getState() as RootState;
            const book =
                latestState.book.books.find((item) => item.id === id) ??
                books.find((item) => item.id === id);
            if (!book) return;

            const today = todayISO();
            const readingDates = book.readingDates.includes(today)
                ? book.readingDates
                : [...book.readingDates, today];
            const patch: Partial<Book> = {
                readingDates,
                lastOpenedAt: new Date().toISOString(),
            };

            dispatch(bookActions.setActiveBookId(id));
            dispatch(bookActions.updateBookLocal({ id, patch }));
            dispatch(updateBookRequested({ id, patch }));

            if (book.audioUrl) {
                dispatch(bookActions.setAudioUrl(book.audioUrl));
            }
        },
        [books, dispatch, reduxStore],
    );

    const closeBook = useCallback(() => {
        dispatch(bookActions.setActiveBookId(null));
        dispatch(bookActions.setShowNotes(false));
    }, [dispatch]);

    const saveProgress = useCallback(
        (id: string, progress: number, currentPage?: number) => {
            const patch: Partial<Book> = {
                progress: Math.min(100, Math.max(0, progress)),
                ...(currentPage !== undefined ? { currentPage } : {}),
            };
            dispatch(bookActions.updateBookLocal({ id, patch }));
            dispatch(updateBookRequested({ id, patch }));
        },
        [dispatch],
    );

    const toggleFavorite = useCallback(
        (id: string) => {
            const book = books.find((item) => item.id === id);
            if (!book) return;
            const patch: Partial<Book> = {
                isFavorite: !book.isFavorite,
            };
            dispatch(bookActions.updateBookLocal({ id, patch }));
            dispatch(updateBookRequested({ id, patch }));
        },
        [books, dispatch],
    );

    const addBookmark = useCallback(
        (bookId: string, bm: Omit<Bookmark, "id" | "createdAt">) => {
            const book = books.find((item) => item.id === bookId);
            if (!book) return;
            const bookmark: Bookmark = {
                ...bm,
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
            };
            const patch: Partial<Book> = {
                bookmarks: [...book.bookmarks, bookmark],
            };
            dispatch(bookActions.updateBookLocal({ id: bookId, patch }));
            dispatch(updateBookRequested({ id: bookId, patch }));
        },
        [books, dispatch],
    );

    const removeBookmark = useCallback(
        (bookId: string, bmId: string) => {
            const book = books.find((item) => item.id === bookId);
            if (!book) return;
            const patch: Partial<Book> = {
                bookmarks: book.bookmarks.filter((bookmark) => bookmark.id !== bmId),
            };
            dispatch(bookActions.updateBookLocal({ id: bookId, patch }));
            dispatch(updateBookRequested({ id: bookId, patch }));
        },
        [books, dispatch],
    );

    const addAttachment = useCallback(
        (
            bookId: string,
            attachmentData: Omit<BookAttachment, "id" | "createdAt">,
        ) => {
            const book = books.find((item) => item.id === bookId);
            if (!book) return;
            const attachment: BookAttachment = {
                ...attachmentData,
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
            };
            const patch: Partial<Book> = {
                attachments: [...book.attachments, attachment],
            };
            dispatch(bookActions.updateBookLocal({ id: bookId, patch }));
            dispatch(updateBookRequested({ id: bookId, patch }));
        },
        [books, dispatch],
    );

    const removeAttachment = useCallback(
        (bookId: string, attachmentId: string) => {
            const book = books.find((item) => item.id === bookId);
            if (!book) return;
            const patch: Partial<Book> = {
                attachments: book.attachments.filter(
                    (attachment) => attachment.id !== attachmentId,
                ),
            };
            dispatch(bookActions.updateBookLocal({ id: bookId, patch }));
            dispatch(updateBookRequested({ id: bookId, patch }));
        },
        [books, dispatch],
    );

    const addNote = useCallback(
        (bookId: string, title: string) => {
            const now = new Date().toISOString();
            const note: Note = {
                id: crypto.randomUUID(),
                bookId,
                title,
                content: `# ${title}\n\n`,
                createdAt: now,
                updatedAt: now,
            };
            dispatch(bookActions.addNoteLocal(note));
            dispatch(createNoteRequested(note));
            return note;
        },
        [dispatch],
    );

    const updateNote = useCallback(
        (id: string, patch: Partial<Note>) => {
            dispatch(bookActions.updateNoteLocal({ id, patch }));
            dispatch(updateNoteRequested({ id, patch }));
        },
        [dispatch],
    );

    const deleteNote = useCallback(
        (id: string) => {
            dispatch(bookActions.deleteNoteLocal(id));
            dispatch(deleteNoteRequested(id));
        },
        [dispatch],
    );

    const openNote = useCallback(
        (id: string) => {
            const note = notes.find((item) => item.id === id);
            if (!note) return;
            dispatch(bookActions.setActiveNoteId(id));
            dispatch(bookActions.setShowNotes(true));
            openBook(note.bookId);
        },
        [dispatch, notes, openBook],
    );

    const setShowNotes = useCallback(
        (v: boolean) => dispatch(bookActions.setShowNotes(v)),
        [dispatch],
    );
    const setCommandOpen = useCallback(
        (v: boolean) => dispatch(bookActions.setCommandOpen(v)),
        [dispatch],
    );
    const setSettingsOpen = useCallback(
        (v: boolean) => dispatch(bookActions.setSettingsOpen(v)),
        [dispatch],
    );
    const setAddBookOpen = useCallback(
        (v: boolean) => dispatch(bookActions.setAddBookOpen(v)),
        [dispatch],
    );
    const setShortcutsOpen = useCallback(
        (v: boolean) => dispatch(bookActions.setShortcutsOpen(v)),
        [dispatch],
    );
    const setAudioUrl = useCallback(
        (url: string | null) => dispatch(bookActions.setAudioUrl(url)),
        [dispatch],
    );
    const setPlaying = useCallback(
        (v: boolean) => dispatch(bookActions.setPlaying(v)),
        [dispatch],
    );

    const updateSettings = useCallback(
        (patch: Partial<AppSettings>) => {
            const nextSettings: AppSettings = { ...state.settings, ...patch };
            dispatch(bookActions.updateSettingsLocal(patch));
            dispatch(updateSettingsRequested(nextSettings));
        },
        [dispatch, state.settings],
    );

    const searchLibrary = useCallback(
        (params: {
            query: string;
            filter: "all" | "favorites" | BookFormat;
            groupFilter: string;
            page: number;
            pageSize: number;
        }) => {
            dispatch(librarySearchRequested(params));
        },
        [dispatch],
    );

    const searchCommandBooks = useCallback(
        (query: string, limit = 12) => {
            dispatch(commandSearchRequested({ query, limit }));
        },
        [dispatch],
    );

    const clearCommandSearch = useCallback(
        () => dispatch(bookActions.clearCommandSearch()),
        [dispatch],
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

    return {
        books,
        notes,
        activeBook,
        activeNote,
        showNotes: state.showNotes,
        isCommandOpen: state.isCommandOpen,
        isSettingsOpen: state.isSettingsOpen,
        isAddBookOpen: state.isAddBookOpen,
        isShortcutsOpen: state.isShortcutsOpen,
        audioUrl: state.audioUrl,
        isPlaying: state.isPlaying,
        settings: state.settings,
        library,
        commandSearch,
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
        searchLibrary,
        searchCommandBooks,
        clearCommandSearch,
        notesForBook,
        getLastReadBook,
    };
}
