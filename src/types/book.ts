export type BookFormat = "pdf" | "epub" | "audio" | "video" | "podcast" | "url";

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  cover: string | null;        // base64 data URL or remote URL
  format: BookFormat;
  fileUrl: string | null;      // for PDF / EPUB — object URL or remote
  audioUrl: string | null;     // YouTube / audio / video / podcast URL
  rating: number;              // 0–5
  progress: number;            // 0–100
  currentPage: number;
  totalPages: number;
  tags: string[];
  createdAt: string;           // ISO
  updatedAt: string;
  lastOpenedAt: string | null;
}

export interface Note {
  id: string;
  bookId: string;
  title: string;
  content: string;             // Markdown
  createdAt: string;
  updatedAt: string;
}

export type AppView = "library" | "reader" | "notes";
