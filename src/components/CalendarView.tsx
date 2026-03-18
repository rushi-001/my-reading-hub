import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useBooks } from "@/store/bookStore";

const MONTHS = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDay(year: number, month: number) {
    return new Date(year, month, 1).getDay();
}

function toISO(date: Date) {
    return date.toISOString().split("T")[0];
}

export function CalendarView() {
    const { books, openBook } = useBooks();
    const today = new Date();
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const [selectedDate, setSelectedDate] = useState<string | null>(toISO(today));

    // Map: date ISO => books read that day
    const dateBookMap: Record<string, typeof books> = {};
    books.forEach((book) => {
        (book.readingDates || []).forEach((d) => {
            if (!dateBookMap[d]) dateBookMap[d] = [];
            dateBookMap[d].push(book);
        });
    });

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
        else setViewMonth(viewMonth - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
        else setViewMonth(viewMonth + 1);
    };

    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDay(viewYear, viewMonth);
    const todayISO = toISO(today);

    const booksOnSelected = selectedDate ? (dateBookMap[selectedDate] || []) : [];

    return (
        <div className="max-w-2xl">
            {/* Calendar header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-[12px] font-mono font-medium">
                    {MONTHS[viewMonth]} {viewYear}
                </h2>
                <div className="flex gap-1">
                    <button
                        onClick={prevMonth}
                        className="border border-muted p-1.5 text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
                    >
                        <ChevronLeft size={13} />
                    </button>
                    <button
                        onClick={nextMonth}
                        className="border border-muted p-1.5 text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
                    >
                        <ChevronRight size={13} />
                    </button>
                </div>
            </div>

            {/* Day labels */}
            <div className="grid grid-cols-7 mb-1">
                {DAYS.map((d) => (
                    <div key={d} className="text-center text-[10px] text-muted-foreground py-1 font-mono uppercase">
                        {d}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-px bg-muted">
                {/* Empty cells before first day */}
                {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="bg-background h-16" />
                ))}
                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const booksRead = dateBookMap[iso] || [];
                    const isToday = iso === todayISO;
                    const isSelected = iso === selectedDate;
                    return (
                        <button
                            key={iso}
                            onClick={() => setSelectedDate(iso)}
                            className={`bg-background relative h-16 flex flex-col p-1 text-left transition-colors hover:bg-surface-1 ${
                                isSelected ? "ring-1 ring-terminal" : ""
                            }`}
                        >
                            <span className={`text-[11px] font-mono mb-1 ${
                                isToday ? "text-terminal font-bold" : "text-muted-foreground"
                            }`}>
                                {day}
                            </span>
                            {/* Book covers as tiny dots/thumbnails */}
                            <div className="flex flex-wrap gap-0.5 overflow-hidden">
                                {booksRead.slice(0, 4).map((book) => (
                                    <div
                                        key={book.id}
                                        className="w-3 h-4 border border-muted/50 overflow-hidden shrink-0"
                                        title={book.title}
                                    >
                                        {book.cover ? (
                                            <img src={book.cover} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-terminal/30" />
                                        )}
                                    </div>
                                ))}
                                {booksRead.length > 4 && (
                                    <span className="text-[9px] text-terminal">+{booksRead.length - 4}</span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Selected date details */}
            {selectedDate && (
                <div className="mt-6 border border-muted p-4">
                    <p className="text-[11px] text-muted-foreground mb-3 font-mono uppercase tracking-widest">
                        {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                            weekday: "long", year: "numeric", month: "long", day: "numeric"
                        })}
                    </p>
                    {booksOnSelected.length === 0 ? (
                        <p className="text-[12px] text-muted-foreground">No reading activity recorded.</p>
                    ) : (
                        <div className="space-y-2">
                            {booksOnSelected.map((book) => (
                                <button
                                    key={book.id}
                                    onClick={() => openBook(book.id)}
                                    className="flex items-center gap-3 w-full text-left border border-muted p-2 hover:border-muted-foreground hover:bg-surface-1 transition-colors group"
                                >
                                    <div className="w-8 h-11 border border-muted/50 overflow-hidden shrink-0 bg-surface-2">
                                        {book.cover ? (
                                            <img src={book.cover} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-surface-3 flex items-center justify-center">
                                                <span className="text-[8px] text-muted-foreground font-mono">
                                                    {book.title.slice(0, 2).toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[12px] text-foreground truncate">{book.title}</p>
                                        <p className="text-[11px] text-muted-foreground truncate">{book.author}</p>
                                        <div className="mt-1 h-px bg-muted w-full overflow-hidden">
                                            <div className="h-full bg-terminal" style={{ width: `${book.progress}%` }} />
                                        </div>
                                    </div>
                                    <span className="text-[11px] text-terminal tabular-nums shrink-0">{book.progress}%</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
