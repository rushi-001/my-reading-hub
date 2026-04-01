import { useEffect, useMemo, useRef, useState } from "react";
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Clock3,
    Command as CmdIcon,
    Download,
    Github,
    History,
    Library,
    LogOut,
    Menu,
    Plus,
    Search,
    Settings,
    Upload,
} from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AudioPlayerBar } from "@/components/AudioPlayerBar";
import { CommandPalette } from "@/components/CommandPalette";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { KeyboardShortcutsDialog } from "@/components/KeyboardShortcutsDialog";
import { SettingsPanel } from "@/components/SettingsPanel";
import {
    getLatestSyncTimestamp,
    getSyncActionCopy,
    formatSyncRelative,
    formatSyncTimestamp,
} from "@/lib/syncStatus";
import { useIsMobile } from "@/hooks/use-mobile";
import { useBooks } from "@/store/bookStore";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "@/components/ui/sonner";
import type { SyncAction } from "@/types/book";

const SIDEBAR_COLLAPSED_KEY = "secondbrain_sidebar_collapsed";

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
    if (pathname.startsWith("/sync-history")) return "Sync History";
    if (pathname.startsWith("/reader")) return "Reader";
    return "My Reading Hub";
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
        syncDialogAction,
        setSyncDialogAction,
        requestPushSync,
        requestPullSync,
        api,
        auth,
        logout,
    } = useBooks();
    const navigate = useNavigate();
    const location = useLocation();
    const isMobile = useIsMobile();
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        if (typeof window === "undefined") return false;
        return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
    });
    const lastRead = getLastReadBook();
    const activeSyncRef = useRef<SyncAction | null>(null);
    const previousSyncingRef = useRef(api.isSyncing);

    const latestSyncTimestamp = useMemo(
        () => getLatestSyncTimestamp(api.lastPushedAt, api.lastPulledAt),
        [api.lastPulledAt, api.lastPushedAt],
    );
    const syncDialogCopy = syncDialogAction
        ? getSyncActionCopy(syncDialogAction)
        : null;
    const authLabel =
        auth.session?.username ??
        auth.session?.name ??
        auth.session?.id ??
        "admin";

    useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            const key = event.key.toLowerCase();
            const typing = isTypingElement(event.target);
            const onLibraryPage = location.pathname.startsWith("/library");

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
                if (!api.isSyncing) {
                    setSyncDialogAction(null);
                }
                return;
            }

            if (event.altKey && key === "c" && lastRead) {
                event.preventDefault();
                openBook(lastRead.id);
                navigate(`/reader/${lastRead.id}`);
                return;
            }

            if (event.altKey && key === "n") {
                event.preventDefault();
                if (!onLibraryPage) navigate("/library");
                setAddBookOpen(true);
                return;
            }

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
        api.isSyncing,
        isShortcutsOpen,
        lastRead,
        location.pathname,
        navigate,
        openBook,
        setAddBookOpen,
        setCommandOpen,
        setSettingsOpen,
        setShortcutsOpen,
        setSyncDialogAction,
    ]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        window.localStorage.setItem(
            SIDEBAR_COLLAPSED_KEY,
            String(isSidebarCollapsed),
        );
    }, [isSidebarCollapsed]);

    useEffect(() => {
        if (api.activeSyncAction) {
            activeSyncRef.current = api.activeSyncAction;
        }
    }, [api.activeSyncAction]);

    useEffect(() => {
        if (previousSyncingRef.current && !api.isSyncing) {
            const completedAction = activeSyncRef.current;
            if (completedAction) {
                const copy = getSyncActionCopy(completedAction);
                const completedAt =
                    completedAction === "push"
                        ? api.lastPushedAt
                        : api.lastPulledAt;

                if (api.lastError) {
                    toast.error(copy.failureTitle, {
                        description: api.lastError,
                    });
                } else {
                    toast.success(copy.successTitle, {
                        description: formatSyncTimestamp(
                            completedAt,
                            "Completed just now",
                        ),
                    });
                }

                activeSyncRef.current = null;
                setSyncDialogAction(null);
            }
        }

        previousSyncingRef.current = api.isSyncing;
    }, [
        api.isSyncing,
        api.lastError,
        api.lastPulledAt,
        api.lastPushedAt,
        setSyncDialogAction,
    ]);

    const openReaderForLastBook = () => {
        if (!lastRead) return;
        openBook(lastRead.id);
        navigate(`/reader/${lastRead.id}`);
    };

    const openSyncDialog = (action: SyncAction) => {
        if (api.isSyncing) return;
        setSyncDialogAction(action);
        setIsMobileNavOpen(false);
    };

    const handleConfirmSync = () => {
        if (!syncDialogAction) return;
        if (syncDialogAction === "push") {
            requestPushSync();
            return;
        }
        requestPullSync();
    };

    const handleLogout = async () => {
        await logout();
        navigate("/login", { replace: true });
    };

    const isLibraryActive = location.pathname.startsWith("/library");
    const isCalendarActive = location.pathname.startsWith("/calendar");
    const isSyncHistoryActive = location.pathname.startsWith("/sync-history");
    const pageTitle = getPageTitle(location.pathname);
    const sidebarCollapsed =
        settings.sidebarVisible &&
        settings.collapsibleSidebar &&
        isSidebarCollapsed;

    const navTo = (path: string) => {
        navigate(path);
        setIsMobileNavOpen(false);
    };

    const onAddBook = () => {
        setIsMobileNavOpen(false);
        navigate("/library");
        setAddBookOpen(true);
    };

    return (
        <div className="flex h-full w-full overflow-hidden bg-background text-foreground font-mono">
            {!isMobile && settings.sidebarVisible && (
                <aside
                    className={`flex shrink-0 flex-col border-r border-muted bg-surface-1 transition-[width] duration-200 ${
                        sidebarCollapsed ? "w-[86px]" : "w-[284px]"
                    }`}
                >
                    <div
                        className={`border-b border-muted ${
                            sidebarCollapsed ? "px-3 py-4" : "px-5 py-5"
                        }`}
                    >
                        <div
                            className={`flex ${
                                sidebarCollapsed
                                    ? "flex-col items-center gap-3"
                                    : "items-center gap-3"
                            }`}
                        >
                            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-none border border-muted bg-background/70">
                                <img
                                    src="/logo.png"
                                    alt="My Reading Hub"
                                    className="h-9 w-9 object-contain"
                                />
                            </div>
                            {!sidebarCollapsed && (
                                <div className="min-w-0 flex-1">
                                    <p className="text-[13px] font-semibold tracking-tight">
                                        My Reading Hub
                                    </p>
                                    <p className="truncate text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                                        {authLabel}
                                    </p>
                                </div>
                            )}
                            {settings.collapsibleSidebar && (
                                <button
                                    onClick={() =>
                                        setIsSidebarCollapsed(
                                            (current) => !current,
                                        )
                                    }
                                    className="flex h-8 w-8 items-center justify-center rounded-none border border-muted bg-background/70 text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground"
                                    title={
                                        sidebarCollapsed
                                            ? "Expand sidebar"
                                            : "Collapse sidebar"
                                    }
                                    aria-label={
                                        sidebarCollapsed
                                            ? "Expand sidebar"
                                            : "Collapse sidebar"
                                    }
                                >
                                    {sidebarCollapsed ? (
                                        <ChevronRight size={15} />
                                    ) : (
                                        <ChevronLeft size={15} />
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    <div
                        className={`flex-1 overflow-y-auto ${
                            sidebarCollapsed ? "px-3 py-4" : "px-4 py-4"
                        }`}
                    >
                        <div className="space-y-2">
                            <SidebarAction
                                icon={<Library size={15} />}
                                label="Library"
                                description="Browse and manage books"
                                active={isLibraryActive}
                                collapsed={sidebarCollapsed}
                                onClick={() => navigate("/library")}
                            />
                            <SidebarAction
                                icon={<CalendarDays size={15} />}
                                label="Reading Calendar"
                                description="Track daily reading activity"
                                active={isCalendarActive}
                                collapsed={sidebarCollapsed}
                                onClick={() => navigate("/calendar")}
                            />
                            <SidebarAction
                                icon={<History size={15} />}
                                label="Sync History"
                                description="Review GitHub sync commits"
                                active={isSyncHistoryActive}
                                collapsed={sidebarCollapsed}
                                onClick={() => navigate("/sync-history")}
                            />
                            <SidebarAction
                                icon={<CmdIcon size={15} />}
                                label="Search Books"
                                description="Open Cmd/Ctrl + K"
                                collapsed={sidebarCollapsed}
                                onClick={() => setCommandOpen(true)}
                            />
                            <SidebarAction
                                icon={<Plus size={15} />}
                                label="Add New Book"
                                description="Jump to the add book drawer"
                                collapsed={sidebarCollapsed}
                                onClick={onAddBook}
                            />
                            {lastRead && (
                                <SidebarAction
                                    icon={<Clock3 size={15} />}
                                    label={`Continue ${lastRead.title}`}
                                    description={`${lastRead.progress}% complete`}
                                    collapsed={sidebarCollapsed}
                                    onClick={openReaderForLastBook}
                                />
                            )}
                        </div>

                        <div
                            className={`mt-6 rounded-none border border-muted bg-background/50 ${
                                sidebarCollapsed ? "p-3" : "p-4"
                            }`}
                        >
                            {!sidebarCollapsed && (
                                <div className="flex items-center gap-2">
                                    <Github
                                        size={15}
                                        className="text-terminal"
                                    />
                                    <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                                        GitHub Sync
                                    </p>
                                </div>
                            )}

                            <div
                                className={`${
                                    sidebarCollapsed
                                        ? "space-y-2"
                                        : "mt-4 space-y-2"
                                }`}
                            >
                                <SyncActionButton
                                    icon={<Upload size={14} />}
                                    label="Upload to GitHub"
                                    sublabel={formatSyncRelative(
                                        api.lastPushedAt,
                                        "No uploads yet",
                                    )}
                                    isLoading={
                                        api.isSyncing &&
                                        api.activeSyncAction === "push"
                                    }
                                    collapsed={sidebarCollapsed}
                                    onClick={() => openSyncDialog("push")}
                                />
                                <SyncActionButton
                                    icon={<Download size={14} />}
                                    label="Download from GitHub"
                                    sublabel={formatSyncRelative(
                                        api.lastPulledAt,
                                        "No downloads yet",
                                    )}
                                    isLoading={
                                        api.isSyncing &&
                                        api.activeSyncAction === "pull"
                                    }
                                    collapsed={sidebarCollapsed}
                                    onClick={() => openSyncDialog("pull")}
                                />
                            </div>

                            {!sidebarCollapsed && (
                                <div className="mt-4 rounded-none border border-muted bg-surface-1 p-3">
                                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                                        Latest Activity
                                    </p>
                                    <p className="mt-2 text-[12px] text-foreground">
                                        {formatSyncTimestamp(
                                            latestSyncTimestamp,
                                            "No sync recorded",
                                        )}
                                    </p>
                                    <div className="mt-3 space-y-1 text-[10px] text-muted-foreground">
                                        <p>
                                            Upload:{" "}
                                            <span className="text-foreground">
                                                {formatSyncTimestamp(
                                                    api.lastPushedAt,
                                                    "Never",
                                                )}
                                            </span>
                                        </p>
                                        <p>
                                            Download:{" "}
                                            <span className="text-foreground">
                                                {formatSyncTimestamp(
                                                    api.lastPulledAt,
                                                    "Never",
                                                )}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div
                        className={`border-t border-muted ${
                            sidebarCollapsed ? "px-3 py-4" : "px-4 py-4"
                        }`}
                    >
                        <div className="space-y-2">
                            <SidebarAction
                                icon={<Settings size={15} />}
                                label="Settings"
                                description="Reader, layout, and sync options"
                                collapsed={sidebarCollapsed}
                                onClick={() => setSettingsOpen(true)}
                            />
                            <SidebarAction
                                icon={<LogOut size={15} />}
                                label="Sign Out"
                                description="Sign out of the admin workspace"
                                collapsed={sidebarCollapsed}
                                onClick={handleLogout}
                            />
                        </div>
                    </div>
                </aside>
            )}

            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                {isMobile && (
                    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-muted bg-sidebar px-3">
                        <button
                            onClick={() => setIsMobileNavOpen(true)}
                            className="flex h-9 w-9 items-center justify-center border border-muted text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground"
                            aria-label="Open navigation menu"
                        >
                            <Menu size={15} />
                        </button>

                        <div className="flex min-w-0 items-center gap-2">
                            <img
                                src="/logo.png"
                                alt="My Reading Hub"
                                className="h-7 w-7 shrink-0 object-contain"
                            />
                            <div className="min-w-0">
                                <p className="truncate text-[12px] font-medium">
                                    {pageTitle}
                                </p>
                                <p className="truncate text-[10px] text-muted-foreground">
                                    {authLabel}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => setCommandOpen(true)}
                            className="flex h-9 w-9 items-center justify-center border border-muted text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground"
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

            <ConfirmActionDialog
                open={Boolean(syncDialogAction)}
                onOpenChange={(open) => {
                    if (!open) {
                        setSyncDialogAction(null);
                    }
                }}
                title={
                    api.isSyncing && syncDialogCopy
                        ? syncDialogCopy.progressTitle
                        : (syncDialogCopy?.title ?? "Sync")
                }
                description={
                    api.isSyncing && syncDialogCopy
                        ? syncDialogCopy.progressDescription
                        : (syncDialogCopy?.description ??
                          "Sync your library data with GitHub.")
                }
                confirmLabel={syncDialogCopy?.buttonLabel ?? "Continue"}
                confirmTone="default"
                closeOnConfirm={false}
                isProcessing={api.isSyncing}
                processingLabel={
                    api.isSyncing ? syncDialogCopy?.progressLabel : undefined
                }
                processingMessage={
                    api.isSyncing
                        ? syncDialogCopy?.processingMessage
                        : undefined
                }
                onConfirm={handleConfirmSync}
            />

            {isMobile && (
                <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
                    <SheetContent
                        side="left"
                        className="w-[90%] max-w-[340px] border-r border-muted bg-sidebar p-0"
                    >
                        <SheetHeader className="border-b border-muted px-4 py-4 text-left">
                            <SheetTitle className="flex items-center gap-3 text-[13px] font-medium">
                                <img
                                    src="/logo.png"
                                    alt="My Reading Hub"
                                    className="h-9 w-9 object-contain"
                                />
                                <span className="min-w-0 truncate">
                                    My Reading Hub
                                </span>
                            </SheetTitle>
                            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                                {authLabel}
                            </p>
                        </SheetHeader>

                        <div className="space-y-5 px-4 py-4">
                            <div className="space-y-2">
                                <MobileNavButton
                                    icon={<Library size={15} />}
                                    label="Library"
                                    description="Browse and manage books"
                                    active={isLibraryActive}
                                    onClick={() => navTo("/library")}
                                />
                                <MobileNavButton
                                    icon={<CalendarDays size={15} />}
                                    label="Reading Calendar"
                                    description="View reading activity"
                                    active={isCalendarActive}
                                    onClick={() => navTo("/calendar")}
                                />
                                <MobileNavButton
                                    icon={<History size={15} />}
                                    label="Sync History"
                                    description="View recent GitHub commits"
                                    active={isSyncHistoryActive}
                                    onClick={() => navTo("/sync-history")}
                                />
                                <MobileNavButton
                                    icon={<CmdIcon size={15} />}
                                    label="Search Books"
                                    description="Open command palette"
                                    onClick={() => {
                                        setIsMobileNavOpen(false);
                                        setCommandOpen(true);
                                    }}
                                />
                                <MobileNavButton
                                    icon={<Plus size={15} />}
                                    label="Add New Book"
                                    description="Open the add book drawer"
                                    onClick={onAddBook}
                                />
                                {lastRead && (
                                    <MobileNavButton
                                        icon={<Clock3 size={15} />}
                                        label="Continue Reading"
                                        description={lastRead.title}
                                        onClick={() => {
                                            setIsMobileNavOpen(false);
                                            openReaderForLastBook();
                                        }}
                                    />
                                )}
                            </div>

                            <div className="rounded-none border border-muted bg-background/50 p-4">
                                <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                                    <Github
                                        size={14}
                                        className="text-terminal"
                                    />
                                    GitHub Sync
                                </p>
                                <div className="mt-3 space-y-2">
                                    <SyncActionButton
                                        icon={<Upload size={14} />}
                                        label="Upload to GitHub"
                                        sublabel={formatSyncRelative(
                                            api.lastPushedAt,
                                            "No uploads yet",
                                        )}
                                        isLoading={
                                            api.isSyncing &&
                                            api.activeSyncAction === "push"
                                        }
                                        onClick={() => openSyncDialog("push")}
                                    />
                                    <SyncActionButton
                                        icon={<Download size={14} />}
                                        label="Download from GitHub"
                                        sublabel={formatSyncRelative(
                                            api.lastPulledAt,
                                            "No downloads yet",
                                        )}
                                        isLoading={
                                            api.isSyncing &&
                                            api.activeSyncAction === "pull"
                                        }
                                        onClick={() => openSyncDialog("pull")}
                                    />
                                </div>
                                <p className="mt-3 text-[10px] text-muted-foreground">
                                    Latest activity:{" "}
                                    <span className="text-foreground">
                                        {formatSyncTimestamp(
                                            latestSyncTimestamp,
                                            "No sync recorded",
                                        )}
                                    </span>
                                </p>
                            </div>

                            <div className="space-y-2">
                                <MobileNavButton
                                    icon={<Settings size={15} />}
                                    label="Settings"
                                    description="Reader and layout options"
                                    onClick={() => {
                                        setIsMobileNavOpen(false);
                                        setSettingsOpen(true);
                                    }}
                                />
                                <MobileNavButton
                                    icon={<LogOut size={15} />}
                                    label="Sign Out"
                                    description="Sign out of the admin workspace"
                                    onClick={handleLogout}
                                />
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            )}
        </div>
    );
}

function SidebarAction({
    icon,
    label,
    description,
    active = false,
    collapsed = false,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    description: string;
    active?: boolean;
    collapsed?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            title={label}
            onClick={onClick}
            className={`w-full rounded-none border bg-background/70 transition-colors ${
                active
                    ? "border-terminal text-terminal"
                    : "border-muted text-muted-foreground hover:border-muted-foreground hover:text-foreground"
            } ${collapsed ? "flex h-10 justify-center items-center px-2" : "px-3 py-2 text-left"}`}
        >
            {collapsed ? (
                <span
                    className={`${
                        active ? "text-terminal" : "text-muted-foreground"
                    }`}
                >
                    {icon}
                </span>
            ) : (
                <div className="flex items-center gap-3">
                    <span
                        className={`shrink-0 ${
                            active ? "text-terminal" : "text-muted-foreground"
                        }`}
                    >
                        {icon}
                    </span>
                    <span className="min-w-0">
                        <span className="block text-[12px] font-medium">
                            {label}
                        </span>
                        <span
                            className={`mt-1 block text-[10px] ${
                                active
                                    ? "text-terminal/80"
                                    : "text-muted-foreground"
                            }`}
                        >
                            {description}
                        </span>
                    </span>
                </div>
            )}
        </button>
    );
}

function SyncActionButton({
    icon,
    label,
    sublabel,
    isLoading = false,
    collapsed = false,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    sublabel: string;
    isLoading?: boolean;
    collapsed?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            disabled={isLoading}
            title={label}
            className={`w-full rounded-none border bg-background/70 transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${
                isLoading
                    ? "border-terminal text-terminal"
                    : "border-muted text-muted-foreground hover:border-muted-foreground hover:text-foreground"
            } ${
                collapsed
                    ? "flex h-10 items-center justify-center px-2"
                    : "px-3 py-2 text-left"
            }`}
        >
            {collapsed ? (
                <span
                    className={
                        isLoading ? "text-terminal" : "text-muted-foreground"
                    }
                >
                    {icon}
                </span>
            ) : (
                <div className="flex items-center gap-3">
                    <span
                        className={`shrink-0 ${
                            isLoading
                                ? "text-terminal"
                                : "text-muted-foreground"
                        }`}
                    >
                        {icon}
                    </span>
                    <span className="min-w-0 flex-1">
                        <span
                            className={`block text-[12px] ${
                                isLoading ? "text-terminal" : "text-foreground"
                            }`}
                        >
                            {isLoading ? `${label}...` : label}
                        </span>
                        <span
                            className={`block text-[10px] ${
                                isLoading
                                    ? "text-terminal/80"
                                    : "text-muted-foreground"
                            }`}
                        >
                            {isLoading ? "Please keep this tab open" : sublabel}
                        </span>
                    </span>
                </div>
            )}
        </button>
    );
}

function MobileNavButton({
    icon,
    label,
    description,
    active = false,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    description: string;
    active?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`w-full rounded-none border bg-background/70 px-3 py-2 text-left transition-colors ${
                active
                    ? "border-terminal text-terminal"
                    : "border-muted text-muted-foreground hover:border-muted-foreground hover:text-foreground"
            }`}
        >
            <div className="flex items-center gap-3">
                <span
                    className={`shrink-0 ${
                        active ? "text-terminal" : "text-muted-foreground"
                    }`}
                >
                    {icon}
                </span>
                <span className="min-w-0">
                    <span className="block text-[12px] font-medium">
                        {label}
                    </span>
                    <span
                        className={`mt-1 block text-[10px] ${
                            active
                                ? "text-terminal/80"
                                : "text-muted-foreground"
                        }`}
                    >
                        {description}
                    </span>
                </span>
            </div>
        </button>
    );
}

export default function Index() {
    return <AppShell />;
}
