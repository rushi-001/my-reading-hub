import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
    BookOpen,
    Calendar,
    Command as CmdIcon,
    Heart,
    Layers,
    Plus,
    Search,
} from "lucide-react";
import { AddBookDrawer } from "@/components/AddBookDrawer";
import { BookCard } from "@/components/BookCard";
import { BookStack } from "@/components/BookStack";
import { EditBookDrawer } from "@/components/EditBookDrawer";
import { matchesBookQuery, parseBookQuery } from "@/lib/bookSearch";
import { useBooks } from "@/store/bookStore";
import type { Book } from "@/types/book";
import { useNavigate } from "react-router-dom";

const FILTERS: Array<{ label: string; value: string }> = [
    { label: "All", value: "all" },
    { label: "Favorites", value: "favorites" },
    { label: "PDF", value: "pdf" },
    { label: "EPUB", value: "epub" },
    { label: "Audio", value: "audio" },
    { label: "Video", value: "video" },
    { label: "Podcast", value: "podcast" },
];

export function LibraryView() {
    const {
        books,
        settings,
        updateSettings,
        setCommandOpen,
        isAddBookOpen,
        setAddBookOpen,
    } = useBooks();
    const navigate = useNavigate();

    // Local UI state for filters/search/edit drawer.
    const [filter, setFilter] = useState("all");
    const [groupFilter, setGroupFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [editOpen, setEditOpen] = useState(false);
    const [editingBook, setEditingBook] = useState<Book | null>(null);

    const parsedQuery = useMemo(() => parseBookQuery(search), [search]);
    const groupOptions = useMemo(
        () =>
            Array.from(
                new Set(
                    books
                        .map((book) => book.groupId)
                        .filter((group): group is string => Boolean(group)),
                ),
            ).sort((a, b) => a.localeCompare(b)),
        [books],
    );

    const filtered = books.filter((book) => {
        const matchesFilter =
            filter === "all"
                ? true
                : filter === "favorites"
                  ? book.isFavorite
                  : book.format === filter;
        const matchesGroup =
            groupFilter === "all" ? true : book.groupId === groupFilter;
        const matchesSearch = matchesBookQuery(book, parsedQuery);
        return matchesFilter && matchesGroup && matchesSearch;
    });

    // Deduplicate books by id before rendering cards/stacks.
    const deduped = Array.from(new Map(filtered.map((book) => [book.id, book])).values());
    const inProgress = books.filter((book) => book.progress > 0 && book.progress < 100);

    const groupedBooks = (() => {
        if (!settings.stackGroups) return null;
        const groups: Record<string, Book[]> = {};
        const ungrouped: Book[] = [];
        for (const book of deduped) {
            if (!book.groupId) {
                ungrouped.push(book);
                continue;
            }
            if (!groups[book.groupId]) groups[book.groupId] = [];
            groups[book.groupId].push(book);
        }
        return { groups, ungrouped };
    })();

    const handleEditClick = (book: Book) => {
        setEditingBook(book);
        setEditOpen(true);
    };

    return (
        <div className="flex-1 min-h-0 overflow-y-auto p-8">
            {/* Top bar with search/actions */}
            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                <div>
                    <h1 className="text-[12px] font-medium tracking-tight">Library</h1>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                        {books.length} books - {inProgress.length} in progress
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Search input targeted by "/" keyboard shortcut */}
                    <div className="flex items-center gap-2 border border-muted bg-surface-1 px-3 py-2">
                        <Search size={13} className="text-muted-foreground" />
                        <input
                            data-library-search="true"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Filter library (try #tag or tag:focus)"
                            className="bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground outline-none w-40 font-mono"
                        />
                    </div>

                    <button
                        onClick={() => navigate("/calendar")}
                        className="flex items-center gap-1.5 border border-muted px-3 py-2 text-[11px] text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
                        title="Reading Calendar"
                    >
                        <Calendar size={13} />
                    </button>

                    <button
                        onClick={() => setCommandOpen(true)}
                        className="flex items-center gap-1.5 border border-muted px-3 py-2 text-[11px] text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
                        title="Open command palette"
                    >
                        <CmdIcon size={13} /> K
                    </button>

                    <button
                        onClick={() =>
                            updateSettings({ stackGroups: !settings.stackGroups })
                        }
                        className={`flex items-center gap-1.5 border px-3 py-2 text-[11px] transition-colors ${
                            settings.stackGroups
                                ? "border-terminal text-terminal"
                                : "border-muted text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                        }`}
                        title="Toggle grouped stacks"
                    >
                        <Layers size={13} />
                    </button>

                    <button
                        onClick={() => setAddBookOpen(true)}
                        className="flex items-center gap-2 bg-foreground text-background px-4 py-2 text-[12px] font-medium hover:bg-terminal transition-colors"
                    >
                        <Plus size={13} /> Add Book
                    </button>
                </div>
            </div>

            {/* Format/favorites filters */}
            <div className="flex gap-1 mb-6 flex-wrap">
                {FILTERS.map((filterOption) => (
                    <button
                        key={filterOption.value}
                        onClick={() => setFilter(filterOption.value)}
                        className={`flex items-center gap-1 px-3 py-1.5 text-[11px] uppercase tracking-wider border transition-colors ${
                            filter === filterOption.value
                                ? "border-terminal text-terminal"
                                : "border-muted text-muted-foreground hover:border-muted-foreground"
                        }`}
                    >
                        {filterOption.value === "favorites" && <Heart size={11} />}
                        {filterOption.value === "all" && <Layers size={11} />}
                        {filterOption.label}
                    </button>
                ))}
            </div>

            {/* Group filters */}
            {groupOptions.length > 0 && (
                <div className="flex gap-1 mb-6 flex-wrap">
                    <button
                        onClick={() => setGroupFilter("all")}
                        className={`px-3 py-1.5 text-[11px] uppercase tracking-wider border transition-colors ${
                            groupFilter === "all"
                                ? "border-terminal text-terminal"
                                : "border-muted text-muted-foreground hover:border-muted-foreground"
                        }`}
                    >
                        All Groups
                    </button>
                    {groupOptions.map((groupName) => (
                        <button
                            key={groupName}
                            onClick={() => setGroupFilter(groupName)}
                            className={`px-3 py-1.5 text-[11px] border transition-colors ${
                                groupFilter === groupName
                                    ? "border-terminal text-terminal"
                                    : "border-muted text-muted-foreground hover:border-muted-foreground"
                            }`}
                        >
                            {groupName}
                        </button>
                    ))}
                </div>
            )}

            {/* Card/stacks grid */}
            {deduped.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                    <BookOpen size={32} className="text-muted-foreground/30" />
                    <div>
                        <p className="text-[12px] text-muted-foreground">No books found</p>
                        <p className="text-[11px] text-muted-foreground/60 mt-1">
                            Press <kbd className="border border-muted px-1 text-[10px]">Alt+N</kbd> to add a new book
                        </p>
                    </div>
                    <button
                        onClick={() => setAddBookOpen(true)}
                        className="text-[12px] border border-muted px-4 py-2 text-muted-foreground hover:border-muted-foreground hover:text-foreground transition-colors"
                    >
                        Add Book
                    </button>
                </div>
            ) : settings.stackGroups && groupedBooks ? (
                <AnimatePresence mode="popLayout">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {Object.entries(groupedBooks.groups)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([groupId, groupBooks]) => (
                            <BookStack
                                key={groupId}
                                books={groupBooks}
                                maxVisible={settings.stackMaxVisible}
                            />
                        ))}
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

            {/* Drawers are intentionally not routes. */}
            <AddBookDrawer open={isAddBookOpen} onClose={() => setAddBookOpen(false)} />
            <EditBookDrawer
                open={editOpen}
                onClose={() => {
                    setEditOpen(false);
                    setEditingBook(null);
                }}
                book={editingBook}
            />
        </div>
    );
}
