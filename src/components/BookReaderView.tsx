import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft, FileText, Headphones, BookOpen,
  StickyNote, Bookmark, BookmarkCheck, Play, ChevronUp, ChevronDown,
} from "lucide-react";
import { PDFReader } from "@/components/PDFReader";
import { NoteEditor } from "@/components/NoteEditor";
import { useBooks } from "@/store/bookStore";
import { ProgressRing, StarRating } from "@/components/ui/BookUI";

export function BookReaderView() {
  const { activeBook, closeBook, showNotes, setShowNotes, updateBook, setAudioUrl, setPlaying, addBookmark, removeBookmark, settings } = useBooks();
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [autoScroll, setAutoScroll] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const isAudio = activeBook ? ["audio", "video", "podcast"].includes(activeBook.format) : false;
  const bookmarks = activeBook?.bookmarks || [];

  const handlePlayAudio = () => {
    if (activeBook.audioUrl) {
      setAudioUrl(activeBook.audioUrl);
      setPlaying(true);
    }
  };

  const clearAutoScrollTimer = () => {
    if (scrollTimer.current) {
      clearInterval(scrollTimer.current);
      scrollTimer.current = null;
    }
  };

  const getScrollTarget = () => {
    if (!scrollRef.current) return null;
    const pdfScrollEl = scrollRef.current.querySelector<HTMLElement>(
      ".rpv-core__inner-pages, .rpv-core__inner-page-container--single",
    );
    return pdfScrollEl ?? scrollRef.current;
  };

  // Auto-scroll logic (works for both regular overflow and PDF viewer inner scroller)
  useEffect(() => {
    const speed = settings.autoScrollSpeed;
    if (autoScroll && speed > 0) {
      const px = speed * 0.4;
      scrollTimer.current = setInterval(() => {
        const target = getScrollTarget();
        if (!target) return;

        const maxTop = Math.max(0, target.scrollHeight - target.clientHeight);
        const nextTop = Math.min(maxTop, target.scrollTop + px);
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
  }, [autoScroll, settings.autoScrollSpeed, showNotes, activeBook?.id]);

  // If speed is turned off in settings while scrolling, keep UI state in sync
  useEffect(() => {
    if (settings.autoScrollSpeed === 0 && autoScroll) {
      setAutoScroll(false);
    }
  }, [settings.autoScrollSpeed, autoScroll]);

  

  const handleAddBookmark = () => {
    addBookmark(activeBook.id, {
      type: "line",
      page: activeBook.currentPage || 0,
      text: `Page ${activeBook.currentPage || 0} bookmark`,
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Reader toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-muted bg-surface-1 shrink-0 flex-wrap">
        <button onClick={closeBook} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={15} />
        </button>

        {/* Cover thumbnail */}
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
          <span className="text-[11px] text-muted-foreground truncate block">{activeBook.author}</span>
        </div>

        <span className="tabular-nums text-[12px] text-terminal shrink-0">{activeBook.progress}%</span>

        {/* Auto-scroll toggle */}
        {settings.autoScrollSpeed > 0 && (
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`flex items-center gap-1 border px-2 py-1 text-[11px] transition-colors ${
              autoScroll ? "border-terminal text-terminal" : "border-muted text-muted-foreground hover:border-muted-foreground"
            }`}
            title="Toggle auto-scroll"
          >
            {autoScroll ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
            Scroll
          </button>
        )}

        {/* Bookmark add */}
        <button
          onClick={handleAddBookmark}
          className="flex items-center gap-1 border border-muted px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
          title="Add bookmark at current page"
        >
          <Bookmark size={12} /> Mark
        </button>

        {/* Bookmarks list toggle */}
        {bookmarks.length > 0 && (
          <button
            onClick={() => setShowBookmarks(!showBookmarks)}
            className={`flex items-center gap-1 border px-2 py-1 text-[11px] transition-colors ${
              showBookmarks ? "border-terminal text-terminal" : "border-muted text-muted-foreground hover:border-muted-foreground"
            }`}
            title="Show bookmarks"
          >
            <BookmarkCheck size={12} /> {bookmarks.length}
          </button>
        )}

        {/* Audio play */}
        {(isAudio || activeBook.audioUrl) && (
          <button
            onClick={handlePlayAudio}
            className="flex items-center gap-1 border border-muted px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
          >
            <Headphones size={12} /> Play
          </button>
        )}

        {/* Notes toggle */}
        <button
          onClick={() => setShowNotes(!showNotes)}
          className={`flex items-center gap-1 border px-2 py-1 text-[11px] transition-colors ${
            showNotes ? "border-terminal text-terminal" : "border-muted text-muted-foreground hover:text-foreground hover:border-muted-foreground"
          }`}
        >
          <StickyNote size={12} /> Notes
        </button>
      </div>

      {/* Bookmarks panel */}
      {showBookmarks && bookmarks.length > 0 && (
        <div className="border-b border-muted bg-surface-1 px-4 py-2 flex gap-2 overflow-x-auto shrink-0">
          {bookmarks.map((bm) => (
            <div key={bm.id} className="flex items-center gap-1.5 border border-muted px-2 py-1 text-[11px] text-muted-foreground shrink-0">
              <BookmarkCheck size={11} className="text-terminal" />
              <span className="font-mono">{bm.text}</span>
              <button
                onClick={() => removeBookmark(activeBook.id, bm.id)}
                className="text-muted-foreground/50 hover:text-destructive ml-1"
              >×</button>
            </div>
          ))}
        </div>
      )}

      {/* Main reading area */}
      <div className="flex flex-1 min-h-0">
        <div ref={scrollRef} className={`${showNotes ? "w-1/2" : "flex-1"} overflow-auto`} style={{ minHeight: 0 }}>
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
                  <p className="text-[12px] text-muted-foreground max-w-md mt-3 leading-relaxed">{activeBook.description}</p>
                )}
                <div className="flex justify-center mt-2">
                  <StarRating value={activeBook.rating} onChange={(r) => updateBook(activeBook.id, { rating: r })} />
                </div>
              </div>
              <button
                onClick={handlePlayAudio}
                className="flex items-center gap-2 bg-terminal text-background px-6 py-3 text-[12px] font-medium hover:opacity-90 transition-opacity"
              >
                <Play size={15} /> Play Audio
              </button>
              {activeBook.audioUrl && (
                <p className="text-[10px] text-muted-foreground/60 font-mono max-w-xs truncate">{activeBook.audioUrl}</p>
              )}
            </div>
          ) : activeBook.fileUrl ? (
            <PDFReader fileUrl={activeBook.fileUrl} bookId={activeBook.id} initialPage={activeBook.currentPage} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
              <FileText size={32} className="text-muted-foreground/30" />
              <p className="text-[12px] text-muted-foreground">No file attached to this book.</p>
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
