import type {
    SyncAppliedSummary,
    SyncCommit,
    SyncRepository,
    SyncSnapshot,
} from "@/types/book";
import { apiClient } from "@/store/api/client";

const DEFAULT_PUSH_MESSAGE = "Sync latest reading data";

export interface PushLibraryResponse {
    repository: SyncRepository;
    snapshot: SyncSnapshot;
    commit: SyncCommit;
}

export interface PullLibraryResponse extends PushLibraryResponse {
    applied: SyncAppliedSummary;
}

export interface SyncCommitsResponse {
    commits: SyncCommit[];
}

export async function pushLibraryApi(
    message = DEFAULT_PUSH_MESSAGE,
): Promise<PushLibraryResponse> {
    const { data } = await apiClient.post<PushLibraryResponse>("/api/github-sync/push", {
        message,
    });
    return data;
}

export async function pullLibraryApi(): Promise<PullLibraryResponse> {
    const { data } = await apiClient.post<PullLibraryResponse>("/api/github-sync/pull");
    return data;
}

export async function fetchSyncCommitsApi(
    limit = 20,
): Promise<SyncCommitsResponse> {
    const { data } = await apiClient.get<SyncCommitsResponse>("/api/github-sync/commits", {
        params: { limit },
    });
    return data;
}
