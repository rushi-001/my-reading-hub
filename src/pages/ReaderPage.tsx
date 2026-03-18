import { BookReaderView } from "@/components/BookReaderView";
import { useBooks } from "@/store/bookStore";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function ReaderPage() {
    const { bookId } = useParams<{ bookId: string }>();
    const { books, activeBook, openBook } = useBooks();
    const navigate = useNavigate();

    useEffect(() => {
        if (!bookId) {
            navigate("/library", { replace: true });
            return;
        }
        if (activeBook?.id !== bookId) {
            openBook(bookId);
        }
    }, [activeBook?.id, bookId, navigate, openBook]);

    const exists = !!bookId && books.some((book) => book.id === bookId);
    if (!exists) {
        return (
            <div className="flex h-full items-center justify-center text-center px-6">
                <div className="space-y-3">
                    <p className="text-[12px] text-muted-foreground">
                        This book does not exist or was deleted.
                    </p>
                    <button
                        onClick={() => navigate("/library")}
                        className="border border-muted px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
                    >
                        Back to Library
                    </button>
                </div>
            </div>
        );
    }

    if (!activeBook || activeBook.id !== bookId) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-[12px] text-muted-foreground">Loading reader...</p>
            </div>
        );
    }

    return <BookReaderView />;
}
