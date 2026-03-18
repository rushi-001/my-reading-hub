import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Search, BookOpen, Command as CmdIcon, Heart, Layers, Calendar } from "lucide-react";
import { BookCard } from "@/components/BookCard";
import { BookStack } from "@/components/BookStack";
import { AddBookDrawer } from "@/components/AddBookDrawer";
import { EditBookDrawer } from "@/components/EditBookDrawer";
import { CalendarView } from "@/components/CalendarView";
import { useBooks } from "@/store/bookStore";
import { Book } from "@/types/book";

const FILTERS: { label: string; value: string }[] = [
    { label: "All", value: "all" },
    { label: "Favorites", value: "favorites" },
    { label: "PDF", value: "pdf" },
    { label: "EPUB", value: "epub" },
    { label: "Audio", value: "audio" },
    { label: "Video", value: "video" },
    { label: "Podcast", value: "podcast" },
];

export function LibraryView() {
    const { books, setCommandOpen, settings, currentView, setView } = useBooks();

    const [addOpen, setAddOpen] = useState(false);
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [editOpen, setEditOpen] = useState(false);
    const [editingBook, setEditingBook] = useState<Book | null>(null);

    const filtered = books.filter((b) => {
        if (filter === "favorites") return b.isFavorite;
        const matchFormat = filter === "all" || b.format === filter;
        const q = search.toLowerCase();
        const matchSearch =
            !q ||
            b.title.toLowerCase().includes(q) ||
            b.author.toLowerCase().includes(q) ||
            b.tags.some((t) => t.toLowerCase().includes(q));
        return matchFormat && matchSearch;
    }).filter((b) => {
        if (filter !== "favorites" && search) {
            const q = search.toLowerCase();
            return (
                b.title.toLowerCase().includes(q) ||
                b.author.toLowerCase().includes(q) ||
                b.tags.some((t) => t.toLowerCase().includes(q))
            );
        }
        return true;
    });

    // Deduplicated filtered list
    const deduped = Array.from(new Map(filtered.map((b) => [b.id, b])).values());

    const handleEditClick = (book: Book) => {
        setEditingBook(book);
        setEditOpen(true);
    };

    const inProgress = books.filter((b) => b.progress > 0 && b.progress < 100);

    // Group books by groupId for stack display
    const groupedBooks = (() => {
        if (!settings.stackGroups) return null;
        const groups: Record<string, Book[]> = {};
        const ungrouped: Book[] = [];
        deduped.forEach((b) => {
            if (b.groupId) {
                if (!groups[b.groupId]) groups[b.groupId] = [];
                groups[b.groupId].push(b);
            } else {
                ungrouped.push(b);
            }
        });
        return { groups, ungrouped };
    })();

    if (currentView === "calendar") {
        return (
            <div className="flex-1 min-h-0 overflow-y-auto p-8">
                <div className="flex items-center gap-3 mb-8">
                    <button
                        onClick={() => setView("library")}
                        className="text-muted-foreground hover:text-foreground transition-colors text-[12px] font-mono"
                    >
                        ← Library
                    </button>
                    <span className="text-muted-foreground/40">/</span>
                    <span className="text-[12px] font-mono">Reading Calendar</span>
                </div>
                <CalendarView />
            </div>
        );
    }

    return (
        <div className="flex-1 min-h-0 overflow-y-auto p-8">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                <div>
                    <h1 className="text-[12px] font-medium tracking-tight">Library</h1>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                        {books.length} books · {inProgress.length} in progress
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Inline search */}
                    <div className="flex items-center gap-2 border border-muted bg-surface-1 px-3 py-2">
                        <Search size={13} className="text-muted-foreground" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Filter library…"
                            className="bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground outline-none w-36 font-mono"
                        />
                    </div>

                    {/* Calendar */}
                    <button
                        onClick={() => setView("calendar")}
                        className="flex items-center gap-1.5 border border-muted px-3 py-2 text-[11px]
                          text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
                        title="Reading Calendar"
                    >
                        <Calendar size={13} />
                    </button>

                    {/* Spotlight hint */}
                    <button
                        onClick={() => setCommandOpen(true)}
                        className="flex items-center gap-1.5 border border-muted px-3 py-2 text-[11px]
                          text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
                        title="Open command palette"
                    >
                        <CmdIcon size={13} /> K
                    </button>

                    {/* Add book */}
                    <button
                        onClick={() => setAddOpen(true)}
                        className="flex items-center gap-2 bg-foreground text-background px-4 py-2 text-[12px]
                          font-medium hover:bg-terminal transition-colors"
                    >
                        <Plus size={13} /> Add Book
                    </button>
                </div>
            </div>

            {/* Format filters */}
            <div className="flex gap-1 mb-6 flex-wrap">
                {FILTERS.map((f) => (
                    <button
                        key={f.value}
                        onClick={() => setFilter(f.value)}
                        className={`flex items-center gap-1 px-3 py-1.5 text-[11px] uppercase tracking-wider border transition-colors ${
                            filter === f.value
                                ? "border-terminal text-terminal"
                                : "border-muted text-muted-foreground hover:border-muted-foreground"
                        }`}
                    >
                        {f.value === "favorites" && <Heart size={11} />}
                        {f.value === "all" && <Layers size={11} />}
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Grid */}
            {deduped.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                    <BookOpen size={32} className="text-muted-foreground/30" />
                    <div>
                        <p className="text-[12px] text-muted-foreground">No books found</p>
                        <p className="text-[11px] text-muted-foreground/60 mt-1">
                            Press{" "}
                            <kbd className="border border-muted px-1 text-[10px]">+</kbd>{" "}
                            to add your first book
                        </p>
                    </div>
                    <button
                        onClick={() => setAddOpen(true)}
                        className="text-[12px] border border-muted px-4 py-2 text-muted-foreground
                          hover:border-muted-foreground hover:text-foreground transition-colors"
                    >
                        Add Book
                    </button>
                </div>
            ) : settings.stackGroups && groupedBooks ? (
                <AnimatePresence mode="popLayout">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {/* Render group stacks */}
                        {Object.entries(groupedBooks.groups).map(([gid, gbooks]) => (
                            <BookStack
                                key={gid}
                                books={gbooks}
                                maxVisible={settings.stackMaxVisible}
                                onEdit={handleEditClick}
                            />
                        ))}
                        {/* Render ungrouped books */}
                        {groupedBooks.ungrouped.map((book) => (
                            <BookCard key={book.id} book={book} onEdit={handleEditClick} />
                        ))}
                    </div>
                </AnimatePresence>
            ) : (
                <AnimatePresence mode="popLayout">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {deduped.map((book) => (
                            <BookCard key={book.id} book={book} onEdit={handleEditClick} />
                        ))}
                    </div>
                </AnimatePresence>
            )}

            {/* Add Drawer */}
            <AddBookDrawer open={addOpen} onClose={() => setAddOpen(false)} />

            {/* Edit Drawer */}
            <EditBookDrawer
                open={editOpen}
                onClose={() => { setEditOpen(false); setEditingBook(null); }}
                book={editingBook}
            />
        </div>
    );
}
