import type { Book, BookFormat, BookUploadFiles } from "@/types/book";
import { apiClient } from "@/store/api/client";

export interface FetchBooksResponse {
    books: Book[];
}

export interface FetchBookResponse {
    book: Book;
}

export interface UpsertBookResponse {
    book?: Partial<Book> & { id: string };
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

function sanitizeCreateBookPayload(book: Book): Book {
    return {
        ...book,
        cover: null,
        fileUrl: null,
        attachments: [],
    };
}

function sanitizeUpdateBookPayload(patch: Partial<Book>): Partial<Book> {
    const nextPatch: Partial<Book> = { ...patch };

    // String URLs in client patch are local previews. Files must go in multipart parts.
    if (typeof nextPatch.cover === "string") delete nextPatch.cover;
    if (typeof nextPatch.fileUrl === "string") delete nextPatch.fileUrl;

    // Attachments are handled by dedicated upload/delete endpoints.
    delete nextPatch.attachments;

    return nextPatch;
}

function buildBookMultipart(
    payloadField: "book" | "patch",
    payload: Book | Partial<Book>,
    uploads?: BookUploadFiles,
): FormData {
    const formData = new FormData();
    formData.append(payloadField, JSON.stringify(payload));

    if (uploads?.coverFile) {
        formData.append("cover", uploads.coverFile);
    }

    if (uploads?.contentFile) {
        formData.append("contentFile", uploads.contentFile);
    }

    return formData;
}

// Expected request:
// - method: GET
// - path: /api/books
// - body: none
//
// Expected response example:
// {
//   "books": [
//     {
//       "id": "book-uuid",
//       "title": "Deep Work",
//       "author": "Cal Newport",
//       "description": "Book summary",
//       "cover": "https://cdn.example.com/books/book-uuid/cover.webp",
//       "format": "pdf",
//       "fileUrl": "https://cdn.example.com/books/book-uuid/content.pdf",
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
//       "attachments": [
//         {
//           "id": "attachment-1",
//           "name": "world-map.png",
//           "mimeType": "image/png",
//           "size": 480120,
//           "url": "https://cdn.example.com/books/book-uuid/attachments/world-map.png",
//           "createdAt": "2026-03-18T10:20:00.000Z"
//         }
//       ],
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

// Expected request:
// - method: GET
// - path: /api/books/:id
// - path param: id (string, required)
// - body: none
//
// Expected response example:
// {
//   "book": {
//     "id": "book-uuid",
//     "title": "Deep Work",
//     "author": "Cal Newport",
//     "description": "Book summary",
//     "cover": "https://cdn.example.com/books/book-uuid/cover.webp",
//     "format": "pdf",
//     "fileUrl": "https://cdn.example.com/books/book-uuid/content.pdf",
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
export async function fetchBookByIdApi(id: string): Promise<FetchBookResponse> {
    const { data } = await apiClient.get<FetchBookResponse>(`/api/books/${id}`);
    return data;
}

// Expected request (multipart/form-data):
// - method: POST
// - path: /api/books
// - form-data key: book (stringified JSON)
//   {
//     "id": "book-uuid",
//     "title": "Deep Work",
//     "author": "Cal Newport",
//     "description": "Book summary",
//     "format": "pdf",
//     "audioUrl": null,
//     "rating": 4,
//     "progress": 35,
//     "currentPage": 80,
//     "totalPages": 320,
//     "tags": ["focus", "productivity"],
//     "groupId": "Work",
//     "isFavorite": false,
//     "readingDates": ["2026-03-18"],
//     "bookmarks": [],
//     "attachments": [],
//     "createdAt": "2026-03-18T10:20:00.000Z",
//     "updatedAt": "2026-03-18T10:20:00.000Z",
//     "lastOpenedAt": null,
//     "cover": null,
//     "fileUrl": null
//   }
// - form-data key: cover (file, optional image/*)
// - form-data key: contentFile (file, optional .pdf/.epub)
//
// Expected response example:
// {
//   "book": {
//     "id": "book-uuid",
//     "title": "Deep Work",
//     "author": "Cal Newport",
//     "description": "Book summary",
//     "cover": "https://cdn.example.com/books/book-uuid/cover.webp",
//     "format": "pdf",
//     "fileUrl": "https://cdn.example.com/books/book-uuid/content.pdf",
//     "audioUrl": null,
//     "rating": 4,
//     "progress": 35,
//     "currentPage": 80,
//     "totalPages": 320,
//     "tags": ["focus", "productivity"],
//     "groupId": "Work",
//     "isFavorite": false,
//     "readingDates": ["2026-03-18"],
//     "bookmarks": [],
//     "attachments": [],
//     "createdAt": "2026-03-18T10:20:00.000Z",
//     "updatedAt": "2026-03-18T10:20:00.000Z",
//     "lastOpenedAt": null
//   }
// }
export async function createBookApi(
    book: Book,
    uploads?: BookUploadFiles,
): Promise<UpsertBookResponse> {
    const formData = buildBookMultipart(
        "book",
        sanitizeCreateBookPayload(book),
        uploads,
    );

    const { data } = await apiClient.post<UpsertBookResponse>("/api/books", formData);
    return data;
}

// Expected request (multipart/form-data):
// - method: PATCH
// - path: /api/books/:id
// - path param: id (string, required)
// - form-data key: patch (stringified JSON partial Book)
//   {
//     "title": "Deep Work (Updated)",
//     "description": "Updated summary",
//     "format": "pdf",
//     "audioUrl": null,
//     "rating": 5,
//     "groupId": "Work",
//     "tags": ["focus", "productivity"]
//   }
// - form-data key: cover (file, optional image/*)
// - form-data key: contentFile (file, optional .pdf/.epub)
//
// Expected response example:
// {
//   "book": {
//     "id": "book-uuid",
//     "title": "Deep Work",
//     "author": "Cal Newport",
//     "description": "Book summary",
//     "cover": "https://cdn.example.com/books/book-uuid/cover.webp",
//     "format": "pdf",
//     "fileUrl": "https://cdn.example.com/books/book-uuid/content.pdf",
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
    uploads?: BookUploadFiles,
): Promise<UpsertBookResponse> {
    const formData = buildBookMultipart(
        "patch",
        sanitizeUpdateBookPayload(patch),
        uploads,
    );

    const { data } = await apiClient.patch<UpsertBookResponse>(
        `/api/books/${id}`,
        formData,
    );

    return data;
}

// Expected request (multipart/form-data):
// - method: POST
// - path: /api/books/:bookId/attachments
// - path param: bookId (string, required)
// - form-data key: attachment (file, required)
//
// Expected response example:
// {
//   "book": {
//     "id": "book-uuid",
//     "attachments": [
//       {
//         "id": "attachment-1",
//         "name": "world-map.png",
//         "mimeType": "image/png",
//         "size": 480120,
//         "url": "https://cdn.example.com/books/book-uuid/attachments/world-map.png",
//         "createdAt": "2026-03-19T08:20:00.000Z"
//       }
//     ]
//   }
// }
export async function uploadBookAttachmentApi(
    bookId: string,
    file: File,
): Promise<UpsertBookResponse> {
    const formData = new FormData();
    formData.append("attachment", file);

    const { data } = await apiClient.post<UpsertBookResponse>(
        `/api/books/${bookId}/attachments`,
        formData,
    );

    return data;
}

// Expected request:
// - method: DELETE
// - path: /api/books/:bookId/attachments/:attachmentId
// - path param: bookId (string, required)
// - path param: attachmentId (string, required)
// - body: none
//
// Expected response example:
// {
//   "book": {
//     "id": "book-uuid",
//     "attachments": []
//   }
// }
export async function deleteBookAttachmentApi(
    bookId: string,
    attachmentId: string,
): Promise<UpsertBookResponse> {
    const { data } = await apiClient.delete<UpsertBookResponse>(
        `/api/books/${bookId}/attachments/${attachmentId}`,
    );

    return data;
}

// Expected request:
// - method: DELETE
// - path: /api/books/:id
// - path param: id (string, required)
// - body: none
//
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

// Expected request:
// - method: GET
// - path: /api/books/search
// - query params (all optional):
//   {
//     "query": "focus",
//     "format": "pdf",
//     "favoritesOnly": false,
//     "groupId": "Work",
//     "page": 1,
//     "pageSize": 24
//   }
// - body: none
//
// Expected response example:
// {
//   "items": [
//     {
//       "id": "book-uuid",
//       "title": "Deep Work",
//       "author": "Cal Newport",
//       "description": "Book summary",
//       "cover": "https://cdn.example.com/books/book-uuid/cover.webp",
//       "format": "pdf",
//       "fileUrl": "https://cdn.example.com/books/book-uuid/content.pdf",
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
//       "attachments": [
//         {
//           "id": "attachment-1",
//           "name": "world-map.png",
//           "mimeType": "image/png",
//           "size": 480120,
//           "url": "https://cdn.example.com/books/book-uuid/attachments/world-map.png",
//           "createdAt": "2026-03-18T10:20:00.000Z"
//         }
//       ],
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
