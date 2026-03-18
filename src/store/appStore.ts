import { configureStore } from "@reduxjs/toolkit";
import createSagaMiddleware from "redux-saga";
import { bookReducer, BOOKS_KEY, NOTES_KEY, SETTINGS_KEY } from "@/store/bookSlice";
import { bookRootSaga } from "@/store/bookSaga";

const sagaMiddleware = createSagaMiddleware();

export const appStore = configureStore({
    reducer: {
        book: bookReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }).concat(sagaMiddleware),
});

sagaMiddleware.run(bookRootSaga);

if (typeof window !== "undefined") {
    let lastSerialized = "";
    appStore.subscribe(() => {
        const state = appStore.getState().book;
        const nextSerialized = JSON.stringify({
            books: state.books,
            notes: state.notes,
            settings: state.settings,
        });

        if (nextSerialized === lastSerialized) return;
        lastSerialized = nextSerialized;

        localStorage.setItem(BOOKS_KEY, JSON.stringify(state.books));
        localStorage.setItem(NOTES_KEY, JSON.stringify(state.notes));
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
    });
}

export type RootState = ReturnType<typeof appStore.getState>;
export type AppDispatch = typeof appStore.dispatch;
