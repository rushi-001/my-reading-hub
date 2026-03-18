import {
    ChangeEvent,
    MouseEvent as ReactMouseEvent,
    useEffect,
    useRef,
    useState,
} from "react";
import {
    ArrowLeft,
    Bookmark,
    BookmarkCheck,
    BookOpen,
    ChevronDown,
    ChevronUp,
    FileText,
    Headphones,
    Minus,
    Paperclip,
    Play,
    Plus,
    StickyNote,
    Trash2,
    Upload,
    X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NoteEditor } from "@/components/NoteEditor";
import { PDFReader } from "@/components/PDFReader";
import { useBooks } from "@/store/bookStore";
import { ProgressRing, StarRating } from "@/components/ui/BookUI";
import type { BookAttachment } from "@/types/book";

function fileToDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(new Error("Failed to read attachment"));
        reader.readAsDataURL(file);
    });
}

function formatAttachmentSize(bytes: number) {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isZoomableAttachment(attachment: BookAttachment) {
    const mime = attachment.mimeType.toLowerCase();
    return (
        mime.startsWith("image/") ||
        mime.startsWith("video/") ||
        mime === "application/pdf" ||
        mime.startsWith("text/") ||
        mime.includes("json") ||
        mime.includes("xml")
    );
}

function AttachmentZoomPreview({ attachment }: { attachment: BookAttachment }) {
    const mime = attachment.mimeType.toLowerCase();

    if (mime.startsWith("image/")) {
        return (
            <img
                src={attachment.dataUrl}
                alt={attachment.name}
                draggable={false}
                className="block max-w-none h-auto bg-black/20 select-none"
            />
        );
    }

    if (mime.startsWith("audio/")) {
        return (
            <div className="w-[640px] h-[120px] flex items-center justify-center px-3">
                <audio controls src={attachment.dataUrl} className="w-full" />
            </div>
        );
    }

    if (mime.startsWith("video/")) {
        return (
            <video
                controls
                src={attachment.dataUrl}
                className="block max-w-none bg-black/20"
            />
        );
    }

    if (
        mime === "application/pdf" ||
        mime.startsWith("text/") ||
        mime.includes("json") ||
        mime.includes("xml")
    ) {
        return (
            <iframe
                src={attachment.dataUrl}
                title={attachment.name}
                className="block border-0 bg-background w-[960px] h-[1200px]"
            />
        );
    }

    return (
        <div className="w-[520px] h-[220px] flex items-center justify-center text-[10px] text-muted-foreground px-2 text-center border border-muted bg-background">
            Preview not supported for this file type
        </div>
    );
}

export function BookReaderView() {
    const {
        activeBook,
        closeBook,
        showNotes,
        setShowNotes,
        updateBook,
        setAudioUrl,
        setPlaying,
        addBookmark,
        removeBookmark,
        addAttachment,
        removeAttachment,
        settings,
    } = useBooks();
    const navigate = useNavigate();

    const [showBookmarks, setShowBookmarks] = useState(false);
    const [showAttachments, setShowAttachments] = useState(false);
    const [autoScroll, setAutoScroll] = useState(false);
    const [jumpToPage, setJumpToPage] = useState<number | null>(null);
    const [attachmentError, setAttachmentError] = useState("");
    const [previewAttachment, setPreviewAttachment] =
        useState<BookAttachment | null>(null);
    const [attachmentZoom, setAttachmentZoom] = useState(1);
    const [isPreviewDragging, setIsPreviewDragging] = useState(false);

    const attachmentInputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const scrollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
    const previewViewportRef = useRef<HTMLDivElement>(null);
    const previewDragStateRef = useRef<{
        startX: number;
        startY: number;
        startScrollLeft: number;
        startScrollTop: number;
    } | null>(null);
    const isAudio = activeBook ? ["audio", "video", "podcast"].includes(activeBook.format) : false;
    const bookmarks = activeBook?.bookmarks || [];
    const attachments = activeBook?.attachments || [];

    const clearAutoScrollTimer = () => {
        if (scrollTimer.current) {
            clearInterval(scrollTimer.current);
            scrollTimer.current = null;
        }
    };

    const getScrollTarget = () => {
        if (!scrollRef.current) return null;
        const pdfScroller = scrollRef.current.querySelector<HTMLElement>(
            ".rpv-core__inner-pages, .rpv-core__inner-page-container--single",
        );
        return pdfScroller ?? scrollRef.current;
    };

    // Auto-scroll supports both plain containers and PDF internal scroll container.
    useEffect(() => {
        const speed = settings.autoScrollSpeed;
        if (autoScroll && speed > 0) {
            const pxPerTick = speed * 0.4;
            scrollTimer.current = setInterval(() => {
                const target = getScrollTarget();
                if (!target) return;

                const maxTop = Math.max(0, target.scrollHeight - target.clientHeight);
                const nextTop = Math.min(maxTop, target.scrollTop + pxPerTick);
                target.scrollTop = nextTop;

                if (nextTop >= maxTop) {
                    setAutoScroll(false);
                    clearAutoScrollTimer();
                }
            }, 16);
        } else {
            clearAutoScrollTimer();
        }
        return clearAutoScrollTimer;
    }, [activeBook?.id, autoScroll, settings.autoScrollSpeed, showNotes]);

    useEffect(() => {
        if (settings.autoScrollSpeed === 0 && autoScroll) {
            setAutoScroll(false);
        }
    }, [autoScroll, settings.autoScrollSpeed]);

    // Popup viewer keyboard controls.
    useEffect(() => {
        if (!previewAttachment) return;
        const zoomable = isZoomableAttachment(previewAttachment);
        const handler = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setPreviewAttachment(null);
                return;
            }
            if (!zoomable) return;
            if (event.key === "+" || event.key === "=") {
                event.preventDefault();
                setAttachmentZoom((prev) => Math.min(3, prev + 0.2));
                return;
            }
            if (event.key === "-" || event.key === "_") {
                event.preventDefault();
                setAttachmentZoom((prev) => Math.max(0.5, prev - 0.2));
                return;
            }
            if (event.key === "0") {
                event.preventDefault();
                setAttachmentZoom(1);
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [previewAttachment]);

    // Ensure drag mode ends even when mouse leaves the preview area.
    useEffect(() => {
        if (!isPreviewDragging) return;
        const stopDragging = () => {
            setIsPreviewDragging(false);
            previewDragStateRef.current = null;
        };
        window.addEventListener("mouseup", stopDragging);
        return () => window.removeEventListener("mouseup", stopDragging);
    }, [isPreviewDragging]);

    // Reset per-book transient UI when reader switches to another book.
    useEffect(() => {
        setShowBookmarks(false);
        setShowAttachments(false);
        setAttachmentError("");
        setJumpToPage(null);
        setPreviewAttachment(null);
        setAttachmentZoom(1);
        setIsPreviewDragging(false);
        previewDragStateRef.current = null;
    }, [activeBook?.id]);

    const handleBack = () => {
        closeBook();
        navigate("/library");
    };

    const handlePlayAudio = () => {
        if (!activeBook) return;
        if (!activeBook.audioUrl) return;
        setAudioUrl(activeBook.audioUrl);
        setPlaying(true);
    };

    const handleAddBookmark = () => {
        if (!activeBook) return;
        const page = Math.max(1, activeBook.currentPage || 1);
        addBookmark(activeBook.id, {
            type: "line",
            page,
            text: `Page ${page}`,
        });
        setShowBookmarks(true);
    };

    const handleAttachmentFile = async (event: ChangeEvent<HTMLInputElement>) => {
        if (!activeBook) return;
        const file = event.target.files?.[0];
        if (!file) return;
        setAttachmentError("");

        try {
            const dataUrl = await fileToDataUrl(file);
            addAttachment(activeBook.id, {
                name: file.name,
                mimeType: file.type || "application/octet-stream",
                size: file.size,
                dataUrl,
            });
            setShowAttachments(true);
        } catch {
            setAttachmentError("Could not add this attachment.");
        } finally {
            event.target.value = "";
        }
    };

    const openAttachmentPopup = (attachment: BookAttachment) => {
        setPreviewAttachment(attachment);
        setAttachmentZoom(1);
        setIsPreviewDragging(false);
        previewDragStateRef.current = null;
        requestAnimationFrame(() => {
            if (previewViewportRef.current) {
                previewViewportRef.current.scrollLeft = 0;
                previewViewportRef.current.scrollTop = 0;
            }
        });
    };

    const applyAttachmentZoom = (
        nextZoom: number,
        anchor?: { clientX: number; clientY: number },
    ) => {
        const viewport = previewViewportRef.current;
        const clamped = Math.min(3, Math.max(0.5, Number(nextZoom.toFixed(2))));
        if (!viewport) {
            setAttachmentZoom(clamped);
            return;
        }

        const rect = viewport.getBoundingClientRect();
        const anchorX = anchor ? anchor.clientX - rect.left : viewport.clientWidth / 2;
        const anchorY = anchor ? anchor.clientY - rect.top : viewport.clientHeight / 2;
        const worldX = (viewport.scrollLeft + anchorX) / attachmentZoom;
        const worldY = (viewport.scrollTop + anchorY) / attachmentZoom;

        setAttachmentZoom(clamped);

        requestAnimationFrame(() => {
            const nextViewport = previewViewportRef.current;
            if (!nextViewport) return;
            nextViewport.scrollLeft = worldX * clamped - anchorX;
            nextViewport.scrollTop = worldY * clamped - anchorY;
        });
    };

    const handlePreviewMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
        if (!previewAttachment || !isZoomableAttachment(previewAttachment)) return;
        if (event.button !== 0) return;
        const viewport = previewViewportRef.current;
        if (!viewport) return;
        event.preventDefault();
        previewDragStateRef.current = {
            startX: event.clientX,
            startY: event.clientY,
            startScrollLeft: viewport.scrollLeft,
            startScrollTop: viewport.scrollTop,
        };
        setIsPreviewDragging(true);
    };

    const handlePreviewMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {
        if (!isPreviewDragging || !previewDragStateRef.current || !previewViewportRef.current) return;
        const drag = previewDragStateRef.current;
        previewViewportRef.current.scrollLeft =
            drag.startScrollLeft - (event.clientX - drag.startX);
        previewViewportRef.current.scrollTop =
            drag.startScrollTop - (event.clientY - drag.startY);
    };

    const stopPreviewDragging = () => {
        setIsPreviewDragging(false);
        previewDragStateRef.current = null;
    };

    if (!activeBook) return null;

    return (
        <div className="flex flex-col h-full">
            {/* Reader toolbar */}
            <div className="flex items-center gap-3 px-4 py-2 border-b border-muted bg-surface-1 shrink-0 flex-wrap">
                <button
                    onClick={handleBack}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="Back to library"
                >
                    <ArrowLeft size={15} />
                </button>

                {/* Book identity and progress */}
                <div className="relative w-6 h-8 shrink-0">
                    {activeBook.cover ? (
                        <img src={activeBook.cover} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-surface-3 flex items-center justify-center">
                            <BookOpen size={8} className="text-muted-foreground" />
                        </div>
                    )}
                    <div className="absolute inset-0">
                        <ProgressRing progress={activeBook.progress} size={24} stroke={1.5} />
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <span className="text-[12px] font-medium truncate block">{activeBook.title}</span>
                    <span className="text-[11px] text-muted-foreground truncate block">
                        {activeBook.author}
                    </span>
                </div>

                <span className="tabular-nums text-[12px] text-terminal shrink-0">
                    {activeBook.progress}%
                </span>

                {settings.autoScrollSpeed > 0 && (
                    <button
                        onClick={() => setAutoScroll(!autoScroll)}
                        className={`flex items-center gap-1 border px-2 py-1 text-[11px] transition-colors ${
                            autoScroll
                                ? "border-terminal text-terminal"
                                : "border-muted text-muted-foreground hover:border-muted-foreground"
                        }`}
                        title="Toggle auto-scroll"
                    >
                        {autoScroll ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                        Scroll
                    </button>
                )}

                <button
                    onClick={handleAddBookmark}
                    className="flex items-center gap-1 border border-muted px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
                    title="Add bookmark at current page"
                >
                    <Bookmark size={12} /> Mark
                </button>

                {bookmarks.length > 0 && (
                    <button
                        onClick={() => setShowBookmarks(!showBookmarks)}
                        className={`flex items-center gap-1 border px-2 py-1 text-[11px] transition-colors ${
                            showBookmarks
                                ? "border-terminal text-terminal"
                                : "border-muted text-muted-foreground hover:border-muted-foreground"
                        }`}
                        title="Show bookmarks"
                    >
                        <BookmarkCheck size={12} /> {bookmarks.length}
                    </button>
                )}

                <button
                    onClick={() => setShowAttachments(!showAttachments)}
                    className={`flex items-center gap-1 border px-2 py-1 text-[11px] transition-colors ${
                        showAttachments
                            ? "border-terminal text-terminal"
                            : "border-muted text-muted-foreground hover:border-muted-foreground"
                    }`}
                    title="Show attachments"
                >
                    <Paperclip size={12} /> {attachments.length}
                </button>

                <button
                    onClick={() => attachmentInputRef.current?.click()}
                    className="flex items-center gap-1 border border-muted px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
                    title="Add attachment"
                >
                    <Upload size={12} /> Attach
                </button>
                <input
                    ref={attachmentInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleAttachmentFile}
                />

                {(isAudio || activeBook.audioUrl) && (
                    <button
                        onClick={handlePlayAudio}
                        className="flex items-center gap-1 border border-muted px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
                    >
                        <Headphones size={12} /> Play
                    </button>
                )}

                <button
                    onClick={() => setShowNotes(!showNotes)}
                    className={`flex items-center gap-1 border px-2 py-1 text-[11px] transition-colors ${
                        showNotes
                            ? "border-terminal text-terminal"
                            : "border-muted text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                    }`}
                >
                    <StickyNote size={12} /> Notes
                </button>
            </div>

            {/* Bookmark strip with jump-to-page behavior */}
            {showBookmarks && bookmarks.length > 0 && (
                <div className="border-b border-muted bg-surface-1 px-4 py-2 flex gap-2 overflow-x-auto shrink-0">
                    {bookmarks.map((bookmark) => (
                        <div
                            key={bookmark.id}
                            className="flex items-center gap-1.5 border border-muted px-2 py-1 text-[11px] text-muted-foreground shrink-0"
                        >
                            <button
                                onClick={() => setJumpToPage(bookmark.page)}
                                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                                title={`Jump to page ${bookmark.page}`}
                            >
                                <BookmarkCheck size={11} className="text-terminal" />
                                <span className="font-mono">{bookmark.text}</span>
                            </button>
                            <button
                                onClick={() => removeBookmark(activeBook.id, bookmark.id)}
                                className="text-muted-foreground/50 hover:text-destructive ml-1"
                                title="Remove bookmark"
                            >
                                <Trash2 size={11} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Attachment strip for per-book supporting files (maps, notes, etc). */}
            {showAttachments && (
                <div className="border-b border-muted bg-surface-1 px-4 py-2 space-y-2 shrink-0">
                    {attachments.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground">
                            No attachments yet. Use Attach to add supporting files.
                        </p>
                    ) : (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {attachments.map((attachment) => (
                                <div
                                    key={attachment.id}
                                    className="flex items-center gap-2 border border-muted px-2 py-1.5 min-w-[280px] shrink-0 bg-background"
                                >
                                    <Paperclip
                                        size={11}
                                        className="text-terminal shrink-0"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p
                                            className="text-[11px] text-muted-foreground truncate"
                                            title={attachment.name}
                                        >
                                            {attachment.name}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground/70">
                                            {formatAttachmentSize(attachment.size)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => openAttachmentPopup(attachment)}
                                        className="border border-muted px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors shrink-0"
                                        title="Open preview popup"
                                    >
                                        View
                                    </button>
                                    <button
                                        onClick={() =>
                                            removeAttachment(activeBook.id, attachment.id)
                                        }
                                        className="text-muted-foreground/60 hover:text-destructive shrink-0"
                                        title="Remove attachment"
                                    >
                                        <Trash2 size={11} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    {attachmentError && (
                        <p className="text-[11px] text-destructive">{attachmentError}</p>
                    )}
                </div>
            )}

            {/* Popup attachment viewer with zoom controls */}
            {previewAttachment && (
                <>
                    <div
                        className="fixed inset-0 z-50 bg-black/80"
                        onClick={() => {
                            setPreviewAttachment(null);
                            stopPreviewDragging();
                        }}
                    />
                    <div className="fixed inset-0 z-[60] p-4 sm:p-6 flex items-center justify-center pointer-events-none">
                        <div
                            className="pointer-events-auto w-full max-w-6xl h-[88vh] border border-muted bg-background flex flex-col"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="flex items-center gap-3 px-4 py-2 border-b border-muted">
                                <Paperclip size={13} className="text-terminal shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p
                                        className="text-[12px] text-foreground truncate"
                                        title={previewAttachment.name}
                                    >
                                        {previewAttachment.name}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                        {formatAttachmentSize(previewAttachment.size)}
                                    </p>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() =>
                                            applyAttachmentZoom(
                                                attachmentZoom - 0.2,
                                            )
                                        }
                                        disabled={
                                            !isZoomableAttachment(
                                                previewAttachment,
                                            )
                                        }
                                        className="w-7 h-7 border border-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                                        title="Zoom out"
                                    >
                                        <Minus size={12} />
                                    </button>
                                    <button
                                        onClick={() => applyAttachmentZoom(1)}
                                        disabled={
                                            !isZoomableAttachment(
                                                previewAttachment,
                                            )
                                        }
                                        className="px-2 h-7 border border-muted text-[10px] text-muted-foreground hover:text-foreground hover:border-muted-foreground tabular-nums disabled:opacity-40 disabled:cursor-not-allowed"
                                        title="Reset zoom"
                                    >
                                        {Math.round(attachmentZoom * 100)}%
                                    </button>
                                    <button
                                        onClick={() =>
                                            applyAttachmentZoom(
                                                attachmentZoom + 0.2,
                                            )
                                        }
                                        disabled={
                                            !isZoomableAttachment(
                                                previewAttachment,
                                            )
                                        }
                                        className="w-7 h-7 border border-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                                        title="Zoom in"
                                    >
                                        <Plus size={12} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setPreviewAttachment(null);
                                            stopPreviewDragging();
                                        }}
                                        className="w-7 h-7 border border-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                                        title="Close popup"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 min-h-0 bg-surface-2 p-3">
                                <div
                                    ref={previewViewportRef}
                                    className={`h-full w-full overflow-auto border border-muted bg-background ${
                                        isZoomableAttachment(
                                            previewAttachment,
                                        )
                                            ? isPreviewDragging
                                                ? "cursor-grabbing"
                                                : "cursor-grab"
                                            : "cursor-default"
                                    }`}
                                    onMouseDown={handlePreviewMouseDown}
                                    onMouseMove={handlePreviewMouseMove}
                                    onMouseUp={stopPreviewDragging}
                                    onMouseLeave={stopPreviewDragging}
                                >
                                    <div
                                        className="inline-block origin-top-left"
                                        style={{
                                            transform: isZoomableAttachment(
                                                previewAttachment,
                                            )
                                                ? `scale(${attachmentZoom})`
                                                : undefined,
                                        }}
                                    >
                                        <AttachmentZoomPreview
                                            attachment={previewAttachment}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-muted px-4 py-1.5 text-[10px] text-muted-foreground flex items-center gap-2">
                                <span>Zoom:</span>
                                <kbd className="border border-muted px-1">+</kbd>
                                <kbd className="border border-muted px-1">-</kbd>
                                <kbd className="border border-muted px-1">0</kbd>
                                <span className="ml-3">Drag to pan</span>
                                <span className="ml-auto">Esc to close</span>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Main reading area */}
            <div className="flex flex-1 min-h-0">
                <div
                    ref={scrollRef}
                    className={`${showNotes ? "w-1/2" : "flex-1"} overflow-auto`}
                    style={{ minHeight: 0 }}
                >
                    {isAudio && !activeBook.fileUrl ? (
                        <div className="flex flex-col items-center justify-center h-full gap-6 p-12 text-center">
                            <div className="w-32 h-44 bg-surface-2 border border-muted flex items-center justify-center">
                                {activeBook.cover ? (
                                    <img src={activeBook.cover} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <Headphones size={32} className="text-muted-foreground/30" />
                                )}
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-lg font-medium">{activeBook.title}</h2>
                                <p className="text-[12px] text-muted-foreground">{activeBook.author}</p>
                                {activeBook.description && (
                                    <p className="text-[12px] text-muted-foreground max-w-md mt-3 leading-relaxed">
                                        {activeBook.description}
                                    </p>
                                )}
                                <div className="flex justify-center mt-2">
                                    <StarRating
                                        value={activeBook.rating}
                                        onChange={(rating) => updateBook(activeBook.id, { rating })}
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handlePlayAudio}
                                className="flex items-center gap-2 bg-terminal text-background px-6 py-3 text-[12px] font-medium hover:opacity-90 transition-opacity"
                            >
                                <Play size={15} /> Play Audio
                            </button>
                            {activeBook.audioUrl && (
                                <p className="text-[10px] text-muted-foreground/60 font-mono max-w-xs truncate">
                                    {activeBook.audioUrl}
                                </p>
                            )}
                        </div>
                    ) : activeBook.fileUrl ? (
                        <PDFReader
                            fileUrl={activeBook.fileUrl}
                            bookId={activeBook.id}
                            initialPage={Math.max(0, (activeBook.currentPage || 1) - 1)}
                            targetPage={jumpToPage}
                            onJumpHandled={() => setJumpToPage(null)}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
                            <FileText size={32} className="text-muted-foreground/30" />
                            <p className="text-[12px] text-muted-foreground">
                                No file attached to this book.
                            </p>
                        </div>
                    )}
                </div>

                {showNotes && (
                    <div className="w-1/2 min-h-0 overflow-hidden">
                        <NoteEditor bookId={activeBook.id} />
                    </div>
                )}
            </div>
        </div>
    );
}
