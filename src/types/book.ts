export type BookFormat = "pdf" | "epub" | "audio" | "video" | "podcast" | "url";

export interface Book {
    id: string;
    title: string;
    author: string;
    description: string;
    cover: string | null; // base64 data URL or remote URL
    format: BookFormat;
    fileUrl: string | null; // for PDF / EPUB — object URL or remote
    audioUrl: string | null; // YouTube / audio / video / podcast URL
    rating: number; // 0–5
    progress: number; // 0–100
    currentPage: number;
    totalPages: number;
    tags: string[];
    groupId: string | null; // book group/stack
    isFavorite: boolean;
    readingDates: string[]; // ISO date strings (YYYY-MM-DD) when user read this
    bookmarks: Bookmark[]; // word/line bookmarks
    createdAt: string; // ISO
    updatedAt: string;
    lastOpenedAt: string | null;
}

export interface Bookmark {
    id: string;
    type: "line" | "word";
    page: number;
    text: string;
    note?: string;
    createdAt: string;
}

export interface Note {
    id: string;
    bookId: string;
    title: string;
    content: string; // Markdown
    createdAt: string;
    updatedAt: string;
}

export interface AppSettings {
    showIcons: boolean; // command palette icons
    commandPalettePosition: "top" | "center";
    stackGroups: boolean; // show books as stacked groups
    stackMaxVisible: number; // 2-5
    autoScrollSpeed: number; // 0 = off, 1-5
    sidebarVisible: boolean;
}

export type AppView = "library" | "reader" | "notes" | "calendar";
