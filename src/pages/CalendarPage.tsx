import { useMemo, useState } from "react";
import { CalendarView } from "@/components/CalendarView";
import { useBooks } from "@/store/bookStore";
import { useNavigate } from "react-router-dom";

function toISO(date: Date) {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10);
}

export default function CalendarPage() {
    const { books, openBook } = useBooks();
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState<string | null>(() =>
        toISO(new Date()),
    );

    // Shared reading maps for both the calendar grid and right-side details panel.
    const { dateBookMap, readingCountByDate } = useMemo(() => {
        const byDate: Record<string, typeof books> = {};
        const counts: Record<string, number> = {};

        for (const book of books) {
            for (const date of book.readingDates || []) {
                if (!byDate[date]) byDate[date] = [];
                byDate[date].push(book);
                counts[date] = (counts[date] ?? 0) + 1;
            }
        }
        return { dateBookMap: byDate, readingCountByDate: counts };
    }, [books]);

    const booksOnSelected = selectedDate ? dateBookMap[selectedDate] || [] : [];

    const openBookFromCalendar = (bookId: string) => {
        openBook(bookId);
        navigate(`/reader/${bookId}`);
    };

    return (
        <div className="h-full flex-1 min-h-0 overflow-y-auto p-8">
            <div className="flex items-center gap-3 mb-8">
                <button
                    onClick={() => navigate("/library")}
                    className="text-muted-foreground hover:text-foreground transition-colors text-[12px] font-mono"
                >
                    {"<- Library"}
                </button>
                <span className="text-muted-foreground/40">/</span>
                <span className="text-[12px] font-mono">Reading Calendar</span>
            </div>

            {/* Responsive two-pane layout: calendar left, details right */}
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px] items-start">
                <div className="min-w-0">
                    <CalendarView
                        selectedDate={selectedDate}
                        onSelectDate={setSelectedDate}
                        dateBookMap={dateBookMap}
                        readingCountByDate={readingCountByDate}
                    />
                </div>

                <aside className="min-w-0 border border-muted p-4 bg-background xl:sticky xl:top-2">
                    <p className="text-[10px] text-muted-foreground mb-3 font-mono uppercase tracking-widest">
                        Selected Day
                    </p>
                    {selectedDate ? (
                        <>
                            <p className="text-[11px] text-muted-foreground mb-3 font-mono uppercase tracking-widest">
                                {new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en-US", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                })}
                            </p>

                            {booksOnSelected.length === 0 ? (
                                <p className="text-[12px] text-muted-foreground">
                                    No reading activity recorded.
                                </p>
                            ) : (
                                <div className="space-y-2 xl:max-h-[65vh] xl:overflow-y-auto xl:pr-1">
                                    {booksOnSelected.map((book) => (
                                        <button
                                            key={book.id}
                                            onClick={() => openBookFromCalendar(book.id)}
                                            className="flex items-center gap-3 w-full text-left border border-muted p-2 hover:border-muted-foreground hover:bg-surface-1 transition-colors group"
                                        >
                                            <div className="w-8 h-11 border border-muted/50 overflow-hidden shrink-0 bg-surface-2">
                                                {book.cover ? (
                                                    <img
                                                        src={book.cover}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-surface-3 flex items-center justify-center">
                                                        <span className="text-[8px] text-muted-foreground font-mono">
                                                            {book.title.slice(0, 2).toUpperCase()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[12px] text-foreground truncate">
                                                    {book.title}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground truncate">
                                                    {book.author}
                                                </p>
                                                <div className="mt-1 h-px bg-muted w-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-terminal"
                                                        style={{ width: `${book.progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <span className="text-[11px] text-terminal tabular-nums shrink-0">
                                                {book.progress}%
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-[12px] text-muted-foreground">
                            Pick a day from the calendar.
                        </p>
                    )}
                </aside>
            </div>
        </div>
    );
}
