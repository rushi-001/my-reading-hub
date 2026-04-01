import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
    BrowserRouter,
    Navigate,
    Outlet,
    Route,
    Routes,
    useLocation,
} from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useBooks } from "@/store/bookStore";
import Index from "./pages/Index.tsx";
import LibraryPage from "./pages/LibraryPage.tsx";
import CalendarPage from "./pages/CalendarPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import ReaderPage from "./pages/ReaderPage.tsx";
import SyncHistoryPage from "./pages/SyncHistoryPage.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

function ProtectedRoute() {
    const { auth } = useBooks();
    const location = useLocation();

    if (auth.isChecking) {
        return <AuthGateScreen label="Checking admin session..." />;
    }

    if (!auth.isAuthenticated) {
        const from = `${location.pathname}${location.search}${location.hash}`;
        return <Navigate to="/login" replace state={{ from }} />;
    }

    return <Outlet />;
}

function GuestRoute() {
    const { auth } = useBooks();

    if (auth.isChecking) {
        return <AuthGateScreen label="Checking admin session..." />;
    }

    if (auth.isAuthenticated) {
        return <Navigate to="/library" replace />;
    }

    return <Outlet />;
}

function AuthGateScreen({ label }: { label: string }) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-6">
            <p className="text-[12px] text-muted-foreground">{label}</p>
        </div>
    );
}

const App = () => (
    <QueryClientProvider client={queryClient}>
        <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
                <Routes>
                    <Route element={<GuestRoute />}>
                        <Route path="/login" element={<LoginPage />} />
                    </Route>

                    <Route element={<ProtectedRoute />}>
                        <Route path="/" element={<Index />}>
                            <Route index element={<Navigate to="/library" replace />} />
                            <Route path="library" element={<LibraryPage />} />
                            <Route path="calendar" element={<CalendarPage />} />
                            <Route path="sync-history" element={<SyncHistoryPage />} />
                            <Route path="reader/:bookId" element={<ReaderPage />} />
                        </Route>
                    </Route>

                    <Route path="*" element={<NotFound />} />
                </Routes>
            </BrowserRouter>
        </TooltipProvider>
    </QueryClientProvider>
);

export default App;
