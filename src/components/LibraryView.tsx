import { useEffect, useMemo, useState } from "react";
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
import { EditBookDrawer } from "@/components/EditBookDrawer";
import { useBooks } from "@/store/bookStore";
import type { Book } from "@/types/book";
import { useNavigate } from "react-router-dom";

const FILTERS: Array<{ label: string; value: "all" | "favorites" | Book["format"] }> = [
    { label: "All", value: "all" },
    { label: "Favorites", value: "favorites" },
    { label: "PDF", value: "pdf" },
    { label: "EPUB", value: "epub" },
    { label: "Audio", value: "audio" },
    { label: "Video", value: "video" },
    { label: "Podcast", value: "podcast" },
];

const PAGE_SIZE_OPTIONS = [12, 24, 48, 96] as const;

export function LibraryView() {
    const {
        books,
        library,
        settings,
        updateSettings,
        setCommandOpen,
        isAddBookOpen,
        setAddBookOpen,
        searchLibrary,
    } = useBooks();
    const navigate = useNavigate();

    // Local UI state for filters/search/edit drawer.
    const [filter, setFilter] = useState<"all" | "favorites" | Book["format"]>(
        "all",
    );
    const [groupFilter, setGroupFilter] = useState("all");
    const [searchInput, setSearchInput] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(24);
    const [editOpen, setEditOpen] = useState(false);
    const [editingBook, setEditingBook] = useState<Book | null>(null);

    // Debounce typing so library search API is not called on every keystroke.
    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setDebouncedSearch(searchInput.trim());
        }, 250);
        return () => window.clearTimeout(timeout);
    }, [searchInput]);

    // Reset to first page whenever filters or search query change.
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, filter, groupFilter, pageSize]);

    // Keep local page in sync with server-corrected page values.
    useEffect(() => {
        if (library.page !== page) {
            setPage(library.page);
        }
    }, [library.page, page]);

    // Server-driven library search + pagination.
    useEffect(() => {
        searchLibrary({
            query: debouncedSearch,
            filter,
            groupFilter,
            page,
            pageSize,
        });
    }, [debouncedSearch, filter, groupFilter, page, pageSize, searchLibrary]);

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

    // Deduplicate API items before rendering cards.
    const deduped = useMemo(
        () =>
            Array.from(
                new Map(library.items.map((book) => [book.id, book])).values(),
            ),
        [library.items],
    );
    const inProgress = deduped.filter((book) => book.progress > 0 && book.progress < 100);
    const totalPages = Math.max(1, library.totalPages);
    const currentPage = Math.min(Math.max(1, library.page), totalPages);
    const itemStart =
        library.totalItems === 0 ? 0 : (currentPage - 1) * library.pageSize + 1;
    const itemEnd = Math.min(currentPage * library.pageSize, library.totalItems);

    const pageButtons = useMemo(() => {
        if (totalPages <= 1) return [1];
        const pages: number[] = [1];
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);

        if (start > 2) {
            pages.push(-1);
        }

        for (let i = start; i <= end; i += 1) {
            pages.push(i);
        }

        if (end < totalPages - 1) {
            pages.push(-2);
        }

        pages.push(totalPages);
        return pages;
    }, [currentPage, totalPages]);

    // Stack mode now shows section-wise grouped books, including "No Group".
    const groupedSections = useMemo(() => {
        if (!settings.stackGroups) return [];
        const groupMap = new Map<string, Book[]>();
        const noGroup: Book[] = [];

        for (const book of deduped) {
            if (!book.groupId) {
                noGroup.push(book);
                continue;
            }
            const existing = groupMap.get(book.groupId) ?? [];
            existing.push(book);
            groupMap.set(book.groupId, existing);
        }

        const sections = Array.from(groupMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([groupName, sectionBooks]) => ({
                key: groupName,
                title: groupName,
                books: sectionBooks,
            }));

        if (noGroup.length > 0) {
            sections.push({
                key: "__no_group__",
                title: "No Group",
                books: noGroup,
            });
        }

        return sections;
    }, [deduped, settings.stackGroups]);

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
                        {library.totalItems} books - {inProgress.length} in progress
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Search input targeted by "/" keyboard shortcut */}
                    <div className="flex items-center gap-2 border border-muted bg-surface-1 px-3 py-2">
                        <Search size={13} className="text-muted-foreground" />
                        <input
                            data-library-search="true"
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
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
            {library.isLoading && deduped.length === 0 ? (
                <div className="py-12 text-[12px] text-muted-foreground">
                    Loading books...
                </div>
            ) : deduped.length === 0 ? (
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
            ) : settings.stackGroups ? (
                <AnimatePresence mode="popLayout">
                    <div className="space-y-8">
                        {groupedSections.map((section) => (
                            <section key={section.key}>
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground">
                                        {section.title}
                                    </h2>
                                    <span className="text-[10px] text-muted-foreground tabular-nums">
                                        {section.books.length}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                    {section.books.map((book) => (
                                        <BookCard
                                            key={book.id}
                                            book={book}
                                            onEdit={handleEditClick}
                                        />
                                    ))}
                                </div>
                            </section>
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

            {/* Server pagination controls */}
            {library.totalItems > 0 && (
                <div className="mt-8 border-t border-muted pt-4 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">
                            Rows per page
                        </span>
                        <select
                            value={pageSize}
                            onChange={(event) => setPageSize(Number(event.target.value))}
                            className="bg-surface-1 border border-muted px-2 py-1.5 text-[11px] text-foreground outline-none focus:border-muted-foreground"
                        >
                            {PAGE_SIZE_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                            {itemStart}-{itemEnd} of {library.totalItems}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setPage((current) => Math.max(current - 1, 1))}
                            disabled={!library.hasPrevPage || library.isLoading}
                            className="border border-muted px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:border-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            Prev
                        </button>

                        {pageButtons.map((pageButton, index) =>
                            pageButton < 0 ? (
                                <span
                                    key={`ellipsis-${index}`}
                                    className="px-2 text-[11px] text-muted-foreground"
                                >
                                    ...
                                </span>
                            ) : (
                                <button
                                    key={pageButton}
                                    onClick={() => setPage(pageButton)}
                                    disabled={library.isLoading}
                                    className={`border px-2.5 py-1.5 text-[11px] tabular-nums transition-colors ${
                                        pageButton === currentPage
                                            ? "border-terminal text-terminal"
                                            : "border-muted text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                                >
                                    {pageButton}
                                </button>
                            ),
                        )}

                        <button
                            onClick={() =>
                                setPage((current) => Math.min(current + 1, totalPages))
                            }
                            disabled={!library.hasNextPage || library.isLoading}
                            className="border border-muted px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:border-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
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
