import type { Note } from "@/types/book";
import { apiClient } from "@/store/api/client";

export interface FetchNotesResponse {
    notes: Note[];
}

export interface UpsertNoteResponse {
    note: Note;
}

export interface DeleteNoteResponse {
    success: boolean;
    deletedId?: string;
}

// Expected response example:
// {
//   "notes": [
//     {
//       "id": "note-uuid",
//       "bookId": "book-uuid",
//       "title": "Note 1",
//       "content": "# Note 1",
//       "createdAt": "2026-03-18T10:20:00.000Z",
//       "updatedAt": "2026-03-18T10:20:00.000Z"
//     }
//   ]
// }
export async function fetchNotesApi(): Promise<FetchNotesResponse> {
    const { data } = await apiClient.get<FetchNotesResponse>("/api/notes");
    return data;
}

// Expected response example:
// {
//   "note": {
//     "id": "note-uuid",
//     "bookId": "book-uuid",
//     "title": "Chapter 2 summary",
//     "content": "# Chapter 2 summary\n\n- Main idea",
//     "createdAt": "2026-03-18T10:20:00.000Z",
//     "updatedAt": "2026-03-18T10:20:00.000Z"
//   }
// }
export async function createNoteApi(note: Note): Promise<UpsertNoteResponse> {
    const { data } = await apiClient.post<UpsertNoteResponse>("/api/notes", note);
    return data;
}

// Expected response example:
// {
//   "note": {
//     "id": "note-uuid",
//     "bookId": "book-uuid",
//     "title": "Chapter 2 summary",
//     "content": "# Chapter 2 summary\n\n- Main idea\n- Updated insight",
//     "createdAt": "2026-03-18T10:20:00.000Z",
//     "updatedAt": "2026-03-19T08:00:00.000Z"
//   }
// }
export async function updateNoteApi(
    id: string,
    patch: Partial<Note>,
): Promise<UpsertNoteResponse> {
    const { data } = await apiClient.patch<UpsertNoteResponse>(
        `/api/notes/${id}`,
        patch,
    );
    return data;
}

// Expected response example:
// {
//   "success": true,
//   "deletedId": "note-uuid"
// }
export async function deleteNoteApi(id: string): Promise<DeleteNoteResponse> {
    const { data } = await apiClient.delete<DeleteNoteResponse>(`/api/notes/${id}`);
    return data;
}
