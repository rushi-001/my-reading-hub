import { AnimatePresence, motion } from "framer-motion";
import { Keyboard, X } from "lucide-react";
import { useBooks } from "@/store/bookStore";

const SHORTCUTS: Array<{ key: string; action: string }> = [
    { key: "Cmd/Ctrl + K", action: "Open command palette" },
    { key: "Cmd/Ctrl + ,", action: "Open settings" },
    { key: "Alt + C", action: "Continue last read book" },
    { key: "Alt + N", action: "Open add book drawer" },
    { key: "/", action: "Focus library search" },
    { key: "?", action: "Open keyboard shortcuts" },
    { key: "Cmd/Ctrl + /", action: "Open keyboard shortcuts (alternate)" },
    { key: "Esc", action: "Close open overlays" },
];

export function KeyboardShortcutsDialog() {
    const { isShortcutsOpen, setShortcutsOpen } = useBooks();

    return (
        <AnimatePresence>
            {isShortcutsOpen && (
                <>
                    <motion.div
                        key="shortcut-backdrop"
                        className="fixed inset-0 z-40 bg-black/70"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShortcutsOpen(false)}
                    />

                    <motion.div
                        key="shortcut-dialog"
                        className="fixed left-1/2 top-1/2 z-50 w-[560px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 border border-muted bg-background"
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {/* Dialog header */}
                        <div className="flex items-center justify-between border-b border-muted px-4 py-3">
                            <div className="flex items-center gap-2">
                                <Keyboard size={14} className="text-terminal" />
                                <span className="text-[12px] font-medium font-mono">
                                    Keyboard Shortcuts
                                </span>
                            </div>
                            <button
                                onClick={() => setShortcutsOpen(false)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="Close keyboard shortcuts"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Shortcut table */}
                        <div className="p-4 space-y-2">
                            {SHORTCUTS.map((shortcut) => (
                                <div
                                    key={`${shortcut.key}-${shortcut.action}`}
                                    className="flex items-center justify-between gap-4 border border-muted px-3 py-2 text-[11px]"
                                >
                                    <span className="text-muted-foreground">
                                        {shortcut.action}
                                    </span>
                                    <kbd className="border border-muted px-1.5 py-0.5 text-[10px] text-foreground font-mono">
                                        {shortcut.key}
                                    </kbd>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
