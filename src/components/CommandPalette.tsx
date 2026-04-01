import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Command } from "cmdk";
import {
    ArrowRight,
    BookOpen,
    Clock3,
    Download,
    FileText,
    Headphones,
    History,
    LogOut,
    Play,
    Plus,
    Search,
    Settings,
    Star,
    Upload,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
    formatSyncRelative,
    getLatestSyncTimestamp,
} from "@/lib/syncStatus";
import { useBooks } from "@/store/bookStore";
import type { AppSettings } from "@/types/book";

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
        commandSearch,
        searchCommandBooks,
        clearCommandSearch,
        settings,
        setSettingsOpen,
        setAddBookOpen,
        api,
        setSyncDialogAction,
        logout,
        auth,
    } = useBooks();
    const navigate = useNavigate();

    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const queryIsEmpty = query.trim().length === 0;
    const rankedBooks = useMemo(
        () => (queryIsEmpty ? books.slice(0, 8) : commandSearch.results),
        [books, commandSearch.results, queryIsEmpty],
    );
    const lastRead = getLastReadBook();
    const latestSync = useMemo(
        () => getLatestSyncTimestamp(api.lastPushedAt, api.lastPulledAt),
        [api.lastPulledAt, api.lastPushedAt],
    );
    const authLabel =
        auth.session?.username ?? auth.session?.name ?? auth.session?.id ?? "admin";

    useEffect(() => {
        if (!isCommandOpen) return;
        setQuery("");
        clearCommandSearch();
        setTimeout(() => inputRef.current?.focus(), 50);
    }, [clearCommandSearch, isCommandOpen]);

    useEffect(() => {
        if (!isCommandOpen) return;
        if (queryIsEmpty) {
            clearCommandSearch();
            return;
        }
        const timeout = window.setTimeout(() => {
            searchCommandBooks(query.trim(), 20);
        }, 220);
        return () => window.clearTimeout(timeout);
    }, [
        clearCommandSearch,
        isCommandOpen,
        query,
        queryIsEmpty,
        searchCommandBooks,
    ]);

    const close = () => setCommandOpen(false);

    const openBookFromPalette = (bookId: string) => {
        openBook(bookId);
        navigate(`/reader/${bookId}`);
        close();
    };

    const openSyncDialog = (action: "push" | "pull") => {
        if (api.isSyncing) return;
        setSyncDialogAction(action);
        close();
    };

    const handleLogout = async () => {
        await logout();
        navigate("/login", { replace: true });
        close();
    };

    const anchorClass =
        PALETTE_ANCHOR_CLASS[settings.commandPalettePosition] ??
        PALETTE_ANCHOR_CLASS["top-center"];
    const enterOffsetY = settings.commandPalettePosition.startsWith("bottom")
        ? 8
        : -8;

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
                        className={`fixed inset-0 z-50 flex pointer-events-none p-4 sm:p-6 ${anchorClass}`}
                    >
                        <motion.div
                            key="palette"
                            initial={{ opacity: 0, scale: 0.97, y: enterOffsetY }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.97, y: enterOffsetY }}
                            transition={{
                                duration: 0.15,
                                ease: [0.16, 1, 0.3, 1],
                            }}
                            className="pointer-events-auto w-[640px] max-w-[95vw]"
                        >
                            <Command
                                className="overflow-hidden border border-muted bg-background"
                                shouldFilter={false}
                            >
                                <div className="flex items-center gap-3 border-b border-muted px-4">
                                    <Search
                                        size={15}
                                        className="shrink-0 text-muted-foreground"
                                    />
                                    <Command.Input
                                        ref={inputRef}
                                        value={query}
                                        onValueChange={setQuery}
                                        placeholder="Search books, #tags, tag:focus, group:History..."
                                        className="flex-1 bg-transparent py-4 font-mono text-[12px] text-foreground outline-none placeholder:text-muted-foreground"
                                    />
                                    <kbd className="shrink-0 border border-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                        ESC
                                    </kbd>
                                </div>

                                <Command.List className="max-h-[400px] overflow-y-auto p-1">
                                    {queryIsEmpty && (
                                        <Command.Group
                                            heading={
                                                <span className="block px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                                                    Quick Actions
                                                </span>
                                            }
                                        >
                                            <PaletteItem
                                                icon={
                                                    settings.showIcons ? (
                                                        <BookOpen size={15} />
                                                    ) : null
                                                }
                                                label="Go to Library"
                                                hint="view all books"
                                                onSelect={() => {
                                                    navigate("/library");
                                                    close();
                                                }}
                                            />
                                            <PaletteItem
                                                icon={
                                                    settings.showIcons ? (
                                                        <Plus size={15} />
                                                    ) : null
                                                }
                                                label="Add New Book"
                                                hint="open drawer"
                                                onSelect={() => {
                                                    navigate("/library");
                                                    setAddBookOpen(true);
                                                    close();
                                                }}
                                            />
                                            <PaletteItem
                                                icon={
                                                    settings.showIcons ? (
                                                        <BookOpen size={15} />
                                                    ) : null
                                                }
                                                label="Reading Calendar"
                                                hint="activity and history"
                                                onSelect={() => {
                                                    navigate("/calendar");
                                                    close();
                                                }}
                                            />
                                            {lastRead && (
                                                <PaletteItem
                                                    icon={
                                                        settings.showIcons ? (
                                                            <Clock3 size={15} />
                                                        ) : null
                                                    }
                                                    label={`Continue: ${lastRead.title}`}
                                                    hint={`${lastRead.progress}% - ${lastRead.author}`}
                                                    onSelect={() =>
                                                        openBookFromPalette(
                                                            lastRead.id,
                                                        )
                                                    }
                                                />
                                            )}
                                            <PaletteItem
                                                icon={
                                                    settings.showIcons ? (
                                                        <Upload size={15} />
                                                    ) : null
                                                }
                                                label={
                                                    api.isSyncing &&
                                                    api.activeSyncAction === "push"
                                                        ? "Uploading to GitHub..."
                                                        : "Upload to GitHub"
                                                }
                                                hint={formatSyncRelative(
                                                    api.lastPushedAt,
                                                    "No uploads yet",
                                                )}
                                                onSelect={() => openSyncDialog("push")}
                                            />
                                            <PaletteItem
                                                icon={
                                                    settings.showIcons ? (
                                                        <Download size={15} />
                                                    ) : null
                                                }
                                                label={
                                                    api.isSyncing &&
                                                    api.activeSyncAction === "pull"
                                                        ? "Downloading from GitHub..."
                                                        : "Download from GitHub"
                                                }
                                                hint={formatSyncRelative(
                                                    api.lastPulledAt,
                                                    "No downloads yet",
                                                )}
                                                onSelect={() => openSyncDialog("pull")}
                                            />
                                            <PaletteItem
                                                icon={
                                                    settings.showIcons ? (
                                                        <History size={15} />
                                                    ) : null
                                                }
                                                label="Sync History"
                                                hint="recent GitHub commits"
                                                onSelect={() => {
                                                    navigate("/sync-history");
                                                    close();
                                                }}
                                            />
                                            <PaletteItem
                                                icon={
                                                    settings.showIcons ? (
                                                        <Settings size={15} />
                                                    ) : null
                                                }
                                                label="Settings"
                                                hint="Cmd/Ctrl + ,"
                                                onSelect={() => {
                                                    setSettingsOpen(true);
                                                    close();
                                                }}
                                            />
                                            <PaletteItem
                                                icon={
                                                    settings.showIcons ? (
                                                        <LogOut size={15} />
                                                    ) : null
                                                }
                                                label="Sign Out"
                                                hint={authLabel}
                                                onSelect={handleLogout}
                                            />
                                        </Command.Group>
                                    )}

                                    {rankedBooks.length > 0 && (
                                        <Command.Group
                                            heading={
                                                <span className="block px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                                                    {queryIsEmpty ? "Recent Books" : "Results"}
                                                </span>
                                            }
                                        >
                                            {rankedBooks.map((book) => (
                                                <Command.Item
                                                    key={book.id}
                                                    value={book.id}
                                                    onSelect={() =>
                                                        openBookFromPalette(book.id)
                                                    }
                                                    className="group flex cursor-pointer items-center gap-3 px-3 py-2.5 text-muted-foreground transition-colors duration-75 hover:bg-foreground hover:text-background aria-selected:bg-foreground aria-selected:text-background"
                                                >
                                                    {settings.showIcons && (
                                                        <span className="shrink-0 opacity-60">
                                                            {FORMAT_ICONS[book.format]}
                                                        </span>
                                                    )}
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block truncate text-[12px] font-medium leading-tight">
                                                            {book.title}
                                                        </span>
                                                        <span className="block truncate text-[11px] opacity-60">
                                                            {book.author}
                                                        </span>
                                                    </span>
                                                    <span className="shrink-0 text-[11px] tabular-nums opacity-50">
                                                        {book.progress}%
                                                    </span>
                                                    {book.rating > 0 && (
                                                        <span className="flex shrink-0 gap-0.5">
                                                            {Array.from({
                                                                length: book.rating,
                                                            }).map((_, index) => (
                                                                <Star
                                                                    key={index}
                                                                    size={10}
                                                                    className="fill-current text-terminal opacity-80"
                                                                />
                                                            ))}
                                                        </span>
                                                    )}
                                                    <ArrowRight
                                                        size={13}
                                                        className="shrink-0 opacity-40"
                                                    />
                                                </Command.Item>
                                            ))}
                                        </Command.Group>
                                    )}

                                    {rankedBooks.length === 0 && !queryIsEmpty && (
                                        <>
                                            {commandSearch.isLoading ? (
                                                <Command.Empty className="py-8 text-center text-[12px] text-muted-foreground">
                                                    Searching...
                                                </Command.Empty>
                                            ) : (
                                                <Command.Empty className="py-8 text-center text-[12px] text-muted-foreground">
                                                    No books found for "{query}"
                                                </Command.Empty>
                                            )}
                                        </>
                                    )}
                                </Command.List>

                                <div className="flex items-center gap-4 border-t border-muted px-4 py-2 text-[10px] text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <kbd className="border border-muted px-1">
                                            Up/Down
                                        </kbd>{" "}
                                        navigate
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <kbd className="border border-muted px-1">
                                            Enter
                                        </kbd>{" "}
                                        open
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <kbd className="border border-muted px-1">
                                            Esc
                                        </kbd>{" "}
                                        close
                                    </span>
                                    <span className="ml-auto tabular-nums opacity-60">
                                        {queryIsEmpty
                                            ? `${rankedBooks.length} books`
                                            : `${commandSearch.totalItems} matches`}
                                    </span>
                                    {queryIsEmpty && (
                                        <span className="opacity-60">
                                            {formatSyncRelative(
                                                latestSync,
                                                "No sync yet",
                                            )}
                                        </span>
                                    )}
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
            className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-muted-foreground transition-colors duration-75 hover:bg-foreground hover:text-background aria-selected:bg-foreground aria-selected:text-background"
        >
            {icon && <span className="shrink-0 opacity-60">{icon}</span>}
            <span className="flex-1 text-[12px]">{label}</span>
            {hint && <span className="text-[11px] opacity-40">{hint}</span>}
            <ArrowRight size={13} className="shrink-0 opacity-40" />
        </Command.Item>
    );
}
