import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Command } from "cmdk";
import Fuse from "fuse.js";
import {
  BookOpen,
  Headphones,
  FileText,
  Search,
  Plus,
  ArrowRight,
  Star,
} from "lucide-react";
import { useBooks } from "@/store/bookStore";
import type { Book } from "@/types/book";

const FORMAT_ICONS = {
  pdf:     <FileText size={13} />,
  epub:    <BookOpen size={13} />,
  audio:   <Headphones size={13} />,
  video:   <Headphones size={13} />,
  podcast: <Headphones size={13} />,
  url:     <BookOpen size={13} />,
};

export function CommandPalette() {
  const {
    books,
    isCommandOpen,
    setCommandOpen,
    openBook,
    setView,
    addBook,
  } = useBooks();

  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const fuse = new Fuse(books, {
    keys: ["title", "author", "tags", "description"],
    threshold: 0.35,
  });

  const results: Book[] =
    query.trim().length > 0
      ? fuse.search(query).map((r) => r.item)
      : books.slice(0, 8);

  useEffect(() => {
    if (isCommandOpen) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandOpen]);

  const close = () => setCommandOpen(false);

  const handleSelect = (bookId: string) => {
    openBook(bookId);
    close();
  };

  return (
    <AnimatePresence>
      {isCommandOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="fixed inset-0 z-40 bg-black/80"
            onClick={close}
          />

          {/* Palette */}
          <motion.div
            key="palette"
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-[20vh] z-50 -translate-x-1/2 w-[640px] max-w-[95vw]"
          >
            <Command
              className="border border-muted bg-background overflow-hidden"
              shouldFilter={false}
            >
              {/* Input */}
              <div className="flex items-center border-b border-muted px-4 gap-3">
                <Search size={14} className="text-muted-foreground shrink-0" />
                <Command.Input
                  ref={inputRef}
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Search books, notes, authors…"
                  className="flex-1 bg-transparent py-4 text-sm text-foreground placeholder:text-muted-foreground outline-none font-mono"
                />
                <kbd className="text-[10px] text-muted-foreground border border-muted px-1.5 py-0.5 shrink-0">
                  ESC
                </kbd>
              </div>

              <Command.List className="max-h-[360px] overflow-y-auto p-1">
                {/* Navigation commands */}
                {query === "" && (
                  <Command.Group
                    heading={
                      <span className="px-3 py-1.5 text-[10px] tracking-widest text-muted-foreground uppercase">
                        Quick Navigation
                      </span>
                    }
                  >
                    <PaletteItem
                      icon={<BookOpen size={13} />}
                      label="Go to Library"
                      hint="view all books"
                      onSelect={() => { setView("library"); close(); }}
                    />
                    <PaletteItem
                      icon={<Plus size={13} />}
                      label="Add New Book"
                      hint="import or link"
                      onSelect={() => { setView("library"); close(); }}
                    />
                  </Command.Group>
                )}

                {/* Book results */}
                {results.length > 0 && (
                  <Command.Group
                    heading={
                      <span className="px-3 py-1.5 text-[10px] tracking-widest text-muted-foreground uppercase">
                        {query ? "Results" : "Recent Books"}
                      </span>
                    }
                  >
                    {results.map((book) => (
                      <Command.Item
                        key={book.id}
                        value={book.id}
                        onSelect={() => handleSelect(book.id)}
                        className="group flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-sm
                          text-muted-foreground hover:bg-foreground hover:text-background
                          aria-selected:bg-foreground aria-selected:text-background
                          transition-colors duration-75"
                      >
                        <span className="shrink-0 opacity-60">
                          {FORMAT_ICONS[book.format]}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium truncate leading-tight">
                            {book.title}
                          </span>
                          <span className="block text-[11px] opacity-60 truncate">
                            {book.author}
                          </span>
                        </span>
                        {/* Progress */}
                        <span className="tabular-nums text-[11px] opacity-50 shrink-0">
                          {book.progress}%
                        </span>
                        {/* Rating stars */}
                        {book.rating > 0 && (
                          <span className="flex gap-0.5 shrink-0">
                            {Array.from({ length: book.rating }).map((_, i) => (
                              <Star key={i} size={9} className="fill-current text-terminal opacity-80" />
                            ))}
                          </span>
                        )}
                        <ArrowRight size={12} className="shrink-0 opacity-40" />
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {results.length === 0 && query.length > 0 && (
                  <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
                    No books found for "{query}"
                  </Command.Empty>
                )}
              </Command.List>

              {/* Footer */}
              <div className="border-t border-muted px-4 py-2 flex items-center gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <kbd className="border border-muted px-1">↑↓</kbd> navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="border border-muted px-1">↵</kbd> open
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="border border-muted px-1">Esc</kbd> close
                </span>
                <span className="ml-auto tabular-nums opacity-60">
                  {results.length} books
                </span>
              </div>
            </Command>
          </motion.div>
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
      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-sm
        text-muted-foreground hover:bg-foreground hover:text-background
        aria-selected:bg-foreground aria-selected:text-background
        transition-colors duration-75"
    >
      <span className="shrink-0 opacity-60">{icon}</span>
      <span className="flex-1 text-sm">{label}</span>
      {hint && (
        <span className="text-[11px] opacity-40">{hint}</span>
      )}
      <ArrowRight size={12} className="opacity-40 shrink-0" />
    </Command.Item>
  );
}
