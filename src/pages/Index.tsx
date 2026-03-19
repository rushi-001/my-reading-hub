import { useEffect, useState } from "react";
import { useBooks } from "@/store/bookStore";
import { AudioPlayerBar } from "@/components/AudioPlayerBar";
import { CommandPalette } from "@/components/CommandPalette";
import { KeyboardShortcutsDialog } from "@/components/KeyboardShortcutsDialog";
import { SettingsPanel } from "@/components/SettingsPanel";
import {
    BookOpen,
    CalendarDays,
    Clock,
    Command as CmdIcon,
    Library,
    Menu,
    Plus,
    Search,
    Settings,
} from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

function isTypingElement(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName.toLowerCase();
    return (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        target.isContentEditable
    );
}

function getPageTitle(pathname: string) {
    if (pathname.startsWith("/library")) return "Library";
    if (pathname.startsWith("/calendar")) return "Reading Calendar";
    if (pathname.startsWith("/reader")) return "Reader";
    return "My Reading Hub";
}

// AppShell is the main layout component that contains the command palette,
// settings panel, and keyboard shortcuts dialog.
function AppShell() {
    const {
        settings,
        setCommandOpen,
        setSettingsOpen,
        setAddBookOpen,
        setShortcutsOpen,
        isShortcutsOpen,
        getLastReadBook,
        openBook,
    } = useBooks();
    const navigate = useNavigate();
    const location = useLocation();
    const isMobile = useIsMobile();
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const lastRead = getLastReadBook();

    // Global keyboard shortcuts that depend on routing state.
    useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            const key = event.key.toLowerCase();
            const typing = isTypingElement(event.target);
            const onLibraryPage = location.pathname.startsWith("/library");

            // Command palette / settings shell shortcuts.
            if ((event.metaKey || event.ctrlKey) && key === "k") {
                event.preventDefault();
                setCommandOpen(true);
                return;
            }
            if ((event.metaKey || event.ctrlKey) && event.key === ",") {
                event.preventDefault();
                setSettingsOpen(true);
                return;
            }
            if (event.key === "Escape") {
                setCommandOpen(false);
                setSettingsOpen(false);
                setShortcutsOpen(false);
                setAddBookOpen(false);
                setIsMobileNavOpen(false);
                return;
            }

            // Continue reading shortcut.
            if (event.altKey && key === "c" && lastRead) {
                event.preventDefault();
                openBook(lastRead.id);
                navigate(`/reader/${lastRead.id}`);
                return;
            }

            // Add-book drawer shortcut (drawer remains route-free).
            if (event.altKey && key === "n") {
                event.preventDefault();
                if (!onLibraryPage) navigate("/library");
                setAddBookOpen(true);
                return;
            }

            // Focus library search.
            if (
                !typing &&
                !event.ctrlKey &&
                !event.metaKey &&
                !event.altKey &&
                event.key === "/"
            ) {
                event.preventDefault();
                if (!onLibraryPage) {
                    navigate("/library");
                    setTimeout(() => {
                        document
                            .querySelector<HTMLInputElement>(
                                "[data-library-search='true']",
                            )
                            ?.focus();
                    }, 0);
                } else {
                    document
                        .querySelector<HTMLInputElement>(
                            "[data-library-search='true']",
                        )
                        ?.focus();
                }
                return;
            }

            // Show keyboard help with both ? and Ctrl/Cmd + /.
            const isQuestionKey =
                event.key === "?" || (event.shiftKey && event.key === "/");
            const isCtrlSlash =
                (event.ctrlKey || event.metaKey) && event.key === "/";
            if (!typing && (isQuestionKey || isCtrlSlash)) {
                event.preventDefault();
                setShortcutsOpen(!isShortcutsOpen);
            }
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [
        isShortcutsOpen,
        lastRead,
        location.pathname,
        navigate,
        openBook,
        setAddBookOpen,
        setShortcutsOpen,
        setCommandOpen,
        setSettingsOpen,
    ]);

    const openReaderForLastBook = () => {
        if (!lastRead) return;
        openBook(lastRead.id);
        navigate(`/reader/${lastRead.id}`);
    };

    const isLibraryActive = location.pathname.startsWith("/library");
    const isCalendarActive = location.pathname.startsWith("/calendar");
    const pageTitle = getPageTitle(location.pathname);

    const navTo = (path: string) => {
        navigate(path);
        setIsMobileNavOpen(false);
    };

    return (
        <div className="flex h-full w-full overflow-hidden bg-background text-foreground font-mono">
            {/* Route navigation for major pages only. */}
            {!isMobile && settings.sidebarVisible && (
                <aside className="w-12 flex flex-col items-center py-4 gap-2 border-r border-muted bg-sidebar shrink-0">
                    <div className="w-7 h-7 flex items-center justify-center mb-4">
                        <BookOpen size={15} className="text-terminal" />
                    </div>

                    <SideBtn
                        icon={<Library size={15} />}
                        label="Library"
                        active={isLibraryActive}
                        onClick={() => navigate("/library")}
                    />
                    <SideBtn
                        icon={<CalendarDays size={15} />}
                        label="Calendar"
                        active={isCalendarActive}
                        onClick={() => navigate("/calendar")}
                    />
                    <SideBtn
                        icon={<CmdIcon size={15} />}
                        label="Search (Cmd/Ctrl + K)"
                        active={false}
                        onClick={() => setCommandOpen(true)}
                    />
                    {lastRead && (
                        <SideBtn
                            icon={<Clock size={15} />}
                            label={`Continue (Alt + C): ${lastRead.title}`}
                            active={false}
                            onClick={openReaderForLastBook}
                        />
                    )}

                    <div className="mt-auto">
                        <SideBtn
                            icon={<Settings size={15} />}
                            label="Settings (Cmd/Ctrl + ,)"
                            active={false}
                            onClick={() => setSettingsOpen(true)}
                        />
                    </div>
                </aside>
            )}

            {/* Page outlet + global overlays */}
            <div className="flex flex-col flex-1 min-w-0 min-h-0">
                {isMobile && (
                    <header className="h-12 border-b border-muted bg-sidebar px-3 flex items-center justify-between gap-2 shrink-0">
                        <button
                            onClick={() => setIsMobileNavOpen(true)}
                            className="w-8 h-8 border border-muted text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors flex items-center justify-center"
                            aria-label="Open navigation menu"
                        >
                            <Menu size={15} />
                        </button>
                        <p className="text-[12px] font-medium truncate">{pageTitle}</p>
                        <button
                            onClick={() => setCommandOpen(true)}
                            className="w-8 h-8 border border-muted text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors flex items-center justify-center"
                            aria-label="Open search"
                        >
                            <Search size={14} />
                        </button>
                    </header>
                )}

                <div className="flex-1 min-h-0 overflow-hidden">
                    <Outlet />
                </div>
                <AudioPlayerBar />
            </div>

            <CommandPalette />
            <SettingsPanel />
            <KeyboardShortcutsDialog />

            {isMobile && (
                <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
                    <SheetContent
                        side="left"
                        className="w-[88%] max-w-[320px] border-r border-muted bg-sidebar p-4"
                    >
                        <SheetHeader>
                            <SheetTitle className="text-sm font-mono tracking-wide">
                                Navigation
                            </SheetTitle>
                        </SheetHeader>

                        <div className="mt-4 space-y-2">
                            <MobileNavButton
                                icon={<Library size={15} />}
                                label="Library"
                                active={isLibraryActive}
                                onClick={() => navTo("/library")}
                            />
                            <MobileNavButton
                                icon={<CalendarDays size={15} />}
                                label="Reading Calendar"
                                active={isCalendarActive}
                                onClick={() => navTo("/calendar")}
                            />
                            <MobileNavButton
                                icon={<CmdIcon size={15} />}
                                label="Search Books"
                                onClick={() => {
                                    setIsMobileNavOpen(false);
                                    setCommandOpen(true);
                                }}
                            />
                            <MobileNavButton
                                icon={<Plus size={15} />}
                                label="Add New Book"
                                onClick={() => {
                                    setIsMobileNavOpen(false);
                                    navigate("/library");
                                    setAddBookOpen(true);
                                }}
                            />
                            {lastRead && (
                                <MobileNavButton
                                    icon={<Clock size={15} />}
                                    label={`Continue: ${lastRead.title}`}
                                    onClick={() => {
                                        setIsMobileNavOpen(false);
                                        openReaderForLastBook();
                                    }}
                                />
                            )}
                            <MobileNavButton
                                icon={<Settings size={15} />}
                                label="Settings"
                                onClick={() => {
                                    setIsMobileNavOpen(false);
                                    setSettingsOpen(true);
                                }}
                            />
                        </div>
                    </SheetContent>
                </Sheet>
            )}
        </div>
    );
}

function SideBtn({
    icon,
    label,
    active,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            title={label}
            onClick={onClick}
            className={`w-8 h-8 flex items-center justify-center transition-colors ${
                active
                    ? "text-terminal"
                    : "text-muted-foreground hover:text-foreground"
            }`}
        >
            {icon}
        </button>
    );
}

function MobileNavButton({
    icon,
    label,
    active = false,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 border px-3 py-2.5 text-left text-[12px] transition-colors ${
                active
                    ? "border-terminal text-terminal"
                    : "border-muted text-muted-foreground hover:text-foreground hover:border-muted-foreground"
            }`}
        >
            <span className="shrink-0">{icon}</span>
            <span className="truncate">{label}</span>
        </button>
    );
}

export default function Index() {
    return <AppShell />;
}
