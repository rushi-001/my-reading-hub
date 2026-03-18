import { motion } from "framer-motion";
import { BookOpen, Layers } from "lucide-react";
import { useBooks } from "@/store/bookStore";
import type { Book } from "@/types/book";

interface Props {
    books: Book[];
    maxVisible: number;
    onEdit: (book: Book) => void;
}

export function BookStack({ books, maxVisible, onEdit }: Props) {
    const { openBook } = useBooks();
    const visible = books.slice(0, Math.min(maxVisible, 5));
    const topBook = visible[0];
    const count = books.length;

    return (
        <div
            className="relative cursor-pointer group"
            style={{ paddingBottom: `${(visible.length - 1) * 6}px`, paddingRight: `${(visible.length - 1) * 6}px` }}
            onClick={() => openBook(topBook.id)}
        >
            {/* Stack layers (back to front) */}
            {visible.slice(1).reverse().map((book, i) => {
                const depth = visible.length - 1 - i;
                return (
                    <div
                        key={book.id}
                        className="absolute inset-0 border border-muted bg-surface-2"
                        style={{
                            transform: `translate(${depth * 5}px, ${depth * 5}px)`,
                            zIndex: depth,
                        }}
                    />
                );
            })}

            {/* Top book */}
            <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative border border-muted bg-surface-1 hover:border-muted-foreground transition-colors"
                style={{ zIndex: visible.length }}
            >
                {/* Cover area */}
                <div className="relative aspect-[2/3] overflow-hidden bg-surface-2">
                    {topBook.cover ? (
                        <img src={topBook.cover} alt={topBook.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <span className="text-2xl font-bold text-muted-foreground/30">
                                {topBook.title.slice(0, 2).toUpperCase()}
                            </span>
                        </div>
                    )}
                    {topBook.groupId && (
                        <div className="absolute top-2 left-2 bg-background/90 border border-muted px-1.5 py-0.5 text-[9px] text-muted-foreground font-mono truncate max-w-[70%]">
                            {topBook.groupId}
                        </div>
                    )}
                    {/* Stack count badge */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-background/90 border border-muted px-1.5 py-0.5 text-[10px] text-terminal font-mono">
                        <Layers size={10} />
                        {count}
                    </div>
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-xs font-mono text-foreground border border-foreground px-3 py-1">
                            Open
                        </span>
                    </div>
                </div>

                {/* Meta */}
                <div className="p-2 border-t border-muted">
                    <h3 className="text-[11px] font-medium text-foreground truncate">{topBook.title}</h3>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">{count} books</p>
                    <div className="mt-1.5 h-px bg-muted overflow-hidden">
                        <div
                            className="h-full bg-terminal"
                            style={{ width: `${topBook.progress}%` }}
                        />
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
