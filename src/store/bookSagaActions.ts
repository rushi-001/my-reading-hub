import { createAction } from "@reduxjs/toolkit";
import type { AppSettings, Book, BookFormat, BookUploadFiles, Note } from "@/types/book";

export const bootstrapRequested = createAction("bookSaga/bootstrapRequested");

export const createBookRequested = createAction<{
    book: Book;
    uploads?: BookUploadFiles;
}>("bookSaga/createBookRequested");

export const updateBookRequested = createAction<{
    id: string;
    patch: Partial<Book>;
    uploads?: BookUploadFiles;
}>("bookSaga/updateBookRequested");

export const deleteBookRequested = createAction<string>(
    "bookSaga/deleteBookRequested",
);

export const addAttachmentRequested = createAction<{
    bookId: string;
    file: File;
}>("bookSaga/addAttachmentRequested");

export const removeAttachmentRequested = createAction<{
    bookId: string;
    attachmentId: string;
}>("bookSaga/removeAttachmentRequested");

export const createNoteRequested = createAction<Note>(
    "bookSaga/createNoteRequested",
);

export const updateNoteRequested = createAction<{
    id: string;
    patch: Partial<Note>;
}>("bookSaga/updateNoteRequested");

export const deleteNoteRequested = createAction<string>(
    "bookSaga/deleteNoteRequested",
);

export const updateSettingsRequested = createAction<AppSettings>(
    "bookSaga/updateSettingsRequested",
);

export interface LibrarySearchRequestedPayload {
    query: string;
    filter: "all" | "favorites" | BookFormat;
    groupFilter: string;
    page: number;
    pageSize: number;
}

export const librarySearchRequested = createAction<LibrarySearchRequestedPayload>(
    "bookSaga/librarySearchRequested",
);

export interface CommandSearchRequestedPayload {
    query: string;
    limit: number;
}

export const commandSearchRequested = createAction<CommandSearchRequestedPayload>(
    "bookSaga/commandSearchRequested",
);
