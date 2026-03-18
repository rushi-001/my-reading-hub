import type { Book, BookFormat } from "@/types/book";
import { apiClient } from "@/store/api/client";

export interface FetchBooksResponse {
    books: Book[];
}

export interface UpsertBookResponse {
    book: Book;
}

export interface DeleteBookResponse {
    success: boolean;
    deletedId?: string;
}

export interface SearchBooksQuery {
    query?: string;
    format?: BookFormat;
    favoritesOnly?: boolean;
    groupId?: string;
    page?: number;
    pageSize?: number;
}

export interface SearchBooksResponse {
    items: Book[];
    pagination: {
        page: number;
        pageSize: number;
        totalItems: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
    filters: {
        query: string;
        format: BookFormat | null;
        favoritesOnly: boolean;
        groupId: string | null;
    };
}

// Expected response example:
// {
//   "books": [
//     {
//       "id": "book-uuid",
//       "title": "Deep Work",
//       "author": "Cal Newport",
//       "description": "Book summary",
//       "cover": null,
//       "format": "pdf",
//       "fileUrl": null,
//       "audioUrl": null,
//       "rating": 4,
//       "progress": 35,
//       "currentPage": 80,
//       "totalPages": 320,
//       "tags": ["focus", "productivity"],
//       "groupId": "Work",
//       "isFavorite": false,
//       "readingDates": ["2026-03-18"],
//       "bookmarks": [],
//       "attachments": [],
//       "createdAt": "2026-03-18T10:20:00.000Z",
//       "updatedAt": "2026-03-18T10:20:00.000Z",
//       "lastOpenedAt": null
//     }
//   ]
// }
export async function fetchBooksApi(): Promise<FetchBooksResponse> {
    const { data } = await apiClient.get<FetchBooksResponse>("/api/books");
    return data;
}

// Expected response example:
// {
//   "book": {
//     "id": "book-uuid",
//     "title": "Deep Work",
//     "author": "Cal Newport",
//     "description": "Book summary",
//     "cover": null,
//     "format": "pdf",
//     "fileUrl": null,
//     "audioUrl": null,
//     "rating": 4,
//     "progress": 35,
//     "currentPage": 80,
//     "totalPages": 320,
//     "tags": ["focus", "productivity"],
//     "groupId": "Work",
//     "isFavorite": false,
//     "readingDates": ["2026-03-18"],
//     "bookmarks": [
//       {
//         "id": "bookmark-1",
//         "type": "line",
//         "page": 12,
//         "text": "Important sentence",
//         "note": "Revisit this later",
//         "createdAt": "2026-03-18T10:20:00.000Z"
//       }
//     ],
//     "attachments": [
//       {
//         "id": "attachment-1",
//         "name": "world-map.png",
//         "mimeType": "image/png",
//         "size": 480120,
//         "dataUrl": "data:image/png;base64,iVBORw0KGgoAAA...",
//         "createdAt": "2026-03-18T10:20:00.000Z"
//       }
//     ],
//     "createdAt": "2026-03-18T10:20:00.000Z",
//     "updatedAt": "2026-03-18T10:20:00.000Z",
//     "lastOpenedAt": null
//   }
// }
export async function createBookApi(book: Book): Promise<UpsertBookResponse> {
    const { data } = await apiClient.post<UpsertBookResponse>("/api/books", book);
    return data;
}

// Expected response example:
// {
//   "book": {
//     "id": "book-uuid",
//     "title": "Deep Work",
//     "author": "Cal Newport",
//     "description": "Book summary",
//     "cover": null,
//     "format": "pdf",
//     "fileUrl": null,
//     "audioUrl": null,
//     "rating": 4,
//     "progress": 40,
//     "currentPage": 96,
//     "totalPages": 320,
//     "tags": ["focus", "productivity"],
//     "groupId": "Work",
//     "isFavorite": true,
//     "readingDates": ["2026-03-18", "2026-03-19"],
//     "bookmarks": [],
//     "attachments": [],
//     "createdAt": "2026-03-18T10:20:00.000Z",
//     "updatedAt": "2026-03-19T08:00:00.000Z",
//     "lastOpenedAt": "2026-03-19T07:58:00.000Z"
//   }
// }
export async function updateBookApi(
    id: string,
    patch: Partial<Book>,
): Promise<UpsertBookResponse> {
    const { data } = await apiClient.patch<UpsertBookResponse>(
        `/api/books/${id}`,
        patch,
    );
    return data;
}

// Expected response example:
// {
//   "success": true,
//   "deletedId": "book-uuid"
// }
export async function deleteBookApi(id: string): Promise<DeleteBookResponse> {
    const { data } = await apiClient.delete<DeleteBookResponse>(`/api/books/${id}`);
    return data;
}

export async function searchBooksApi(
    query: SearchBooksQuery,
): Promise<SearchBooksResponse> {
    const { data } = await apiClient.get<SearchBooksResponse>("/api/books/search", {
        params: query,
    });
    return data;
}
// Expected response example:
// {
//   "items": [
//     {
//       "id": "book-uuid",
//       "title": "Deep Work",
//       "author": "Cal Newport",
//       "description": "Book summary",
//       "cover": null,
//       "format": "pdf",
//       "fileUrl": null,
//       "audioUrl": null,
//       "rating": 4,
//       "progress": 35,
//       "currentPage": 80,
//       "totalPages": 320,
//       "tags": ["focus", "productivity"],
//       "groupId": "Work",
//       "isFavorite": false,
//       "readingDates": ["2026-03-18"],
//       "bookmarks": [],
//       "attachments": [],
//       "createdAt": "2026-03-18T10:20:00.000Z",
//       "updatedAt": "2026-03-18T10:20:00.000Z",
//       "lastOpenedAt": null
//     }
//   ],
//   "pagination": {
//     "page": 1,
//     "pageSize": 24,
//     "totalItems": 128,
//     "totalPages": 6,
//     "hasNextPage": true,
//     "hasPrevPage": false
//   },
//   "filters": {
//     "query": "focus",
//     "format": null,
//     "favoritesOnly": false,
//     "groupId": null
//   }
// }
