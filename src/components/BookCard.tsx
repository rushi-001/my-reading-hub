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
    Heart,
} from "lucide-react";
import { useBooks } from "@/store/bookStore";
import type { Book } from "@/types/book";
import { useNavigate } from "react-router-dom";

const FORMAT_LABEL: Record<string, string> = {
    pdf: "PDF",
    epub: "EPUB",
    audio: "AUDIO",
    video: "VIDEO",
    podcast: "PODCAST",
    url: "URL",
};

const FORMAT_ICON: Record<string, React.ReactNode> = {
    pdf: <FileText size={15} />,
    epub: <BookOpen size={15} />,
    audio: <Headphones size={15} />,
    video: <Play size={15} />,
    podcast: <Headphones size={15} />,
    url: <BookOpen size={15} />,
};

export function BookCard({
    book,
    onEdit,
}: {
    book: Book;
    onEdit: (book: Book) => void;
}) {
    const { openBook, deleteBook, toggleFavorite } = useBooks();
    const navigate = useNavigate();
    const [hover, setHover] = useState(false);

    const initials = book.title
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();

    const handleOpen = () => {
        openBook(book.id);
        navigate(`/reader/${book.id}`);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            className="group relative border border-muted bg-surface-1 cursor-pointer hover:border-muted-foreground transition-colors duration-100"
            onClick={handleOpen}
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

                {/* Format badge */}
                <div className="absolute top-2 left-2 flex items-center gap-1 bg-background/90 border border-muted px-1.5 py-1 text-[11px] text-muted-foreground font-mono uppercase tracking-wider">
                    {FORMAT_ICON[book.format]}
                    <span className="ml-0.5">{FORMAT_LABEL[book.format]}</span>
                </div>

                {/* Favorite indicator on cover */}
                {book.isFavorite && (
                    <div className="absolute top-2 right-2">
                        <Heart size={12} className="fill-terminal text-terminal" />
                    </div>
                )}

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
                <div className="flex flex-row justify-between items-start gap-1">
                    <div className="min-w-0 flex-1">
                        <h3 className="text-[12px] font-medium text-foreground truncate leading-snug">
                            {book.title}
                        </h3>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {book.author}
                        </p>
                    </div>

                    {/* Favorite button */}
                    <button
                        className={`shrink-0 border p-1 transition-colors ${
                            book.isFavorite
                                ? "border-terminal text-terminal bg-terminal/10"
                                : "border-muted text-muted-foreground hover:text-foreground hover:border-muted-foreground bg-background"
                        }`}
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(book.id);
                        }}
                        title={book.isFavorite ? "Remove from favorites" : "Add to favorites"}
                    >
                        <Heart
                            size={12}
                            className={book.isFavorite ? "fill-current" : ""}
                        />
                    </button>
                </div>

                {/* Stars */}
                {book.rating > 0 && (
                    <div className="flex gap-0.5 mt-1.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                                key={i}
                                size={10}
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
                <div className="mt-2 flex items-center gap-1.5">
                    <div className="flex-1 h-px bg-muted overflow-hidden">
                        <div
                            className="h-full bg-terminal transition-all duration-300"
                            style={{ width: `${book.progress}%` }}
                        />
                    </div>
                    <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                        {book.progress}%
                    </span>
                </div>
            </div>

            {/* Card actions — appear on hover */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!book.isFavorite && (
                    <button
                        className="bg-background border border-muted p-1 text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(book);
                        }}
                        title="Edit book"
                    >
                        <Edit3 size={13} />
                    </button>
                )}
                {book.isFavorite && (
                    <button
                        className="bg-background border border-muted p-1 text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(book);
                        }}
                        title="Edit book"
                    >
                        <Edit3 size={13} />
                    </button>
                )}
                <button
                    className="bg-background border border-muted p-1 text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        deleteBook(book.id);
                    }}
                    title="Delete book"
                >
                    <Trash2 size={13} />
                </button>
            </div>
        </motion.div>
    );
}
