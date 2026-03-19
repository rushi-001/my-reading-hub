import {
    all,
    call,
    put,
    takeEvery,
    takeLatest,
    type SagaReturnType,
} from "redux-saga/effects";
import {
    createBookApi,
    createNoteApi,
    deleteBookAttachmentApi,
    deleteBookApi,
    deleteNoteApi,
    fetchBookByIdApi,
    fetchBooksApi,
    fetchNotesApi,
    fetchSettingsApi,
    searchBooksApi,
    uploadBookAttachmentApi,
    updateBookApi,
    updateNoteApi,
    updateSettingsApi,
} from "@/store/api";
import type { Book } from "@/types/book";
import { bookActions } from "@/store/bookSlice";
import {
    addAttachmentRequested,
    bootstrapRequested,
    commandSearchRequested,
    createBookRequested,
    createNoteRequested,
    deleteBookRequested,
    deleteNoteRequested,
    librarySearchRequested,
    removeAttachmentRequested,
    updateBookRequested,
    updateNoteRequested,
    updateSettingsRequested,
} from "@/store/bookSagaActions";

function isCompleteBookPayload(book: unknown): book is Book {
    if (!book || typeof book !== "object") return false;
    const candidate = book as Partial<Book>;
    return (
        typeof candidate.id === "string" &&
        typeof candidate.title === "string" &&
        typeof candidate.author === "string" &&
        typeof candidate.format === "string" &&
        Array.isArray(candidate.tags) &&
        Array.isArray(candidate.readingDates) &&
        Array.isArray(candidate.bookmarks) &&
        Array.isArray(candidate.attachments)
    );
}

function* revalidateBookWorker(bookId: string) {
    try {
        const result: SagaReturnType<typeof fetchBookByIdApi> = yield call(
            fetchBookByIdApi,
            bookId,
        );
        if (result?.book) {
            yield put(bookActions.mergeBookFromApi(result.book));
        }
    } catch {
        // Keep optimistic local state when revalidation endpoint is unavailable.
    }
}

function* bootstrapWorker() {
    try {
        yield put(bookActions.setApiSyncing(true));
        yield put(bookActions.setApiError(null));

        const [bookResult, noteResult, settingsResult]: [
            SagaReturnType<typeof fetchBooksApi>,
            SagaReturnType<typeof fetchNotesApi>,
            SagaReturnType<typeof fetchSettingsApi>,
        ] = yield all([
            call(fetchBooksApi),
            call(fetchNotesApi),
            call(fetchSettingsApi),
        ]);

        if (bookResult?.books) {
            yield put(bookActions.setBooks(bookResult.books));
        }
        if (noteResult?.notes) {
            yield put(bookActions.setNotes(noteResult.notes));
        }
        if (settingsResult?.settings) {
            yield put(bookActions.setSettings(settingsResult.settings));
        }
    } catch (error) {
        // Keep local state as source of truth when API is unavailable.
        yield put(
            bookActions.setApiError(
                error instanceof Error ? error.message : "Failed to bootstrap API",
            ),
        );
    } finally {
        yield put(bookActions.setApiSyncing(false));
    }
}

function* createBookWorker(action: ReturnType<typeof createBookRequested>) {
    try {
        const result: SagaReturnType<typeof createBookApi> = yield call(
            createBookApi,
            action.payload.book,
            action.payload.uploads,
        );

        if (isCompleteBookPayload(result?.book)) {
            yield put(bookActions.mergeBookFromApi(result.book));
            return;
        }

        const hasFileUploads = Boolean(
            action.payload.uploads?.coverFile || action.payload.uploads?.contentFile,
        );

        // Only revalidate with GET for file-related mutations.
        if (hasFileUploads) {
            if (result?.book?.id) {
                yield call(revalidateBookWorker, result.book.id);
                return;
            }
            yield call(revalidateBookWorker, action.payload.book.id);
        }
    } catch (error) {
        yield put(
            bookActions.setApiError(
                error instanceof Error ? error.message : "Create book API failed",
            ),
        );
    }
}

function* updateBookWorker(action: ReturnType<typeof updateBookRequested>) {
    try {
        const result: SagaReturnType<typeof updateBookApi> = yield call(
            updateBookApi,
            action.payload.id,
            action.payload.patch,
            action.payload.uploads,
        );

        if (isCompleteBookPayload(result?.book)) {
            yield put(bookActions.mergeBookFromApi(result.book));
            return;
        }

        const hasFileUploads = Boolean(
            action.payload.uploads?.coverFile || action.payload.uploads?.contentFile,
        );

        // Text/metadata updates rely on optimistic local state and avoid heavy GET.
        if (hasFileUploads) {
            yield call(revalidateBookWorker, action.payload.id);
        }
    } catch (error) {
        yield put(
            bookActions.setApiError(
                error instanceof Error ? error.message : "Update book API failed",
            ),
        );
    }
}

function* addAttachmentWorker(
    action: ReturnType<typeof addAttachmentRequested>,
) {
    try {
        const result: SagaReturnType<typeof uploadBookAttachmentApi> = yield call(
            uploadBookAttachmentApi,
            action.payload.bookId,
            action.payload.file,
        );
        if (isCompleteBookPayload(result?.book)) {
            yield put(bookActions.mergeBookFromApi(result.book));
            return;
        }
        yield call(revalidateBookWorker, action.payload.bookId);
    } catch (error) {
        yield put(
            bookActions.setApiError(
                error instanceof Error ? error.message : "Attachment upload failed",
            ),
        );
    }
}

function* removeAttachmentWorker(
    action: ReturnType<typeof removeAttachmentRequested>,
) {
    try {
        const result: SagaReturnType<typeof deleteBookAttachmentApi> = yield call(
            deleteBookAttachmentApi,
            action.payload.bookId,
            action.payload.attachmentId,
        );
        if (isCompleteBookPayload(result?.book)) {
            yield put(bookActions.mergeBookFromApi(result.book));
            return;
        }
        yield call(revalidateBookWorker, action.payload.bookId);
    } catch (error) {
        yield put(
            bookActions.setApiError(
                error instanceof Error ? error.message : "Attachment delete failed",
            ),
        );
    }
}

function* deleteBookWorker(action: ReturnType<typeof deleteBookRequested>) {
    try {
        yield call(deleteBookApi, action.payload);
    } catch (error) {
        yield put(
            bookActions.setApiError(
                error instanceof Error ? error.message : "Delete book API failed",
            ),
        );
    }
}

function* createNoteWorker(action: ReturnType<typeof createNoteRequested>) {
    try {
        const result: SagaReturnType<typeof createNoteApi> = yield call(
            createNoteApi,
            action.payload,
        );
        if (result?.note) {
            yield put(bookActions.mergeNoteFromApi(result.note));
        }
    } catch (error) {
        yield put(
            bookActions.setApiError(
                error instanceof Error ? error.message : "Create note API failed",
            ),
        );
    }
}

function* updateNoteWorker(action: ReturnType<typeof updateNoteRequested>) {
    try {
        const result: SagaReturnType<typeof updateNoteApi> = yield call(
            updateNoteApi,
            action.payload.id,
            action.payload.patch,
        );
        if (result?.note) {
            yield put(bookActions.mergeNoteFromApi(result.note));
        }
    } catch (error) {
        yield put(
            bookActions.setApiError(
                error instanceof Error ? error.message : "Update note API failed",
            ),
        );
    }
}

function* deleteNoteWorker(action: ReturnType<typeof deleteNoteRequested>) {
    try {
        yield call(deleteNoteApi, action.payload);
    } catch (error) {
        yield put(
            bookActions.setApiError(
                error instanceof Error ? error.message : "Delete note API failed",
            ),
        );
    }
}

function* updateSettingsWorker(
    action: ReturnType<typeof updateSettingsRequested>,
) {
    try {
        const result: SagaReturnType<typeof updateSettingsApi> = yield call(
            updateSettingsApi,
            action.payload,
        );
        if (result?.settings) {
            yield put(bookActions.setSettings(result.settings));
        }
    } catch (error) {
        yield put(
            bookActions.setApiError(
                error instanceof Error ? error.message : "Update settings API failed",
            ),
        );
    }
}

function* librarySearchWorker(
    action: ReturnType<typeof librarySearchRequested>,
) {
    const { query, filter, groupFilter, page, pageSize } = action.payload;
    try {
        yield put(bookActions.setLibraryLoading(true));
        yield put(bookActions.setApiError(null));

        const result: SagaReturnType<typeof searchBooksApi> = yield call(
            searchBooksApi,
            {
                query: query.trim() || undefined,
                format:
                    filter === "all" || filter === "favorites"
                        ? undefined
                        : filter,
                favoritesOnly: filter === "favorites" ? true : undefined,
                groupId:
                    groupFilter && groupFilter !== "all"
                        ? groupFilter
                        : undefined,
                page,
                pageSize,
            },
        );

        yield put(
            bookActions.setLibraryResults({
                items: result.items ?? [],
                query,
                filter,
                groupFilter,
                page: result.pagination?.page ?? page,
                pageSize: result.pagination?.pageSize ?? pageSize,
                totalItems: result.pagination?.totalItems ?? 0,
                totalPages: Math.max(result.pagination?.totalPages ?? 1, 1),
                hasNextPage: Boolean(result.pagination?.hasNextPage),
                hasPrevPage: Boolean(result.pagination?.hasPrevPage),
            }),
        );
    } catch (error) {
        yield put(
            bookActions.setApiError(
                error instanceof Error ? error.message : "Library search API failed",
            ),
        );
    } finally {
        yield put(bookActions.setLibraryLoading(false));
    }
}

function* commandSearchWorker(
    action: ReturnType<typeof commandSearchRequested>,
) {
    const query = action.payload.query.trim();
    if (!query) {
        yield put(bookActions.clearCommandSearch());
        return;
    }

    try {
        yield put(bookActions.setCommandSearchLoading(true));
        yield put(bookActions.setApiError(null));
        yield put(
            bookActions.setCommandSearchResults({
                query,
                items: [],
                totalItems: 0,
            }),
        );

        const result: SagaReturnType<typeof searchBooksApi> = yield call(
            searchBooksApi,
            {
                query,
                page: 1,
                pageSize: Math.max(1, action.payload.limit),
            },
        );

        yield put(
            bookActions.setCommandSearchResults({
                query,
                items: result.items ?? [],
                totalItems: result.pagination?.totalItems ?? result.items?.length ?? 0,
            }),
        );
    } catch (error) {
        yield put(
            bookActions.setApiError(
                error instanceof Error ? error.message : "Command search API failed",
            ),
        );
    } finally {
        yield put(bookActions.setCommandSearchLoading(false));
    }
}

export function* bookRootSaga() {
    yield all([
        takeLatest(bootstrapRequested.type, bootstrapWorker),
        takeLatest(librarySearchRequested.type, librarySearchWorker),
        takeLatest(commandSearchRequested.type, commandSearchWorker),
        takeEvery(createBookRequested.type, createBookWorker),
        takeEvery(updateBookRequested.type, updateBookWorker),
        takeEvery(deleteBookRequested.type, deleteBookWorker),
        takeEvery(addAttachmentRequested.type, addAttachmentWorker),
        takeEvery(removeAttachmentRequested.type, removeAttachmentWorker),
        takeEvery(createNoteRequested.type, createNoteWorker),
        takeEvery(updateNoteRequested.type, updateNoteWorker),
        takeEvery(deleteNoteRequested.type, deleteNoteWorker),
        takeEvery(updateSettingsRequested.type, updateSettingsWorker),
    ]);
}
