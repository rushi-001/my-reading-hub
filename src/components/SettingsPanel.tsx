import { AnimatePresence, motion } from "framer-motion";
import {
    Download,
    Eye,
    EyeOff,
    Github,
    History,
    Keyboard,
    LogOut,
    Settings,
    Upload,
    X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
    formatSyncRelative,
    formatSyncTimestamp,
    getLatestSyncTimestamp,
} from "@/lib/syncStatus";
import { useBooks } from "@/store/bookStore";
import type { AppSettings, SyncAction } from "@/types/book";

const COMMAND_PALETTE_POSITION_OPTIONS: Array<{
    value: AppSettings["commandPalettePosition"];
    label: string;
    short: string;
}> = [
    { value: "top-left", label: "Top Left", short: "TL" },
    { value: "top-center", label: "Top Center", short: "TC" },
    { value: "top-right", label: "Top Right", short: "TR" },
    { value: "center-left", label: "Center Left", short: "CL" },
    { value: "center-center", label: "Center", short: "C" },
    { value: "center-right", label: "Center Right", short: "CR" },
    { value: "bottom-left", label: "Bottom Left", short: "BL" },
    { value: "bottom-center", label: "Bottom Center", short: "BC" },
    { value: "bottom-right", label: "Bottom Right", short: "BR" },
];

export function SettingsPanel() {
    const {
        isSettingsOpen,
        setSettingsOpen,
        setShortcutsOpen,
        settings,
        updateSettings,
        api,
        auth,
        logout,
        setSyncDialogAction,
    } = useBooks();
    const navigate = useNavigate();

    const latestSyncTimestamp = getLatestSyncTimestamp(
        api.lastPushedAt,
        api.lastPulledAt,
    );
    const authLabel =
        auth.session?.username ?? auth.session?.name ?? auth.session?.id ?? "admin";

    const setAutoScrollSpeed = (value: number) => {
        if (!Number.isFinite(value)) return;
        const clamped = Math.max(0, Math.min(5, Number(value.toFixed(1))));
        updateSettings({ autoScrollSpeed: clamped });
    };

    const openSyncDialog = (action: SyncAction) => {
        if (api.isSyncing) return;
        setSyncDialogAction(action);
    };

    const handleLogout = async () => {
        setSettingsOpen(false);
        await logout();
        navigate("/login", { replace: true });
    };

    return (
        <AnimatePresence>
            {isSettingsOpen && (
                <>
                    <motion.div
                        key="settings-bg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 bg-black/70"
                        onClick={() => setSettingsOpen(false)}
                    />
                    <motion.div
                        key="settings-panel"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="fixed right-0 top-0 bottom-0 z-50 flex w-[380px] max-w-full flex-col border-l border-muted bg-background"
                    >
                        <div className="flex items-center justify-between border-b border-muted px-5 py-4">
                            <div className="flex items-center gap-2">
                                <Settings size={15} className="text-terminal" />
                                <span className="text-[12px] font-mono font-medium">
                                    Settings
                                </span>
                            </div>
                            <button
                                onClick={() => setSettingsOpen(false)}
                                className="text-muted-foreground transition-colors hover:text-foreground"
                            >
                                <X size={15} />
                            </button>
                        </div>

                        <div className="flex-1 space-y-6 overflow-y-auto p-5">
                            <Section label="Account">
                                <div className="space-y-3 rounded-2xl border border-muted bg-surface-1 p-4">
                                    <div>
                                        <p className="text-[12px] text-foreground">
                                            Signed in as
                                        </p>
                                        <p className="mt-1 break-all text-[11px] text-terminal">
                                            {authLabel}
                                        </p>
                                        <p className="mt-2 text-[10px] text-muted-foreground">
                                            The active admin session is coming from the backend.
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleLogout}
                                        className="flex w-full items-center justify-center gap-2 border border-muted px-3 py-2 text-[11px] text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground"
                                    >
                                        <LogOut size={13} />
                                        Sign Out
                                    </button>
                                </div>
                            </Section>

                            <Section label="Sync">
                                <div className="space-y-3 rounded-2xl border border-muted bg-surface-1 p-4">
                                    <div className="flex items-center gap-2">
                                        <Github size={14} className="text-terminal" />
                                        <div>
                                            <p className="text-[12px] text-foreground">
                                                GitHub Sync
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">
                                                Manage uploads and downloads separately.
                                            </p>
                                        </div>
                                    </div>

                                    <SyncButton
                                        icon={<Upload size={13} />}
                                        label="Upload to GitHub"
                                        description={formatSyncRelative(
                                            api.lastPushedAt,
                                            "No uploads yet",
                                        )}
                                        isLoading={
                                            api.isSyncing &&
                                            api.activeSyncAction === "push"
                                        }
                                        onClick={() => openSyncDialog("push")}
                                    />
                                    <SyncButton
                                        icon={<Download size={13} />}
                                        label="Download from GitHub"
                                        description={formatSyncRelative(
                                            api.lastPulledAt,
                                            "No downloads yet",
                                        )}
                                        isLoading={
                                            api.isSyncing &&
                                            api.activeSyncAction === "pull"
                                        }
                                        onClick={() => openSyncDialog("pull")}
                                    />

                                    <button
                                        onClick={() => {
                                            setSettingsOpen(false);
                                            navigate("/sync-history");
                                        }}
                                        className="flex w-full items-center justify-center gap-2 border border-muted px-3 py-2 text-[11px] text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground"
                                    >
                                        <History size={13} />
                                        View Sync History
                                    </button>

                                    <div className="space-y-1 rounded-xl border border-muted bg-background/70 p-3 text-[10px] text-muted-foreground">
                                        <p>
                                            Latest activity:{" "}
                                            <span className="text-foreground">
                                                {formatSyncTimestamp(
                                                    latestSyncTimestamp,
                                                    "No sync recorded",
                                                )}
                                            </span>
                                        </p>
                                        <p>
                                            Last upload:{" "}
                                            <span className="text-foreground">
                                                {formatSyncTimestamp(
                                                    api.lastPushedAt,
                                                    "Never",
                                                )}
                                            </span>
                                        </p>
                                        <p>
                                            Last download:{" "}
                                            <span className="text-foreground">
                                                {formatSyncTimestamp(
                                                    api.lastPulledAt,
                                                    "Never",
                                                )}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </Section>

                            <Section label="Command Palette">
                                <Row
                                    label="Show Icons"
                                    description="Show format icons next to search results"
                                >
                                    <Toggle
                                        value={settings.showIcons}
                                        onChange={(value) =>
                                            updateSettings({ showIcons: value })
                                        }
                                    />
                                </Row>
                                <Row
                                    label="Position"
                                    description="Pick where Cmd/Ctrl + K opens"
                                >
                                    <div className="grid w-[168px] grid-cols-3 gap-1">
                                        {COMMAND_PALETTE_POSITION_OPTIONS.map((option) => (
                                            <PillBtn
                                                key={option.value}
                                                active={
                                                    settings.commandPalettePosition ===
                                                    option.value
                                                }
                                                onClick={() =>
                                                    updateSettings({
                                                        commandPalettePosition:
                                                            option.value,
                                                    })
                                                }
                                                label={option.short}
                                                title={option.label}
                                                className="justify-center px-2"
                                            />
                                        ))}
                                    </div>
                                </Row>
                            </Section>

                            <Section label="Library">
                                <Row
                                    label="Stack Groups"
                                    description="Show grouped books as stacked cards"
                                >
                                    <Toggle
                                        value={settings.stackGroups}
                                        onChange={(value) =>
                                            updateSettings({ stackGroups: value })
                                        }
                                    />
                                </Row>
                                {settings.stackGroups && (
                                    <Row
                                        label="Max Stack Size"
                                        description="How many covers appear in a stack"
                                    >
                                        <div className="flex gap-1">
                                            {[2, 3, 4, 5].map((value) => (
                                                <PillBtn
                                                    key={value}
                                                    active={
                                                        settings.stackMaxVisible === value
                                                    }
                                                    onClick={() =>
                                                        updateSettings({
                                                            stackMaxVisible: value,
                                                        })
                                                    }
                                                    label={String(value)}
                                                />
                                            ))}
                                        </div>
                                    </Row>
                                )}
                            </Section>

                            <Section label="Calendar">
                                <Row
                                    label="Activity Dots"
                                    description="Show GitHub-style reading dots in calendar"
                                >
                                    <Toggle
                                        value={settings.showCalendarHeatmap}
                                        onChange={(value) =>
                                            updateSettings({
                                                showCalendarHeatmap: value,
                                            })
                                        }
                                    />
                                </Row>
                            </Section>

                            <Section label="Interface">
                                <Row
                                    label="Sidebar"
                                    description="Show or hide the left sidebar"
                                >
                                    <div className="flex gap-1">
                                        <PillBtn
                                            active={settings.sidebarVisible}
                                            onClick={() =>
                                                updateSettings({ sidebarVisible: true })
                                            }
                                            icon={<Eye size={12} />}
                                            label="Show"
                                        />
                                        <PillBtn
                                            active={!settings.sidebarVisible}
                                            onClick={() =>
                                                updateSettings({ sidebarVisible: false })
                                            }
                                            icon={<EyeOff size={12} />}
                                            label="Hide"
                                        />
                                    </div>
                                </Row>

                                <Row
                                    label="Collapsible Sidebar"
                                    description="Allow the desktop sidebar to shrink to icon-only mode"
                                >
                                    <Toggle
                                        value={settings.collapsibleSidebar}
                                        onChange={(value) =>
                                            updateSettings({
                                                collapsibleSidebar: value,
                                            })
                                        }
                                    />
                                </Row>

                                <Row
                                    label="Keyboard Help"
                                    description="Press ? or Cmd/Ctrl + / to open key bindings"
                                >
                                    <PillBtn
                                        active={false}
                                        onClick={() => setShortcutsOpen(true)}
                                        icon={<Keyboard size={12} />}
                                        label="Show"
                                    />
                                </Row>
                            </Section>

                            <Section label="Reader">
                                <Row
                                    label="Auto-Scroll Speed"
                                    description="0 = off, higher = faster"
                                >
                                    <div className="w-[220px] space-y-1">
                                        <input
                                            type="range"
                                            min={0}
                                            max={5}
                                            step={0.1}
                                            value={settings.autoScrollSpeed}
                                            onChange={(event) =>
                                                setAutoScrollSpeed(
                                                    Number.parseFloat(
                                                        event.target.value,
                                                    ),
                                                )
                                            }
                                            className="w-full accent-[hsl(var(--terminal-green))]"
                                            aria-label="Auto-scroll speed"
                                        />
                                        <p className="text-right font-mono text-[10px] text-muted-foreground">
                                            {settings.autoScrollSpeed === 0
                                                ? "Off"
                                                : settings.autoScrollSpeed.toFixed(1)}
                                        </p>
                                    </div>
                                </Row>
                            </Section>
                        </div>

                        <div className="border-t border-muted px-5 py-3">
                            <p className="font-mono text-[10px] text-muted-foreground/60">
                                Settings save automatically. Open with Cmd/Ctrl + ,
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {label}
            </p>
            <div className="space-y-3">{children}</div>
        </div>
    );
}

function Row({
    label,
    description,
    children,
}: {
    label: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
                <p className="text-[12px] text-foreground">{label}</p>
                {description && (
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            <div className="shrink-0">{children}</div>
        </div>
    );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            onClick={() => onChange(!value)}
            className={`relative h-5 w-9 border transition-colors ${
                value ? "border-terminal bg-terminal/20" : "border-muted bg-surface-1"
            }`}
        >
            <span
                className={`absolute top-0.5 h-3.5 w-3.5 transition-all ${
                    value ? "left-4 bg-terminal" : "left-0.5 bg-muted-foreground"
                }`}
            />
        </button>
    );
}

function PillBtn({
    active,
    onClick,
    label,
    icon,
    title,
    className,
}: {
    active: boolean;
    onClick: () => void;
    label: string;
    icon?: React.ReactNode;
    title?: string;
    className?: string;
}) {
    return (
        <button
            onClick={onClick}
            title={title}
            className={`flex items-center gap-1 border px-2 py-1 text-[11px] transition-colors ${
                active
                    ? "border-terminal text-terminal"
                    : "border-muted text-muted-foreground hover:border-muted-foreground"
            } ${className ?? ""}`}
        >
            {icon}
            {label}
        </button>
    );
}

function SyncButton({
    icon,
    label,
    description,
    isLoading,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    description: string;
    isLoading: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            disabled={isLoading}
            className="w-full rounded-xl border border-muted bg-background/70 px-3 py-2 text-left transition-colors hover:border-muted-foreground disabled:cursor-not-allowed disabled:opacity-70"
        >
            <div className="flex items-center gap-3">
                <span className="shrink-0 text-terminal">{icon}</span>
                <span className="min-w-0">
                    <span className="block text-[12px] text-foreground">
                        {isLoading ? `${label}...` : label}
                    </span>
                    <span className="block text-[10px] text-muted-foreground">
                        {isLoading ? "Please keep this tab open" : description}
                    </span>
                </span>
            </div>
        </button>
    );
}
