export type BookFormat = "pdf" | "epub" | "audio" | "video" | "podcast" | "url";

export interface BookAttachment {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    url: string; // Backend-served URL for attachment preview/download.
    createdAt: string;
}

export interface BookUploadFiles {
    coverFile?: File | null;
    contentFile?: File | null;
}

export interface Book {
    id: string;
    title: string;
    author: string;
    description: string;
    cover: string | null; // backend-served URL
    format: BookFormat;
    fileUrl: string | null; // backend-served URL for PDF / EPUB
    audioUrl: string | null; // YouTube / audio / video / podcast URL
    rating: number; // 0-5
    progress: number; // 0-100
    currentPage: number;
    totalPages: number;
    tags: string[];
    groupId: string | null; // book group/stack
    isFavorite: boolean;
    readingDates: string[]; // ISO date strings (YYYY-MM-DD) when user read this
    bookmarks: Bookmark[]; // word/line bookmarks
    attachments: BookAttachment[];
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
    commandPalettePosition:
        | "top-left"
        | "top-center"
        | "top-right"
        | "center-left"
        | "center-center"
        | "center-right"
        | "bottom-left"
        | "bottom-center"
        | "bottom-right";
    stackGroups: boolean; // show books as stacked groups
    stackMaxVisible: number; // 2-5
    autoScrollSpeed: number; // 0 = off, 1-5
    sidebarVisible: boolean;
    showCalendarHeatmap: boolean;
}

export type AppView = "library" | "reader" | "notes" | "calendar";
