import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Command } from "cmdk";
import Fuse from "fuse.js";
import {
    ArrowRight,
    BookOpen,
    Clock,
    FileText,
    Headphones,
    Play,
    Plus,
    Search,
    Settings,
    Star,
} from "lucide-react";
import { useBooks } from "@/store/bookStore";
import type { AppSettings, Book } from "@/types/book";
import { useNavigate } from "react-router-dom";

const FORMAT_ICONS: Record<string, React.ReactNode> = {
    pdf: <FileText size={15} />,
    epub: <BookOpen size={15} />,
    audio: <Headphones size={15} />,
    video: <Play size={15} />,
    podcast: <Headphones size={15} />,
    url: <BookOpen size={15} />,
};

const PALETTE_ANCHOR_CLASS: Record<AppSettings["commandPalettePosition"], string> = {
    "top-left": "items-start justify-start sm:pt-8",
    "top-center": "items-start justify-center sm:pt-8",
    "top-right": "items-start justify-end sm:pt-8",
    "center-left": "items-center justify-start",
    "center-center": "items-center justify-center",
    "center-right": "items-center justify-end",
    "bottom-left": "items-end justify-start sm:pb-8",
    "bottom-center": "items-end justify-center sm:pb-8",
    "bottom-right": "items-end justify-end sm:pb-8",
};

export function CommandPalette() {
    const {
        books,
        isCommandOpen,
        setCommandOpen,
        openBook,
        getLastReadBook,
        settings,
        setSettingsOpen,
        setAddBookOpen,
    } = useBooks();
    const navigate = useNavigate();

    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const fuse = new Fuse(books, {
        keys: ["title", "author", "tags", "description"],
        threshold: 0.35,
    });

    const searchResults: Book[] =
        query.trim().length > 0
            ? fuse.search(query).map((result) => result.item)
            : books.slice(0, 8);

    useEffect(() => {
        if (!isCommandOpen) return;
        setQuery("");
        setTimeout(() => inputRef.current?.focus(), 50);
    }, [isCommandOpen]);

    const close = () => setCommandOpen(false);

    const openBookFromPalette = (bookId: string) => {
        openBook(bookId);
        navigate(`/reader/${bookId}`);
        close();
    };

    const lastRead = getLastReadBook();
    const anchorClass =
        PALETTE_ANCHOR_CLASS[settings.commandPalettePosition] ??
        PALETTE_ANCHOR_CLASS["top-center"];
    const enterOffsetY = settings.commandPalettePosition.startsWith("bottom") ? 8 : -8;

    return (
        <AnimatePresence>
            {isCommandOpen && (
                <>
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                        className="fixed inset-0 z-40 bg-black/80"
                        onClick={close}
                    />

                    <div
                        className={`fixed inset-0 z-50 flex p-4 pointer-events-none sm:p-6 ${anchorClass}`}
                    >
                        <motion.div
                            key="palette"
                            initial={{ opacity: 0, scale: 0.97, y: enterOffsetY }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.97, y: enterOffsetY }}
                            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                            className="w-[640px] max-w-[95vw] pointer-events-auto"
                        >
                            <Command
                                className="border border-muted bg-background overflow-hidden"
                                shouldFilter={false}
                            >
                                <div className="flex items-center border-b border-muted px-4 gap-3">
                                    <Search size={15} className="text-muted-foreground shrink-0" />
                                    <Command.Input
                                        ref={inputRef}
                                        value={query}
                                        onValueChange={setQuery}
                                        placeholder="Search books, authors, tags..."
                                        className="flex-1 bg-transparent py-4 text-[12px] text-foreground placeholder:text-muted-foreground outline-none font-mono"
                                    />
                                    <kbd className="text-[10px] text-muted-foreground border border-muted px-1.5 py-0.5 shrink-0">
                                        ESC
                                    </kbd>
                                </div>

                                <Command.List className="max-h-[400px] overflow-y-auto p-1">
                                    {/* Always-visible global actions */}
                                    <Command.Group
                                        heading={
                                            <span className="px-3 py-1.5 text-[10px] tracking-widest text-muted-foreground uppercase block">
                                                Quick Actions
                                            </span>
                                        }
                                    >
                                        <PaletteItem
                                            icon={settings.showIcons ? <BookOpen size={15} /> : null}
                                            label="Go to Library"
                                            hint="view all books"
                                            onSelect={() => {
                                                navigate("/library");
                                                close();
                                            }}
                                        />
                                        <PaletteItem
                                            icon={settings.showIcons ? <Plus size={15} /> : null}
                                            label="Add New Book"
                                            hint="open drawer"
                                            onSelect={() => {
                                                navigate("/library");
                                                setAddBookOpen(true);
                                                close();
                                            }}
                                        />
                                        <PaletteItem
                                            icon={settings.showIcons ? <BookOpen size={15} /> : null}
                                            label="Reading Calendar"
                                            hint="activity and history"
                                            onSelect={() => {
                                                navigate("/calendar");
                                                close();
                                            }}
                                        />
                                        {lastRead && (
                                            <PaletteItem
                                                icon={settings.showIcons ? <Clock size={15} /> : null}
                                                label={`Continue: ${lastRead.title}`}
                                                hint={`${lastRead.progress}% - ${lastRead.author}`}
                                                onSelect={() => openBookFromPalette(lastRead.id)}
                                            />
                                        )}
                                        <PaletteItem
                                            icon={settings.showIcons ? <Settings size={15} /> : null}
                                            label="Settings"
                                            hint="Cmd/Ctrl + ,"
                                            onSelect={() => {
                                                setSettingsOpen(true);
                                                close();
                                            }}
                                        />
                                    </Command.Group>

                                    {searchResults.length > 0 && (
                                        <Command.Group
                                            heading={
                                                <span className="px-3 py-1.5 text-[10px] tracking-widest text-muted-foreground uppercase block">
                                                    {query ? "Results" : "Recent Books"}
                                                </span>
                                            }
                                        >
                                            {searchResults.map((book) => (
                                                <Command.Item
                                                    key={book.id}
                                                    value={book.id}
                                                    onSelect={() => openBookFromPalette(book.id)}
                                                    className="group flex items-center gap-3 px-3 py-2.5 cursor-pointer text-muted-foreground hover:bg-foreground hover:text-background aria-selected:bg-foreground aria-selected:text-background transition-colors duration-75"
                                                >
                                                    {settings.showIcons && (
                                                        <span className="shrink-0 opacity-60">
                                                            {FORMAT_ICONS[book.format]}
                                                        </span>
                                                    )}
                                                    <span className="flex-1 min-w-0">
                                                        <span className="block text-[12px] font-medium truncate leading-tight">
                                                            {book.title}
                                                        </span>
                                                        <span className="block text-[11px] opacity-60 truncate">
                                                            {book.author}
                                                        </span>
                                                    </span>
                                                    <span className="tabular-nums text-[11px] opacity-50 shrink-0">
                                                        {book.progress}%
                                                    </span>
                                                    {book.rating > 0 && (
                                                        <span className="flex gap-0.5 shrink-0">
                                                            {Array.from({ length: book.rating }).map((_, index) => (
                                                                <Star
                                                                    key={index}
                                                                    size={10}
                                                                    className="fill-current text-terminal opacity-80"
                                                                />
                                                            ))}
                                                        </span>
                                                    )}
                                                    <ArrowRight size={13} className="shrink-0 opacity-40" />
                                                </Command.Item>
                                            ))}
                                        </Command.Group>
                                    )}

                                    {searchResults.length === 0 && query.length > 0 && (
                                        <Command.Empty className="py-8 text-center text-[12px] text-muted-foreground">
                                            No books found for "{query}"
                                        </Command.Empty>
                                    )}
                                </Command.List>

                                <div className="border-t border-muted px-4 py-2 flex items-center gap-4 text-[10px] text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <kbd className="border border-muted px-1">Up/Down</kbd> navigate
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <kbd className="border border-muted px-1">Enter</kbd> open
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <kbd className="border border-muted px-1">Esc</kbd> close
                                    </span>
                                    <span className="ml-auto tabular-nums opacity-60">
                                        {searchResults.length} books
                                    </span>
                                </div>
                            </Command>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}

function PaletteItem({
    icon,
    label,
    hint,
    onSelect,
}: {
    icon: React.ReactNode;
    label: string;
    hint?: string;
    onSelect: () => void;
}) {
    return (
        <Command.Item
            onSelect={onSelect}
            className="flex items-center gap-3 px-3 py-2.5 cursor-pointer text-muted-foreground hover:bg-foreground hover:text-background aria-selected:bg-foreground aria-selected:text-background transition-colors duration-75"
        >
            {icon && <span className="shrink-0 opacity-60">{icon}</span>}
            <span className="flex-1 text-[12px]">{label}</span>
            {hint && <span className="text-[11px] opacity-40">{hint}</span>}
            <ArrowRight size={13} className="opacity-40 shrink-0" />
        </Command.Item>
    );
}
