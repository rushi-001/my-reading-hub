import { useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Headphones,
  FileText,
  Star,
  Trash2,
  Edit3,
  Play,
} from "lucide-react";
import { ProgressRing } from "@/components/ui/BookUI";
import { useBooks } from "@/store/bookStore";
import type { Book } from "@/types/book";

const FORMAT_LABEL: Record<string, string> = {
  pdf:     "PDF",
  epub:    "EPUB",
  audio:   "AUDIO",
  video:   "VIDEO",
  podcast: "PODCAST",
  url:     "URL",
};

const FORMAT_ICON: Record<string, React.ReactNode> = {
  pdf:     <FileText size={10} />,
  epub:    <BookOpen size={10} />,
  audio:   <Headphones size={10} />,
  video:   <Play size={10} />,
  podcast: <Headphones size={10} />,
  url:     <BookOpen size={10} />,
};

export function BookCard({ book }: { book: Book }) {
  const { openBook, deleteBook } = useBooks();
  const [hover, setHover] = useState(false);

  const initials = book.title
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="group relative border border-muted bg-surface-1 cursor-pointer
        hover:border-muted-foreground transition-colors duration-100"
      onClick={() => openBook(book.id)}
    >
      {/* Cover area */}
      <div className="relative aspect-[2/3] overflow-hidden bg-surface-2">
        {book.cover ? (
          <img
            src={book.cover}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-3xl font-mono font-bold text-muted-foreground/30 select-none">
              {initials}
            </span>
          </div>
        )}

        {/* Progress ring overlay */}
        <div className="absolute bottom-2 right-2 w-10 h-10 relative">
          <ProgressRing progress={book.progress} size={40} stroke={1.5} />
          <span className="absolute inset-0 flex items-center justify-center text-[9px] tabular-nums text-terminal font-mono">
            {book.progress}
          </span>
        </div>

        {/* Format badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-background/90 border border-muted px-1.5 py-0.5 text-[9px] text-muted-foreground font-mono uppercase tracking-wider">
          {FORMAT_ICON[book.format]}
          {FORMAT_LABEL[book.format]}
        </div>

        {/* Hover overlay */}
        {hover && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-background/70 flex items-center justify-center"
          >
            <span className="text-xs font-mono text-foreground border border-foreground px-3 py-1">
              Open
            </span>
          </motion.div>
        )}
      </div>

      {/* Meta */}
      <div className="p-3 border-t border-muted">
        <h3 className="text-xs font-medium text-foreground truncate leading-snug">
          {book.title}
        </h3>
        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
          {book.author}
        </p>

        {/* Stars */}
        {book.rating > 0 && (
          <div className="flex gap-0.5 mt-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={8}
                className={
                  i < book.rating
                    ? "fill-terminal text-terminal"
                    : "text-muted-foreground/30"
                }
              />
            ))}
          </div>
        )}

        {/* Progress bar */}
        <div className="mt-2 h-px bg-muted overflow-hidden">
          <div
            className="h-full bg-terminal transition-all duration-300"
            style={{ width: `${book.progress}%` }}
          />
        </div>
      </div>

      {/* Delete button */}
      <button
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity
          bg-background border border-muted p-1 text-muted-foreground hover:text-foreground hover:border-foreground"
        onClick={(e) => {
          e.stopPropagation();
          deleteBook(book.id);
        }}
        title="Delete book"
      >
        <Trash2 size={10} />
      </button>
    </motion.div>
  );
}
