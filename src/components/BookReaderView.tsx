import { ChangeEvent, useEffect, useRef, useState } from "react";
import {
    ArrowLeft,
    Bookmark,
    BookmarkCheck,
    BookOpen,
    ChevronDown,
    ChevronUp,
    FileText,
    Headphones,
    Paperclip,
    Play,
    StickyNote,
    Trash2,
    Upload,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NoteEditor } from "@/components/NoteEditor";
import { PDFReader } from "@/components/PDFReader";
import { useBooks } from "@/store/bookStore";
import { ProgressRing, StarRating } from "@/components/ui/BookUI";

function fileToDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(new Error("Failed to read attachment"));
        reader.readAsDataURL(file);
    });
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

    const attachmentInputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const scrollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
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

    // Reset per-book transient UI when reader switches to another book.
    useEffect(() => {
        setShowBookmarks(false);
        setShowAttachments(false);
        setAttachmentError("");
        setJumpToPage(null);
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
                        <div className="flex gap-2 overflow-x-auto">
                            {attachments.map((attachment) => (
                                <div
                                    key={attachment.id}
                                    className="flex items-center gap-2 border border-muted px-2 py-1 text-[11px] shrink-0"
                                >
                                    <Paperclip size={11} className="text-terminal" />
                                    <a
                                        href={attachment.dataUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="hover:text-foreground text-muted-foreground max-w-[220px] truncate"
                                        title={attachment.name}
                                    >
                                        {attachment.name}
                                    </a>
                                    <button
                                        onClick={() => removeAttachment(activeBook.id, attachment.id)}
                                        className="text-muted-foreground/60 hover:text-destructive"
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
