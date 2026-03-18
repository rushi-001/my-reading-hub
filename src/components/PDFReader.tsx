import { useCallback, useEffect, useRef, useState } from "react";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import { useBooks } from "@/store/bookStore";

interface Props {
    fileUrl: string;
    bookId: string;
    initialPage?: number; // Viewer expects zero-based page index.
    targetPage?: number | null; // One-based page number used by bookmark UI.
    onJumpHandled?: () => void;
}

export function PDFReader({
    fileUrl,
    bookId,
    initialPage = 0,
    targetPage = null,
    onJumpHandled,
}: Props) {
    const { saveProgress, books, updateBook } = useBooks();
    const book = books.find((item) => item.id === bookId);

    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const totalPagesRef = useRef<number>(book?.totalPages || 0);
    const [viewerNonce, setViewerNonce] = useState(0);
    const defaultLayout = defaultLayoutPlugin();

    // Trigger a controlled remount to jump to selected bookmark pages.
    useEffect(() => {
        if (targetPage == null) return;
        setViewerNonce((value) => value + 1);
        onJumpHandled?.();
    }, [onJumpHandled, targetPage]);

    useEffect(() => {
        return () => {
            if (saveTimer.current) clearTimeout(saveTimer.current);
        };
    }, []);

    const handleDocumentLoad = useCallback(
        (event: { doc: { numPages: number } }) => {
            const totalPages = event.doc.numPages;
            totalPagesRef.current = totalPages;

            if (!book || book.totalPages !== totalPages) {
                updateBook(bookId, { totalPages });
            }

            if (book && totalPages > 0 && book.currentPage > 0) {
                const progress = Math.round((book.currentPage / totalPages) * 100);
                if (progress !== book.progress) {
                    updateBook(bookId, { progress: Math.min(100, Math.max(0, progress)) });
                }
            }
        },
        [book, bookId, updateBook],
    );

    const handlePageChange = useCallback(
        (event: { currentPage: number }) => {
            const oneBasedPage = event.currentPage + 1;
            if (saveTimer.current) clearTimeout(saveTimer.current);
            saveTimer.current = setTimeout(() => {
                const totalPages = totalPagesRef.current || book?.totalPages || 0;
                if (totalPages > 0) {
                    saveProgress(bookId, Math.round((oneBasedPage / totalPages) * 100), oneBasedPage);
                } else {
                    saveProgress(bookId, 0, oneBasedPage);
                }
            }, 350);
        },
        [book?.totalPages, bookId, saveProgress],
    );

    const viewerInitialPage =
        targetPage != null ? Math.max(0, targetPage - 1) : Math.max(0, initialPage);

    return (
        <div className="flex-1 h-full overflow-hidden pdf-dark-canvas bg-background">
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                <Viewer
                    key={`${fileUrl}-${viewerNonce}`}
                    fileUrl={fileUrl}
                    plugins={[defaultLayout]}
                    initialPage={viewerInitialPage}
                    onPageChange={handlePageChange}
                    onDocumentLoad={handleDocumentLoad}
                    theme={{ theme: "dark" }}
                />
            </Worker>
        </div>
    );
}
