import { useCallback, useRef } from "react";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import { useBooks } from "@/store/bookStore";

interface Props {
    fileUrl: string;
    bookId: string;
    initialPage?: number;
}

export function PDFReader({ fileUrl, bookId, initialPage = 0 }: Props) {
    const { saveProgress, books } = useBooks();
    const book = books.find((b) => b.id === bookId);
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const defaultLayout = defaultLayoutPlugin();

    const handlePageChange = useCallback(
        (e: { currentPage: number }) => {
            const page = e.currentPage + 1;
            if (saveTimer.current) clearTimeout(saveTimer.current);
            saveTimer.current = setTimeout(() => {
                if (book && book.totalPages > 0) {
                    saveProgress(
                        bookId,
                        Math.round((page / book.totalPages) * 100),
                        page,
                    );
                } else {
                    saveProgress(bookId, 0, page);
                }
            }, 1000);
        },
        [bookId, book, saveProgress],
    );

    return (
        <div className="flex-1 h-full overflow-hidden pdf-dark-canvas bg-background">
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                <Viewer
                    fileUrl={fileUrl}
                    plugins={[defaultLayout]}
                    initialPage={initialPage}
                    onPageChange={handlePageChange}
                    theme={{ theme: "dark" }}
                />
            </Worker>
        </div>
    );
}
