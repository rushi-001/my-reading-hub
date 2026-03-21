import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { SpecialZoomLevel, Worker, Viewer } from "@react-pdf-viewer/core";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { useIsMobile } from "@/hooks/use-mobile";
import { useBooks } from "@/store/bookStore";

interface Props {
    fileUrl: string;
    bookId: string;
    initialPage?: number; // Viewer expects zero-based page index.
    targetPage?: number | null; // One-based page number used by bookmark UI.
    onJumpHandled?: () => void;
    autoScrollEnabled?: boolean;
    autoScrollSpeed?: number;
    onToggleAutoScroll?: () => void;
    onAddBookmark?: () => void;
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
    autoScrollEnabled = false,
    autoScrollSpeed = 0,
    onToggleAutoScroll,
    onAddBookmark,
}: Props) {
    const isMobile = useIsMobile();
    const { saveProgress, books, updateBook } = useBooks();
    const book = books.find((item) => item.id === bookId);

    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const viewerContainerRef = useRef<HTMLDivElement>(null);
    const totalPagesRef = useRef<number>(book?.totalPages || 0);
    const [totalPages, setTotalPages] = useState(book?.totalPages || 0);
    const [currentPageIndex, setCurrentPageIndex] = useState(Math.max(0, initialPage));
    const [pageInput, setPageInput] = useState(String(Math.max(1, initialPage + 1)));
    const [zoomScale, setZoomScale] = useState(1);
    const [immersiveMode, setImmersiveMode] = useState(false);
    const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
    const [viewerNonce, setViewerNonce] = useState(0);
    const [displayMode, setDisplayMode] = useState<PdfDisplayMode>("dark");
    const [brightness, setBrightness] = useState(100);
    const [showBrightnessControls, setShowBrightnessControls] = useState(false);
    const pageNavigation = pageNavigationPlugin();
    const zoom = zoomPlugin();

    // Trigger a controlled remount to jump to selected bookmark pages.
    useEffect(() => {
        if (targetPage == null) return;
        setViewerNonce((value) => value + 1);
        setCurrentPageIndex(Math.max(0, targetPage - 1));
        setPageInput(String(Math.max(1, targetPage)));
        onJumpHandled?.();
    }, [onJumpHandled, targetPage]);

    useEffect(() => {
        return () => {
            if (saveTimer.current) clearTimeout(saveTimer.current);
        };
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsNativeFullscreen(Boolean(document.fullscreenElement));
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
        };
    }, []);

    useEffect(() => {
        if (!immersiveMode) return;

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setImmersiveMode(false);
            }
        };

        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [immersiveMode]);

    const handleDocumentLoad = useCallback(
        (event: { doc: { numPages: number } }) => {
            const totalPages = event.doc.numPages;
            totalPagesRef.current = totalPages;
            setTotalPages(totalPages);

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
            setCurrentPageIndex(event.currentPage);
            setPageInput(String(oneBasedPage));
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

    const commitPageInput = () => {
        const parsed = Number.parseInt(pageInput, 10);
        const maxPage = Math.max(1, totalPages || totalPagesRef.current || 1);
        if (!Number.isFinite(parsed)) {
            setPageInput(String(currentPageIndex + 1));
            return;
        }

        const oneBasedTarget = Math.max(1, Math.min(maxPage, parsed));
        setPageInput(String(oneBasedTarget));
        pageNavigation.jumpToPage(oneBasedTarget - 1);
    };

    const zoomStep = 0.1;
    const handleZoomOut = () => {
        const next = Math.max(0.5, Number((zoomScale - zoomStep).toFixed(2)));
        zoom.zoomTo(next);
    };

    const handleZoomIn = () => {
        const next = Math.min(4, Number((zoomScale + zoomStep).toFixed(2)));
        zoom.zoomTo(next);
    };

    const toggleFullScreen = async () => {
        const nativeFullscreenSupported =
            typeof document !== "undefined" &&
            !!document.fullscreenEnabled &&
            typeof viewerContainerRef.current?.requestFullscreen === "function";

        // On many mobile browsers (especially iOS Safari), element fullscreen isn't reliable.
        if (isMobile || !nativeFullscreenSupported) {
            setImmersiveMode((value) => !value);
            return;
        }

        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            } else if (viewerContainerRef.current?.requestFullscreen) {
                await viewerContainerRef.current.requestFullscreen();
            } else {
                setImmersiveMode((value) => !value);
            }
        } catch {
            setImmersiveMode((value) => !value);
        }
    };

    return (
        <div
            ref={viewerContainerRef}
            className={`flex flex-col h-full overflow-hidden bg-background ${
                immersiveMode ? "fixed inset-0 z-[70] h-[100dvh]" : ""
            }`}
        >
            <div className="shrink-0 border-b border-muted px-3 py-2 bg-surface-1">
                <div className="overflow-x-auto pb-0.5">
                    <div className="flex w-max min-w-full items-center gap-2 [&>*]:shrink-0">
                    <div className="flex items-center gap-1 border border-muted bg-background px-1.5 py-1">
                        {onToggleAutoScroll && (
                            <button
                                type="button"
                                onClick={onToggleAutoScroll}
                                disabled={autoScrollSpeed <= 0}
                                className={`border px-2 py-1 text-[10px] transition-colors ${
                                    autoScrollEnabled
                                        ? "border-terminal text-terminal"
                                        : "border-muted text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                                } disabled:opacity-40 disabled:cursor-not-allowed`}
                                title={
                                    autoScrollSpeed <= 0
                                        ? "Set auto-scroll speed in Settings first"
                                        : "Toggle auto-scroll"
                                }
                            >
                                Scroll
                            </button>
                        )}

                        {onAddBookmark && (
                            <button
                                type="button"
                                onClick={onAddBookmark}
                                className="border border-muted px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
                            >
                                Mark
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-1 border border-muted bg-background px-1.5 py-1">
                        <button
                            type="button"
                            onClick={() => pageNavigation.jumpToPreviousPage()}
                            disabled={currentPageIndex <= 0}
                            className="border border-muted px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Prev
                        </button>

                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <input
                                type="text"
                                value={pageInput}
                                onChange={(event) => setPageInput(event.target.value.replace(/[^\d]/g, ""))}
                                onBlur={commitPageInput}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        event.preventDefault();
                                        commitPageInput();
                                    }
                                }}
                                className="w-12 border border-muted bg-background px-1 py-1 text-center text-foreground outline-none focus:border-terminal"
                                aria-label="Page number"
                            />
                            <span>/ {Math.max(0, totalPages)}</span>
                        </div>

                        <button
                            type="button"
                            onClick={() => pageNavigation.jumpToNextPage()}
                            disabled={totalPages > 0 ? currentPageIndex + 1 >= totalPages : false}
                            className="border border-muted px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>

                    <div className="flex items-center gap-1 border border-muted bg-background px-1.5 py-1">
                        <button
                            type="button"
                            onClick={handleZoomOut}
                            className="border border-muted px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
                        >
                            -
                        </button>

                        <span className="text-[10px] text-muted-foreground tabular-nums min-w-[45px] text-center">
                            {Math.round(zoomScale * 100)}%
                        </span>

                        <button
                            type="button"
                            onClick={handleZoomIn}
                            className="border border-muted px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
                        >
                            +
                        </button>

                        <span className="mx-1 h-3 border-l border-muted/70" />

                        <button
                            type="button"
                            onClick={() => zoom.zoomTo(SpecialZoomLevel.PageWidth)}
                            className="border border-muted px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
                        >
                            Width
                        </button>

                        <button
                            type="button"
                            onClick={() => zoom.zoomTo(SpecialZoomLevel.PageFit)}
                            className="border border-muted px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
                        >
                            Page
                        </button>
                    </div>

                    <div className="ml-auto flex items-center gap-2 [&>*]:shrink-0">
                        <div className="flex items-center gap-2 border border-muted bg-background px-2 py-1">
                            <span className="text-[10px] text-muted-foreground">Theme</span>
                            <select
                                value={displayMode}
                                onChange={(event) => setDisplayMode(event.target.value as PdfDisplayMode)}
                                className="border border-muted bg-background px-2 py-1 text-[10px] text-foreground outline-none focus:border-terminal"
                                aria-label="Display mode"
                            >
                                {DISPLAY_MODE_OPTIONS.map((option) => (
                                    <option key={option.mode} value={option.mode}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowBrightnessControls((value) => !value)}
                            className={`border px-2 py-1 text-[10px] transition-colors ${
                                showBrightnessControls
                                    ? "border-terminal text-terminal"
                                    : "border-muted text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                            }`}
                        >
                            Brightness {brightness}%
                        </button>

                        {showBrightnessControls && (
                            <div className="flex items-center gap-2 border border-muted bg-background px-2 py-1 min-w-[190px]">
                                <input
                                    type="range"
                                    min={60}
                                    max={140}
                                    value={brightness}
                                    onChange={(event) => setBrightness(Number(event.target.value))}
                                    className="flex-1 accent-[hsl(var(--terminal-green))]"
                                />
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={toggleFullScreen}
                            className="border border-muted bg-background px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
                        >
                            {isNativeFullscreen || immersiveMode ? "Exit Fullscreen" : "Fullscreen"}
                        </button>
                    </div>
                </div>
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
                        plugins={[pageNavigation, zoom]}
                        initialPage={viewerInitialPage}
                        onPageChange={handlePageChange}
                        onDocumentLoad={handleDocumentLoad}
                        onZoom={(event) => setZoomScale(event.scale)}
                        theme={{ theme: "dark" }}
                    />
                </Worker>
            </div>
        </div>
    );
}
