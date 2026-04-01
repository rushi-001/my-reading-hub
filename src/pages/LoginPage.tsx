import { FormEvent, useMemo, useState } from "react";
import {
    ArrowRight,
    Github,
    LockKeyhole,
    ShieldCheck,
    UserRound,
} from "lucide-react";
import { isAxiosError } from "axios";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { loginAdminApi } from "@/store/api";
import { type AppDispatch } from "@/store/appStore";
import { bootstrapRequested } from "@/store/bookSagaActions";
import { bookActions } from "@/store/bookSlice";

interface LoginLocationState {
    from?: string;
}

function resolveRedirectTarget(state: unknown) {
    const candidate = state as LoginLocationState | null;
    if (!candidate?.from || !candidate.from.startsWith("/")) {
        return "/library";
    }
    return candidate.from;
}

export default function LoginPage() {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const location = useLocation();
    const redirectTarget = useMemo(
        () => resolveRedirectTarget(location.state),
        [location.state],
    );

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const normalizedUsername = username.trim().toLowerCase();
        if (!normalizedUsername) {
            setError("Enter the admin username to continue.");
            return;
        }
        if (!password.trim()) {
            setError("Enter your password to continue.");
            return;
        }

        setError("");
        setIsSubmitting(true);

        try {
            await loginAdminApi({
                username: normalizedUsername,
                password,
            });
            dispatch(bookActions.setAuthChecking(true));
            dispatch(bootstrapRequested());
            navigate(redirectTarget, { replace: true });
        } catch (requestError) {
            setError(
                isAxiosError<{ message?: string }>(requestError)
                    ? (requestError.response?.data?.message ??
                          "Unable to sign in with the admin account.")
                    : "Unable to sign in with the admin account.",
            );
            setIsSubmitting(false);
        }
    };

    return (
        <div className="h-[100dvh] overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.14),transparent_32%),linear-gradient(180deg,hsl(var(--surface-1))_0%,hsl(var(--background))_58%)]">
            <div className="flex min-h-full w-full items-start justify-center px-4 py-10 lg:items-center">
                <div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-muted bg-background/90 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] lg:grid-cols-[1.1fr_0.9fr]">
                    <section className="relative border-b border-muted px-6 py-8 sm:px-8 lg:border-b-0 lg:border-r lg:px-10 lg:py-10">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,197,94,0.12),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.08),transparent_18%)]" />

                        <div className="relative">
                            <div className="flex items-center gap-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                                    <img
                                        src="/logo.png"
                                        alt="My Reading Hub"
                                        className="h-12 w-12 object-contain"
                                    />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-[0.28em] text-terminal">
                                        Personal Reading OS
                                    </p>
                                    <h1 className="mt-2 font-['Newsreader'] text-4xl leading-none tracking-tight text-foreground sm:text-5xl">
                                        Pick up exactly where you left off.
                                    </h1>
                                </div>
                            </div>

                            <p className="mt-6 max-w-xl text-[13px] leading-6 text-muted-foreground">
                                Keep your library, notes, reading progress, and
                                GitHub sync controls in one place. Created by
                                Rushi Panchl.
                            </p>

                            <div className="mt-8 grid gap-3 sm:grid-cols-3">
                                <FeatureCard
                                    icon={<Github size={15} />}
                                    title="Two-way Sync"
                                    description="Separate upload and download actions so it is always clear what will happen."
                                />
                                <FeatureCard
                                    icon={<ShieldCheck size={15} />}
                                    title="Safe Backups"
                                    description="Sync actions still ask for confirmation and show live processing state."
                                />
                            </div>
                        </div>
                    </section>

                    <section className="px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
                        <div className="mx-auto w-full max-w-md">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                                    Sign In
                                </p>
                                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                                    Open your workspace
                                </h2>
                                <p className="mt-2 text-[12px] leading-5 text-muted-foreground">
                                    Sign in with the backend-powered admin
                                    account. This form now uses the real admin
                                    auth API and opens the app only after the
                                    server session is ready.
                                </p>
                            </div>

                            <form
                                className="mt-8 space-y-4"
                                onSubmit={handleSubmit}
                            >
                                <label className="block space-y-2">
                                    <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                                        Admin Username
                                    </span>
                                    <div className="flex items-center gap-3 border border-muted bg-surface-1 px-3 py-3 transition-colors focus-within:border-terminal">
                                        <UserRound
                                            size={14}
                                            className="shrink-0 text-terminal"
                                        />
                                        <input
                                            type="text"
                                            autoComplete="username"
                                            value={username}
                                            onChange={(event) =>
                                                setUsername(event.target.value)
                                            }
                                            placeholder="admin"
                                            className="w-full bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
                                        />
                                    </div>
                                </label>

                                <label className="block space-y-2">
                                    <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                                        Password
                                    </span>
                                    <div className="flex items-center gap-3 border border-muted bg-surface-1 px-3 py-3 transition-colors focus-within:border-terminal">
                                        <LockKeyhole
                                            size={14}
                                            className="shrink-0 text-terminal"
                                        />
                                        <input
                                            type="password"
                                            autoComplete="current-password"
                                            value={password}
                                            onChange={(event) =>
                                                setPassword(event.target.value)
                                            }
                                            placeholder="Enter password"
                                            className="w-full bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
                                        />
                                    </div>
                                </label>

                                {error && (
                                    <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
                                        {error}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex w-full items-center justify-center gap-2 border border-terminal/70 bg-terminal/10 px-4 py-3 text-[12px] font-medium text-terminal transition-colors hover:bg-terminal/20 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    <span>
                                        {isSubmitting
                                            ? "Opening workspace..."
                                            : "Enter Workspace"}
                                    </span>
                                    <ArrowRight size={14} />
                                </button>
                            </form>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

function FeatureCard({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="rounded-2xl border border-muted bg-surface-1/70 p-4">
            <div className="flex items-center gap-2 text-terminal">
                {icon}
                <p className="text-[11px] uppercase tracking-[0.2em]">
                    {title}
                </p>
            </div>
            <p className="mt-3 text-[12px] leading-5 text-muted-foreground">
                {description}
            </p>
        </div>
    );
}
