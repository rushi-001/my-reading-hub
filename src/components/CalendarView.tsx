import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useBooks } from "@/store/bookStore";
import { useNavigate } from "react-router-dom";

const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDay(year: number, month: number) {
    return new Date(year, month, 1).getDay();
}

function toISO(date: Date) {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10);
}

function addDays(date: Date, amount: number) {
    const clone = new Date(date);
    clone.setDate(clone.getDate() + amount);
    return clone;
}

function getHeatClass(count: number) {
    if (count <= 0) return "bg-muted/30";
    if (count === 1) return "bg-terminal/30";
    if (count === 2) return "bg-terminal/50";
    if (count === 3) return "bg-terminal/70";
    return "bg-terminal";
}

export function CalendarView() {
    const { books, openBook, settings } = useBooks();
    const navigate = useNavigate();
    const today = useMemo(() => new Date(), []);
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const [selectedDate, setSelectedDate] = useState<string | null>(toISO(today));

    // Build date lookup maps used by both month grid and heatmap.
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

    const prevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear(viewYear - 1);
            return;
        }
        setViewMonth(viewMonth - 1);
    };

    const nextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear(viewYear + 1);
            return;
        }
        setViewMonth(viewMonth + 1);
    };

    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDay(viewYear, viewMonth);
    const todayISO = toISO(today);
    const booksOnSelected = selectedDate ? dateBookMap[selectedDate] || [] : [];

    // Last 365 days, padded into week columns.
    const heatmapWeeks = useMemo(() => {
        const last365 = Array.from({ length: 365 }, (_, index) => addDays(today, -364 + index));
        const firstWeekday = last365[0].getDay();
        const padded: Array<Date | null> = [
            ...Array.from({ length: firstWeekday }, () => null),
            ...last365,
        ];
        while (padded.length % 7 !== 0) padded.push(null);
        const weeks: Array<Array<Date | null>> = [];
        for (let index = 0; index < padded.length; index += 7) {
            weeks.push(padded.slice(index, index + 7));
        }
        return weeks;
    }, [today]);

    const openBookFromCalendar = (bookId: string) => {
        openBook(bookId);
        navigate(`/reader/${bookId}`);
    };

    return (
        <div className="max-w-6xl">
            {/* Optional GitHub-style yearly heatmap */}
            {settings.showCalendarHeatmap && (
                <div className="mb-8 border border-muted p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono">
                            Reading Activity (Last 365 Days)
                        </h3>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span>Less</span>
                            {[0, 1, 2, 3, 4].map((level) => (
                                <span
                                    key={level}
                                    className={`w-2.5 h-2.5 rounded-full ${getHeatClass(level)}`}
                                />
                            ))}
                            <span>More</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <div className="inline-flex gap-1 min-w-full">
                            {heatmapWeeks.map((week, weekIndex) => (
                                <div key={`week-${weekIndex}`} className="flex flex-col gap-1">
                                    {week.map((day, dayIndex) => {
                                        if (!day) {
                                            return (
                                                <div
                                                    key={`empty-${weekIndex}-${dayIndex}`}
                                                    className="w-2.5 h-2.5 rounded-full bg-transparent"
                                                />
                                            );
                                        }
                                        const iso = toISO(day);
                                        const count = readingCountByDate[iso] ?? 0;
                                        return (
                                            <button
                                                key={iso}
                                                onClick={() => setSelectedDate(iso)}
                                                className={`w-2.5 h-2.5 rounded-full transition-transform hover:scale-125 ${getHeatClass(
                                                    count,
                                                )} ${selectedDate === iso ? "ring-1 ring-terminal" : ""}`}
                                                title={`${iso}: ${count} reading hit${count === 1 ? "" : "s"}`}
                                                aria-label={`${iso}: ${count} reading hit${count === 1 ? "" : "s"}`}
                                            />
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] items-start">
                {/* Month calendar */}
                <section>
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

                    <div className="grid grid-cols-7 mb-1">
                        {DAYS.map((day) => (
                            <div
                                key={day}
                                className="text-center text-[10px] text-muted-foreground py-1 font-mono uppercase"
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-px bg-muted">
                        {Array.from({ length: firstDay }).map((_, index) => (
                            <div key={`empty-${index}`} className="bg-background h-16" />
                        ))}

                        {Array.from({ length: daysInMonth }).map((_, index) => {
                            const day = index + 1;
                            const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(
                                2,
                                "0",
                            )}`;
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
                                    <span
                                        className={`text-[11px] font-mono mb-1 ${
                                            isToday ? "text-terminal font-bold" : "text-muted-foreground"
                                        }`}
                                    >
                                        {day}
                                    </span>
                                    <div className="flex flex-wrap gap-1 overflow-hidden">
                                        {Array.from({ length: Math.min(4, booksRead.length) }).map((__, dotIndex) => (
                                            <span
                                                key={`${iso}-dot-${dotIndex}`}
                                                className="w-1.5 h-1.5 rounded-full bg-terminal/70"
                                            />
                                        ))}
                                        {booksRead.length > 4 && (
                                            <span className="text-[9px] text-terminal">
                                                +{booksRead.length - 4}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Selected day details on the right */}
                <aside className="border border-muted p-4 lg:sticky lg:top-2 bg-background">
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
                                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
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
