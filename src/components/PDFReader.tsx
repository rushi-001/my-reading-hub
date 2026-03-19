import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
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

type PdfDisplayMode = "original" | "dark" | "sepia" | "sepia-invert";

const DISPLAY_MODE_OPTIONS: Array<{ mode: PdfDisplayMode; label: string }> = [
    { mode: "original", label: "Original" },
    { mode: "dark", label: "Dark" },
    { mode: "sepia", label: "Sepia" },
    { mode: "sepia-invert", label: "Sepia Invert" },
];

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
    const [displayMode, setDisplayMode] = useState<PdfDisplayMode>("dark");
    const [brightness, setBrightness] = useState(100);
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
    const displayModeClass =
        displayMode === "original"
            ? "pdf-mode-original"
            : displayMode === "dark"
                ? "pdf-mode-dark"
                : displayMode === "sepia"
                    ? "pdf-mode-sepia"
                    : "pdf-mode-sepia-invert";
    const filterStyle = {
        "--pdf-brightness": `${brightness}%`,
    } as CSSProperties;

    return (
        <div className="flex flex-col h-full overflow-hidden bg-background">
            <div className="shrink-0 border-b border-muted px-3 py-2 bg-surface-1 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 flex-wrap">
                    {DISPLAY_MODE_OPTIONS.map((option) => (
                        <button
                            key={option.mode}
                            type="button"
                            onClick={() => setDisplayMode(option.mode)}
                            className={`border px-2 py-1 text-[10px] transition-colors ${
                                displayMode === option.mode
                                    ? "border-terminal text-terminal"
                                    : "border-muted text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>

                <div className="ml-auto flex items-center gap-2 min-w-[180px]">
                    <span className="text-[10px] text-muted-foreground">Brightness</span>
                    <input
                        type="range"
                        min={60}
                        max={140}
                        value={brightness}
                        onChange={(event) => setBrightness(Number(event.target.value))}
                        className="w-28 accent-[hsl(var(--terminal-green))]"
                    />
                    <span className="text-[10px] text-muted-foreground tabular-nums w-9 text-right">
                        {brightness}%
                    </span>
                </div>
            </div>

            <div
                className={`flex-1 h-full overflow-hidden pdf-canvas-theme ${displayModeClass}`}
                style={filterStyle}
            >
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
        </div>
    );
}
