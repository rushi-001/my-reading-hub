import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Document as PdfDocument, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { useIsMobile } from "@/hooks/use-mobile";
import { useBooks } from "@/store/bookStore";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type FullscreenDocument = Document & {
    webkitExitFullscreen?: () => Promise<void> | void;
    webkitFullscreenElement?: Element | null;
};

type FullscreenContainer = HTMLDivElement & {
    webkitRequestFullscreen?: () => Promise<void> | void;
};

type LoadedPdfDocument = {
    numPages: number;
};

type LoadedPdfPage = {
    getViewport: (params: { scale: number }) => { width: number; height: number };
};

type PdfDisplayMode = "original" | "dark" | "sepia" | "sepia-invert";
type ZoomPreset = "width" | "page";

interface Props {
    fileUrl: string;
    bookId: string;
    initialPage?: number;
    targetPage?: number | null;
    onJumpHandled?: () => void;
    autoScrollEnabled?: boolean;
    autoScrollSpeed?: number;
    onToggleAutoScroll?: () => void;
    onAddBookmark?: () => void;
}

const DISPLAY_MODE_OPTIONS: Array<{ mode: PdfDisplayMode; label: string }> = [
    { mode: "original", label: "Original" },
    { mode: "dark", label: "Dark" },
    { mode: "sepia", label: "Sepia" },
    { mode: "sepia-invert", label: "Sepia Invert" },
];

const DEFAULT_PAGE_ASPECT_RATIO = 0.75;
const MIN_PAGE_WIDTH = 240;
const PDF_DOCUMENT_OPTIONS = {
    cMapPacked: true,
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
    isEvalSupported: false,
};

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
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const pageRefs = useRef<Array<HTMLDivElement | null>>([]);
    const totalPagesRef = useRef<number>(book?.totalPages || 0);
    const currentPageIndexRef = useRef(Math.max(0, initialPage));
    const pendingScrollPageRef = useRef<number | null>(Math.max(0, initialPage));
    const scrollFrameRef = useRef<number | null>(null);

    const [totalPages, setTotalPages] = useState(book?.totalPages || 0);
    const [currentPageIndex, setCurrentPageIndex] = useState(Math.max(0, initialPage));
    const [pageInput, setPageInput] = useState(String(Math.max(1, initialPage + 1)));
    const [zoomPreset, setZoomPreset] = useState<ZoomPreset>("width");
    const [zoomMultiplier, setZoomMultiplier] = useState(1);
    const [viewportWidth, setViewportWidth] = useState(0);
    const [viewportHeight, setViewportHeight] = useState(0);
    const [pageAspectRatio, setPageAspectRatio] = useState(DEFAULT_PAGE_ASPECT_RATIO);
    const [immersiveMode, setImmersiveMode] = useState(false);
    const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
    const [displayMode, setDisplayMode] = useState<PdfDisplayMode>("dark");
    const [brightness, setBrightness] = useState(100);
    const [showBrightnessControls, setShowBrightnessControls] = useState(false);
    const [documentError, setDocumentError] = useState<string | null>(null);

    const getFullscreenElement = useCallback(() => {
        const fullscreenDocument = document as FullscreenDocument;
        return document.fullscreenElement ?? fullscreenDocument.webkitFullscreenElement ?? null;
    }, []);

    const exitNativeFullscreen = useCallback(async () => {
        const fullscreenDocument = document as FullscreenDocument;
        if (document.fullscreenElement && document.exitFullscreen) {
            await document.exitFullscreen();
            return;
        }
        if (fullscreenDocument.webkitFullscreenElement) {
            await fullscreenDocument.webkitExitFullscreen?.();
        }
    }, []);

    const requestNativeFullscreen = useCallback(async () => {
        const container = viewerContainerRef.current as FullscreenContainer | null;
        if (!container) return false;

        if (typeof container.requestFullscreen === "function") {
            await container.requestFullscreen();
            return true;
        }

        if (typeof container.webkitRequestFullscreen === "function") {
            await container.webkitRequestFullscreen();
            return true;
        }

        return false;
    }, []);

    const syncPageState = useCallback(
        (pageIndex: number) => {
            const nextPageIndex = Math.max(0, pageIndex);
            const oneBasedPage = nextPageIndex + 1;
            currentPageIndexRef.current = nextPageIndex;
            setCurrentPageIndex(nextPageIndex);
            setPageInput(String(oneBasedPage));

            if (saveTimer.current) clearTimeout(saveTimer.current);
            saveTimer.current = setTimeout(() => {
                const knownTotalPages = totalPagesRef.current || book?.totalPages || 0;
                if (knownTotalPages > 0) {
                    saveProgress(
                        bookId,
                        Math.round((oneBasedPage / knownTotalPages) * 100),
                        oneBasedPage,
                    );
                } else {
                    saveProgress(bookId, 0, oneBasedPage);
                }
            }, 350);
        },
        [book?.totalPages, bookId, saveProgress],
    );

    const executePendingScroll = useCallback(
        (behavior: ScrollBehavior = "auto") => {
            const pendingPageIndex = pendingScrollPageRef.current;
            const container = scrollContainerRef.current;
            if (pendingPageIndex == null || !container) return;

            const pageElement = pageRefs.current[pendingPageIndex];
            if (!pageElement) return;

            container.scrollTo({
                top: Math.max(0, pageElement.offsetTop - 12),
                behavior,
            });
            pendingScrollPageRef.current = null;
        },
        [],
    );

    const scrollToPage = useCallback(
        (pageIndex: number, behavior: ScrollBehavior = "smooth") => {
            const maxPageIndex =
                totalPagesRef.current > 0 ? totalPagesRef.current - 1 : Math.max(0, pageIndex);
            const clampedPageIndex = Math.max(0, Math.min(maxPageIndex, pageIndex));
            pendingScrollPageRef.current = clampedPageIndex;
            syncPageState(clampedPageIndex);
            executePendingScroll(behavior);
        },
        [executePendingScroll, syncPageState],
    );

    const updateCurrentPageFromScroll = useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container || totalPagesRef.current <= 0) return;

        let bestPageIndex = currentPageIndexRef.current;
        let bestDistance = Number.POSITIVE_INFINITY;

        for (let index = 0; index < totalPagesRef.current; index += 1) {
            const pageElement = pageRefs.current[index];
            if (!pageElement) continue;

            const distance = Math.abs(pageElement.offsetTop - container.scrollTop);
            if (distance < bestDistance) {
                bestDistance = distance;
                bestPageIndex = index;
            }
        }

        if (bestPageIndex !== currentPageIndexRef.current) {
            syncPageState(bestPageIndex);
        }
    }, [syncPageState]);

    const handleScroll = useCallback(() => {
        if (scrollFrameRef.current != null) return;

        scrollFrameRef.current = window.requestAnimationFrame(() => {
            scrollFrameRef.current = null;
            updateCurrentPageFromScroll();
        });
    }, [updateCurrentPageFromScroll]);

    useEffect(() => {
        const nextInitialPage = Math.max(0, initialPage);
        currentPageIndexRef.current = nextInitialPage;
        pendingScrollPageRef.current = nextInitialPage;
        totalPagesRef.current = book?.totalPages || 0;
        pageRefs.current = [];
        setCurrentPageIndex(nextInitialPage);
        setPageInput(String(nextInitialPage + 1));
        setTotalPages(book?.totalPages || 0);
        setZoomPreset("width");
        setZoomMultiplier(1);
        setPageAspectRatio(DEFAULT_PAGE_ASPECT_RATIO);
        setDocumentError(null);
    }, [bookId, fileUrl]);

    useEffect(() => {
        return () => {
            if (saveTimer.current) clearTimeout(saveTimer.current);
            if (scrollFrameRef.current != null) {
                window.cancelAnimationFrame(scrollFrameRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsNativeFullscreen(Boolean(getFullscreenElement()));
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            document.removeEventListener(
                "webkitfullscreenchange",
                handleFullscreenChange,
            );
        };
    }, [getFullscreenElement]);

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

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const updateViewportSize = () => {
            setViewportWidth(container.clientWidth);
            setViewportHeight(container.clientHeight);
        };

        updateViewportSize();

        if (typeof ResizeObserver !== "undefined") {
            const resizeObserver = new ResizeObserver(updateViewportSize);
            resizeObserver.observe(container);
            return () => resizeObserver.disconnect();
        }

        window.addEventListener("resize", updateViewportSize);
        return () => window.removeEventListener("resize", updateViewportSize);
    }, []);

    useEffect(() => {
        if (targetPage == null) return;
        scrollToPage(targetPage - 1);
        onJumpHandled?.();
    }, [onJumpHandled, scrollToPage, targetPage]);

    const fitWidth = Math.max(
        MIN_PAGE_WIDTH,
        viewportWidth - (isMobile ? 24 : 48),
    );
    const fitPageWidth = Math.max(
        MIN_PAGE_WIDTH,
        Math.min(
            fitWidth,
            Math.max(
                MIN_PAGE_WIDTH,
                (viewportHeight - (isMobile ? 32 : 64)) * pageAspectRatio,
            ),
        ),
    );
    const basePageWidth = zoomPreset === "page" ? fitPageWidth : fitWidth;
    const resolvedPageWidth = Math.max(
        MIN_PAGE_WIDTH,
        Math.round(basePageWidth * zoomMultiplier),
    );
    const displayZoomPercent =
        fitWidth > 0
            ? Math.max(50, Math.round((resolvedPageWidth / fitWidth) * 100))
            : Math.round(zoomMultiplier * 100);
    const estimatedPageHeight = Math.round(resolvedPageWidth / pageAspectRatio);

    useEffect(() => {
        if (totalPagesRef.current <= 0) return;
        pendingScrollPageRef.current = currentPageIndexRef.current;
        const frame = window.requestAnimationFrame(() => executePendingScroll("auto"));
        return () => window.cancelAnimationFrame(frame);
    }, [executePendingScroll, resolvedPageWidth]);

    const handleDocumentLoadSuccess = useCallback(
        (loadedDocument: LoadedPdfDocument) => {
            const nextTotalPages = loadedDocument.numPages;
            const clampedCurrentPage =
                nextTotalPages > 0
                    ? Math.max(
                          0,
                          Math.min(
                              nextTotalPages - 1,
                              pendingScrollPageRef.current ?? currentPageIndexRef.current,
                          ),
                      )
                    : 0;

            totalPagesRef.current = nextTotalPages;
            pendingScrollPageRef.current = clampedCurrentPage;
            setTotalPages(nextTotalPages);
            setDocumentError(null);

            if (!book || book.totalPages !== nextTotalPages) {
                updateBook(bookId, { totalPages: nextTotalPages });
            }

            if (book && nextTotalPages > 0 && book.currentPage > 0) {
                const progress = Math.round((book.currentPage / nextTotalPages) * 100);
                if (progress !== book.progress) {
                    updateBook(bookId, {
                        progress: Math.min(100, Math.max(0, progress)),
                    });
                }
            }

            window.requestAnimationFrame(() => executePendingScroll("auto"));
        },
        [book, bookId, executePendingScroll, updateBook],
    );

    const handleDocumentLoadError = useCallback((error: Error) => {
        setDocumentError(error.message || "Failed to load this PDF.");
    }, []);

    const handlePageLoadSuccess = useCallback(
        (pageIndex: number, page: LoadedPdfPage) => {
            if (pageIndex !== 0) return;

            const viewport = page.getViewport({ scale: 1 });
            if (viewport.width > 0 && viewport.height > 0) {
                setPageAspectRatio(viewport.width / viewport.height);
            }
        },
        [],
    );

    const handlePageRenderSuccess = useCallback(
        (pageIndex: number) => {
            if (pendingScrollPageRef.current === pageIndex) {
                executePendingScroll("auto");
            }
        },
        [executePendingScroll],
    );

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
            setPageInput(String(currentPageIndexRef.current + 1));
            return;
        }

        const nextPage = Math.max(1, Math.min(maxPage, parsed));
        setPageInput(String(nextPage));
        scrollToPage(nextPage - 1);
    };

    const handleZoomOut = () => {
        setZoomMultiplier((current) => Math.max(0.5, Number((current - 0.1).toFixed(2))));
    };

    const handleZoomIn = () => {
        setZoomMultiplier((current) => Math.min(4, Number((current + 0.1).toFixed(2))));
    };

    const toggleFullScreen = async () => {
        try {
            if (getFullscreenElement()) {
                await exitNativeFullscreen();
                setImmersiveMode(false);
                return;
            }

            const enteredNativeFullscreen = await requestNativeFullscreen();
            if (enteredNativeFullscreen) {
                setImmersiveMode(false);
                return;
            }

            setImmersiveMode((value) => !value);
        } catch {
            setImmersiveMode((value) => !value);
        }
    };

    return (
        <div
            ref={viewerContainerRef}
            className={`flex h-full flex-col overflow-hidden bg-background ${
                immersiveMode ? "fixed inset-0 z-[70] h-[100dvh]" : ""
            }`}
        >
            <div className="shrink-0 border-b border-muted bg-surface-1 px-3 py-2">
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
                                            : "border-muted text-muted-foreground hover:border-muted-foreground hover:text-foreground"
                                    } disabled:cursor-not-allowed disabled:opacity-40`}
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
                                    className="border border-muted px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground"
                                >
                                    Mark
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-1 border border-muted bg-background px-1.5 py-1">
                            <button
                                type="button"
                                onClick={() => scrollToPage(currentPageIndexRef.current - 1)}
                                disabled={currentPageIndex <= 0}
                                className="border border-muted px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Prev
                            </button>

                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <input
                                    type="text"
                                    value={pageInput}
                                    onChange={(event) =>
                                        setPageInput(
                                            event.target.value.replace(/[^\d]/g, ""),
                                        )
                                    }
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
                                onClick={() => scrollToPage(currentPageIndexRef.current + 1)}
                                disabled={totalPages > 0 ? currentPageIndex + 1 >= totalPages : false}
                                className="border border-muted px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>

                        <div className="flex items-center gap-1 border border-muted bg-background px-1.5 py-1">
                            <button
                                type="button"
                                onClick={handleZoomOut}
                                className="border border-muted px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground"
                            >
                                -
                            </button>

                            <span className="min-w-[45px] text-center text-[10px] tabular-nums text-muted-foreground">
                                {displayZoomPercent}%
                            </span>

                            <button
                                type="button"
                                onClick={handleZoomIn}
                                className="border border-muted px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground"
                            >
                                +
                            </button>

                            <span className="mx-1 h-3 border-l border-muted/70" />

                            <button
                                type="button"
                                onClick={() => {
                                    setZoomPreset("width");
                                    setZoomMultiplier(1);
                                }}
                                className="border border-muted px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground"
                            >
                                Width
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setZoomPreset("page");
                                    setZoomMultiplier(1);
                                }}
                                className="border border-muted px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground"
                            >
                                Page
                            </button>
                        </div>

                        <div className="ml-auto flex items-center gap-2 [&>*]:shrink-0">
                            <div className="flex items-center gap-2 border border-muted bg-background px-2 py-1">
                                <span className="text-[10px] text-muted-foreground">Theme</span>
                                <select
                                    value={displayMode}
                                    onChange={(event) =>
                                        setDisplayMode(event.target.value as PdfDisplayMode)
                                    }
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
                                        : "border-muted text-muted-foreground hover:border-muted-foreground hover:text-foreground"
                                }`}
                            >
                                Brightness {brightness}%
                            </button>

                            {showBrightnessControls && (
                                <div className="flex min-w-[190px] items-center gap-2 border border-muted bg-background px-2 py-1">
                                    <input
                                        type="range"
                                        min={60}
                                        max={140}
                                        value={brightness}
                                        onChange={(event) =>
                                            setBrightness(Number(event.target.value))
                                        }
                                        className="flex-1 accent-[hsl(var(--terminal-green))]"
                                    />
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={toggleFullScreen}
                                className="border border-muted bg-background px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground"
                            >
                                {isNativeFullscreen || immersiveMode
                                    ? isMobile && !isNativeFullscreen
                                        ? "Exit Reader Mode"
                                        : "Exit Fullscreen"
                                    : "Fullscreen"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div
                className={`pdf-canvas-theme flex-1 overflow-hidden ${displayModeClass}`}
                style={filterStyle}
            >
                <div
                    ref={scrollContainerRef}
                    className="pdf-reader-scroll-container h-full overflow-auto px-2 py-3 sm:px-4"
                    onScroll={handleScroll}
                >
                    {documentError ? (
                        <div className="flex min-h-full items-center justify-center">
                            <div className="max-w-md border border-destructive/40 bg-surface-1 px-4 py-3 text-center text-[11px] text-destructive">
                                {documentError}
                            </div>
                        </div>
                    ) : (
                        <PdfDocument
                            key={fileUrl}
                            file={fileUrl}
                            options={PDF_DOCUMENT_OPTIONS}
                            loading={
                                <div className="flex min-h-full items-center justify-center text-[11px] text-muted-foreground">
                                    Loading PDF...
                                </div>
                            }
                            noData={
                                <div className="flex min-h-full items-center justify-center text-[11px] text-muted-foreground">
                                    No PDF selected.
                                </div>
                            }
                            onLoadSuccess={handleDocumentLoadSuccess}
                            onLoadError={handleDocumentLoadError}
                            className="flex min-h-full flex-col items-center gap-4"
                        >
                            {Array.from({ length: totalPages }, (_, index) => (
                                <div
                                    key={`${fileUrl}-page-${index + 1}`}
                                    ref={(node) => {
                                        pageRefs.current[index] = node;
                                    }}
                                    className="flex w-full justify-center"
                                >
                                    <Page
                                        pageNumber={index + 1}
                                        width={resolvedPageWidth}
                                        canvasBackground="white"
                                        renderAnnotationLayer
                                        renderTextLayer
                                        className="overflow-hidden border border-muted bg-background shadow-[0_0_0_1px_rgba(255,255,255,0.03)]"
                                        loading={
                                            <div
                                                className="flex items-center justify-center border border-muted bg-surface-1 text-[10px] text-muted-foreground"
                                                style={{
                                                    width: resolvedPageWidth,
                                                    minHeight: estimatedPageHeight,
                                                }}
                                            >
                                                Loading page {index + 1}...
                                            </div>
                                        }
                                        onLoadSuccess={(page) => handlePageLoadSuccess(index, page)}
                                        onRenderSuccess={() => handlePageRenderSuccess(index)}
                                    />
                                </div>
                            ))}
                        </PdfDocument>
                    )}
                </div>
            </div>
        </div>
    );
}
