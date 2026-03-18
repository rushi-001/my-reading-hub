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
    Settings,
} from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

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
            if (!typing && !event.ctrlKey && !event.metaKey && !event.altKey && event.key === "/") {
                event.preventDefault();
                if (!onLibraryPage) {
                    navigate("/library");
                    setTimeout(() => {
                        document
                            .querySelector<HTMLInputElement>("[data-library-search='true']")
                            ?.focus();
                    }, 0);
                } else {
                    document
                        .querySelector<HTMLInputElement>("[data-library-search='true']")
                        ?.focus();
                }
                return;
            }

            // Show keyboard help with both ? and Ctrl/Cmd + /.
            const isQuestionKey = event.key === "?" || (event.shiftKey && event.key === "/");
            const isCtrlSlash = (event.ctrlKey || event.metaKey) && event.key === "/";
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
    ]);

    const openReaderForLastBook = () => {
        if (!lastRead) return;
        openBook(lastRead.id);
        navigate(`/reader/${lastRead.id}`);
    };

    const isLibraryActive = location.pathname.startsWith("/library");
    const isCalendarActive = location.pathname.startsWith("/calendar");

    return (
        <div className="flex h-full w-full overflow-hidden bg-background text-foreground font-mono">
            {/* Route navigation for major pages only. */}
            {settings.sidebarVisible && (
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
                <div className="flex-1 min-h-0 overflow-hidden">
                    <Outlet />
                </div>
                <AudioPlayerBar />
            </div>

            <CommandPalette />
            <SettingsPanel />
            <KeyboardShortcutsDialog />
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

export default function Index() {
    return <AppShell />;
}
