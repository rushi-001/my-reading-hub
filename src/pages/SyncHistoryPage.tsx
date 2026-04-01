import { useCallback, useEffect, useState } from "react";
import {
    ExternalLink,
    Github,
    History,
    RefreshCw,
    ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchSyncCommitsApi } from "@/store/api";
import { formatSyncRelative, formatSyncTimestamp } from "@/lib/syncStatus";
import type { SyncCommit } from "@/types/book";

const COMMITS_LIMIT = 20;

function shortSha(sha: string) {
    return sha.slice(0, 7);
}

export default function SyncHistoryPage() {
    const navigate = useNavigate();
    const [commits, setCommits] = useState<SyncCommit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const loadCommits = useCallback(async () => {
        setIsLoading(true);
        setError("");

        try {
            const result = await fetchSyncCommitsApi(COMMITS_LIMIT);
            setCommits(result.commits ?? []);
        } catch (requestError) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "Unable to load sync history.",
            );
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadCommits();
    }, [loadCommits]);

    return (
        <div className="h-full flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-3 mb-6 sm:mb-8 flex-wrap">
                <button
                    onClick={() => navigate("/library")}
                    className="text-muted-foreground hover:text-foreground transition-colors text-[12px] font-mono"
                >
                    {"<- Library"}
                </button>
                <span className="text-muted-foreground/40">/</span>
                <span className="text-[12px] font-mono">GitHub Sync History</span>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
                <section className="min-w-0 space-y-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div>
                            <h1 className="text-[13px] font-medium tracking-tight">
                                Recent Sync Commits
                            </h1>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                                Showing the latest {COMMITS_LIMIT} GitHub sync commits.
                            </p>
                        </div>

                        <button
                            onClick={() => void loadCommits()}
                            disabled={isLoading}
                            className="flex items-center gap-2 border border-muted px-3 py-2 text-[11px] text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <RefreshCw
                                size={13}
                                className={isLoading ? "animate-spin" : ""}
                            />
                            Refresh
                        </button>
                    </div>

                    {error && (
                        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-[11px] text-destructive">
                            {error}
                        </div>
                    )}

                    {isLoading && commits.length === 0 ? (
                        <div className="rounded-2xl border border-muted bg-surface-1/70 p-8 text-center text-[12px] text-muted-foreground">
                            Loading sync commits...
                        </div>
                    ) : commits.length === 0 ? (
                        <div className="rounded-2xl border border-muted bg-surface-1/70 p-8 text-center">
                            <History
                                size={24}
                                className="mx-auto text-muted-foreground/50"
                            />
                            <p className="mt-3 text-[12px] text-muted-foreground">
                                No sync commits found yet.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {commits.map((commit) => (
                                <article
                                    key={commit.sha}
                                    className="rounded-2xl border border-muted bg-surface-1/70 p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="inline-flex items-center gap-1 rounded-full border border-terminal/30 bg-terminal/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-terminal">
                                                    <Github size={10} />
                                                    {shortSha(commit.sha)}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {formatSyncRelative(commit.date)}
                                                </span>
                                            </div>
                                            <h2 className="mt-3 text-[13px] font-medium text-foreground">
                                                {commit.message}
                                            </h2>
                                        </div>

                                        <a
                                            href={commit.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex shrink-0 items-center gap-1 border border-muted px-2.5 py-1.5 text-[10px] text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground"
                                        >
                                            Open
                                            <ExternalLink size={11} />
                                        </a>
                                    </div>

                                    <div className="mt-4 grid gap-2 text-[11px] text-muted-foreground sm:grid-cols-3">
                                        <div className="rounded-xl border border-muted bg-background/70 px-3 py-2">
                                            <p className="text-[10px] uppercase tracking-[0.18em]">
                                                Author
                                            </p>
                                            <p className="mt-1 text-foreground">
                                                {commit.author}
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-muted bg-background/70 px-3 py-2">
                                            <p className="text-[10px] uppercase tracking-[0.18em]">
                                                Date
                                            </p>
                                            <p className="mt-1 text-foreground">
                                                {formatSyncTimestamp(commit.date)}
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-muted bg-background/70 px-3 py-2">
                                            <p className="text-[10px] uppercase tracking-[0.18em]">
                                                SHA
                                            </p>
                                            <p className="mt-1 truncate font-mono text-foreground">
                                                {commit.sha}
                                            </p>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                <aside className="min-w-0 rounded-2xl border border-muted bg-surface-1/70 p-4 xl:sticky xl:top-2">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                        About This Page
                    </p>
                    <div className="mt-4 space-y-3 text-[11px] text-muted-foreground">
                        <div className="flex items-start gap-2">
                            <Github size={14} className="mt-0.5 shrink-0 text-terminal" />
                            <p>
                                This view reads the latest commit history from
                                `/api/github-sync/commits`.
                            </p>
                        </div>
                        <div className="flex items-start gap-2">
                            <History size={14} className="mt-0.5 shrink-0 text-terminal" />
                            <p>
                                Use it to verify when syncs happened and which
                                message was committed to GitHub.
                            </p>
                        </div>
                        <div className="flex items-start gap-2">
                            <ShieldCheck
                                size={14}
                                className="mt-0.5 shrink-0 text-terminal"
                            />
                            <p>
                                Upload and download actions still live in the
                                sidebar, settings, and command palette.
                            </p>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
