import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useBooks } from "@/store/bookStore";
import type { Book } from "@/types/book";

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

interface CalendarViewProps {
    selectedDate: string | null;
    onSelectDate: (iso: string) => void;
    dateBookMap: Record<string, Book[]>;
    readingCountByDate: Record<string, number>;
}

export function CalendarView({
    selectedDate,
    onSelectDate,
    dateBookMap,
    readingCountByDate,
}: CalendarViewProps) {
    const { settings } = useBooks();
    const today = useMemo(() => new Date(), []);
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());

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

    const heatmapWeeks = useMemo(() => {
        const last365 = Array.from({ length: 365 }, (_, index) =>
            addDays(today, -364 + index),
        );
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

    return (
        <div className="w-full min-w-0">
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
                                                onClick={() => onSelectDate(iso)}
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
                                onClick={() => onSelectDate(iso)}
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
        </div>
    );
}
