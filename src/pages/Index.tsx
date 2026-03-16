import { BookProvider, useBooks } from "@/store/bookStore";
import { LibraryView } from "@/components/LibraryView";
import { BookReaderView } from "@/components/BookReaderView";
import { CommandPalette } from "@/components/CommandPalette";
import { AudioPlayerBar } from "@/components/AudioPlayerBar";
import { BookOpen, Library, Command as CmdIcon } from "lucide-react";

function AppShell() {
    const { currentView, setView, setCommandOpen, activeBook } = useBooks();

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-mono">
            {/* Sidebar */}
            <aside className="w-12 flex flex-col items-center py-4 gap-2 border-r border-muted bg-sidebar shrink-0">
                <div className="w-7 h-7 flex items-center justify-center mb-4">
                    <BookOpen size={14} className="text-terminal" />
                </div>
                <SideBtn
                    icon={<Library size={13} />}
                    label="Library"
                    active={currentView === "library"}
                    onClick={() => setView("library")}
                />
                <SideBtn
                    icon={<CmdIcon size={13} />}
                    label="Search"
                    active={false}
                    onClick={() => setCommandOpen(true)}
                />
                <div className="mt-auto text-[8px] text-muted-foreground/40 font-mono writing-mode-vertical text-center">
                    ⌘K
                </div>
            </aside>

            {/* Main content */}
            <div className="flex flex-col flex-1 min-w-0">
                {/* View area */}
                <div className="flex-1 min-h-0 overflow-hidden">
                    {currentView === "library" && <LibraryView />}
                    {currentView === "reader" && activeBook && (
                        <BookReaderView />
                    )}
                </div>
                {/* Audio bar */}
                <AudioPlayerBar />
            </div>

            {/* Command Palette */}
            <CommandPalette />
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
    return (
        <BookProvider>
            <AppShell />
        </BookProvider>
    );
}
