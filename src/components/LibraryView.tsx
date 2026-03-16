import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Search, BookOpen, Headphones, FileText, Command as CmdIcon } from "lucide-react";
import { BookCard } from "@/components/BookCard";
import { AddBookDrawer } from "@/components/AddBookDrawer";
import { useBooks } from "@/store/bookStore";
import type { BookFormat } from "@/types/book";

const FILTERS: { label: string; value: string }[] = [
  { label: "All",     value: "all"     },
  { label: "PDF",     value: "pdf"     },
  { label: "EPUB",    value: "epub"    },
  { label: "Audio",   value: "audio"   },
  { label: "Video",   value: "video"   },
  { label: "Podcast", value: "podcast" },
];

export function LibraryView() {
  const { books, setCommandOpen } = useBooks();
  const [addOpen, setAddOpen]     = useState(false);
  const [filter, setFilter]       = useState("all");
  const [search, setSearch]       = useState("");

  const filtered = books.filter((b) => {
    const matchFormat = filter === "all" || b.format === filter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.tags.some((t) => t.toLowerCase().includes(q));
    return matchFormat && matchSearch;
  });

  const inProgress = books.filter((b) => b.progress > 0 && b.progress < 100);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-8">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-sm font-medium tracking-tight">Library</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {books.length} books · {inProgress.length} in progress
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Inline search */}
          <div className="flex items-center gap-2 border border-muted bg-surface-1 px-3 py-2">
            <Search size={11} className="text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter library…"
              className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none w-40 font-mono"
            />
          </div>

          {/* Spotlight hint */}
          <button
            onClick={() => setCommandOpen(true)}
            className="flex items-center gap-1.5 border border-muted px-3 py-2 text-[10px]
              text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
          >
            <CmdIcon size={10} /> K
          </button>

          {/* Add book */}
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 bg-foreground text-background px-4 py-2 text-xs
              font-medium hover:bg-terminal transition-colors"
          >
            <Plus size={12} /> Add Book
          </button>
        </div>
      </div>

      {/* Format filters */}
      <div className="flex gap-1 mb-6 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 text-[10px] uppercase tracking-wider border transition-colors ${
              filter === f.value
                ? "border-terminal text-terminal"
                : "border-muted text-muted-foreground hover:border-muted-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <BookOpen size={32} className="text-muted-foreground/30" />
          <div>
            <p className="text-sm text-muted-foreground">No books yet</p>
            <p className="text-[11px] text-muted-foreground/60 mt-1">
              Press <kbd className="border border-muted px-1 text-[10px]">+</kbd> to add your first book
            </p>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="text-xs border border-muted px-4 py-2 text-muted-foreground
              hover:border-muted-foreground hover:text-foreground transition-colors"
          >
            Add Book
          </button>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filtered.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </AnimatePresence>
      )}

      <AddBookDrawer open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
