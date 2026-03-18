import { CalendarView } from "@/components/CalendarView";
import { useNavigate } from "react-router-dom";

export default function CalendarPage() {
    const navigate = useNavigate();

    return (
        <div className="h-full flex-1 min-h-0 overflow-y-auto p-8">
            {/* Breadcrumb keeps calendar context clear when routed directly. */}
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
            <CalendarView />
        </div>
    );
}
