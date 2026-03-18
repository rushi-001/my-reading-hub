import { AnimatePresence, motion } from "framer-motion";
import {
    Eye,
    EyeOff,
    Keyboard,
    Settings,
    X,
} from "lucide-react";
import { useBooks } from "@/store/bookStore";
import type { AppSettings } from "@/types/book";

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
    } = useBooks();

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
                        className="fixed right-0 top-0 bottom-0 z-50 w-[360px] max-w-full bg-background border-l border-muted flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-muted">
                            <div className="flex items-center gap-2">
                                <Settings size={15} className="text-terminal" />
                                <span className="text-[12px] font-mono font-medium">Settings</span>
                            </div>
                            <button
                                onClick={() => setSettingsOpen(false)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X size={15} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-6">
                            <Section label="Command Palette">
                                <Row
                                    label="Show Icons"
                                    description="Show format icons next to search results"
                                >
                                    <Toggle
                                        value={settings.showIcons}
                                        onChange={(value) => updateSettings({ showIcons: value })}
                                    />
                                </Row>
                                <Row
                                    label="Position"
                                    description="Pick where Cmd/Ctrl + K opens"
                                >
                                    <div className="grid grid-cols-3 gap-1 w-[168px]">
                                        {COMMAND_PALETTE_POSITION_OPTIONS.map((option) => (
                                            <PillBtn
                                                key={option.value}
                                                active={settings.commandPalettePosition === option.value}
                                                onClick={() =>
                                                    updateSettings({
                                                        commandPalettePosition: option.value,
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
                                                    active={settings.stackMaxVisible === value}
                                                    onClick={() =>
                                                        updateSettings({ stackMaxVisible: value })
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
                                            updateSettings({ showCalendarHeatmap: value })
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
                                    <div className="flex gap-1">
                                        {[0, 1, 2, 3, 4, 5].map((value) => (
                                            <PillBtn
                                                key={value}
                                                active={settings.autoScrollSpeed === value}
                                                onClick={() =>
                                                    updateSettings({
                                                        autoScrollSpeed: value,
                                                    })
                                                }
                                                label={value === 0 ? "Off" : String(value)}
                                            />
                                        ))}
                                    </div>
                                </Row>
                            </Section>
                        </div>

                        <div className="px-5 py-3 border-t border-muted">
                            <p className="text-[10px] text-muted-foreground/60 font-mono">
                                Settings save automatically - Cmd/Ctrl + , to open
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
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 font-mono">
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
                    <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>
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
            className={`relative w-9 h-5 border transition-colors ${
                value ? "border-terminal bg-terminal/20" : "border-muted bg-surface-1"
            }`}
        >
            <span
                className={`absolute top-0.5 w-3.5 h-3.5 transition-all ${
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
            className={`flex items-center gap-1 px-2 py-1 text-[11px] border transition-colors ${
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
