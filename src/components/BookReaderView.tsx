import { useState } from "react";
import {
  ArrowLeft, FileText, Headphones, BookOpen,
  StickyNote, Edit3, Star, MoreHorizontal,
} from "lucide-react";
import { PDFReader } from "@/components/PDFReader";
import { NoteEditor } from "@/components/NoteEditor";
import { useBooks } from "@/store/bookStore";
import { ProgressRing, StarRating } from "@/components/ui/BookUI";

export function BookReaderView() {
  const { activeBook, closeBook, showNotes, setShowNotes, updateBook, setAudioUrl, setPlaying } = useBooks();
  const [editMeta, setEditMeta] = useState(false);

  if (!activeBook) return null;

  const isAudio = ["audio", "video", "podcast"].includes(activeBook.format);

  const handlePlayAudio = () => {
    if (activeBook.audioUrl) {
      setAudioUrl(activeBook.audioUrl);
      setPlaying(true);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Reader toolbar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-muted bg-surface-1 shrink-0">
        <button
          onClick={closeBook}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={13} />
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
          <span className="text-xs font-medium truncate block">{activeBook.title}</span>
          <span className="text-[10px] text-muted-foreground truncate block">{activeBook.author}</span>
        </div>

        {/* Progress */}
        <span className="tabular-nums text-[11px] text-terminal shrink-0">
          {activeBook.progress}%
        </span>

        {/* Audio play */}
        {(isAudio || activeBook.audioUrl) && (
          <button
            onClick={handlePlayAudio}
            className="flex items-center gap-1.5 border border-muted px-2.5 py-1 text-[10px] text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
          >
            <Headphones size={10} /> Play
          </button>
        )}

        {/* Notes toggle */}
        <button
          onClick={() => setShowNotes(!showNotes)}
          className={`flex items-center gap-1.5 border px-2.5 py-1 text-[10px] transition-colors ${
            showNotes
              ? "border-terminal text-terminal"
              : "border-muted text-muted-foreground hover:text-foreground hover:border-muted-foreground"
          }`}
        >
          <StickyNote size={10} /> Notes
        </button>
      </div>

      {/* Main reading area */}
      <div className="flex flex-1 min-h-0">
        {/* Reader */}
        <div className={showNotes ? "w-1/2" : "flex-1"} style={{ minHeight: 0 }}>
          {isAudio && !activeBook.fileUrl ? (
            /* Audio-only book: show metadata */
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
                <p className="text-sm text-muted-foreground">{activeBook.author}</p>
                {activeBook.description && (
                  <p className="text-xs text-muted-foreground max-w-md mt-3 leading-relaxed">
                    {activeBook.description}
                  </p>
                )}
                <div className="flex justify-center mt-2">
                  <StarRating
                    value={activeBook.rating}
                    onChange={(r) => updateBook(activeBook.id, { rating: r })}
                  />
                </div>
              </div>
              <button
                onClick={handlePlayAudio}
                className="flex items-center gap-2 bg-terminal text-background px-6 py-3 text-xs font-medium hover:opacity-90 transition-opacity"
              >
                <Headphones size={13} /> Play Audio
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
              initialPage={activeBook.currentPage}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
              <FileText size={32} className="text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No file attached to this book.</p>
            </div>
          )}
        </div>

        {/* Notes panel */}
        {showNotes && (
          <div className="w-1/2 min-h-0 overflow-hidden">
            <NoteEditor bookId={activeBook.id} />
          </div>
        )}
      </div>
    </div>
  );
}
