import { BookProvider, useBooks } from "@/store/bookStore";
import { LibraryView } from "@/components/LibraryView";
import { BookReaderView } from "@/components/BookReaderView";
import { CommandPalette } from "@/components/CommandPalette";
import { AudioPlayerBar } from "@/components/AudioPlayerBar";
import { SettingsPanel } from "@/components/SettingsPanel";
import { BookOpen, Library, Command as CmdIcon, Settings, Clock } from "lucide-react";

function AppShell() {
    const { currentView, setView, setCommandOpen, activeBook, settings, setSettingsOpen, getLastReadBook, openBook } = useBooks();
    const lastRead = getLastReadBook();

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-mono">
            {/* Sidebar */}
            {settings.sidebarVisible && (
                <aside className="w-12 flex flex-col items-center py-4 gap-2 border-r border-muted bg-sidebar shrink-0">
                    <div className="w-7 h-7 flex items-center justify-center mb-4">
                        <BookOpen size={15} className="text-terminal" />
                    </div>
                    <SideBtn
                        icon={<Library size={15} />}
                        label="Library"
                        active={currentView === "library"}
                        onClick={() => setView("library")}
                    />
                    <SideBtn
                        icon={<CmdIcon size={15} />}
                        label="Search (⌘K)"
                        active={false}
                        onClick={() => setCommandOpen(true)}
                    />
                    {lastRead && (
                        <SideBtn
                            icon={<Clock size={15} />}
                            label={`Continue: ${lastRead.title}`}
                            active={false}
                            onClick={() => openBook(lastRead.id)}
                        />
                    )}
                    <div className="mt-auto">
                        <SideBtn
                            icon={<Settings size={15} />}
                            label="Settings (⌘,)"
                            active={false}
                            onClick={() => setSettingsOpen(true)}
                        />
                    </div>
                </aside>
            )}

            {/* Main content */}
            <div className="flex flex-col flex-1 min-w-0">
                <div className="flex-1 min-h-0 overflow-hidden">
                    {currentView === "library" && <LibraryView />}
                    {currentView === "calendar" && <LibraryView />}
                    {currentView === "reader" && activeBook && <BookReaderView />}
                </div>
                <AudioPlayerBar />
            </div>

            <CommandPalette />
            <SettingsPanel />
        </div>
    );
}

function SideBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void; }) {
    return (
        <button
            title={label}
            onClick={onClick}
            className={`w-8 h-8 flex items-center justify-center transition-colors ${active ? "text-terminal" : "text-muted-foreground hover:text-foreground"}`}
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
