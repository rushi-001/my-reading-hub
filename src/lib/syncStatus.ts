import { format, formatDistanceToNowStrict } from "date-fns";
import type { SyncAction } from "@/types/book";

function parseSyncDate(value: string | null) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

export function getLatestSyncTimestamp(...values: Array<string | null>) {
    const dates = values
        .map(parseSyncDate)
        .filter((value): value is Date => Boolean(value))
        .sort((left, right) => right.getTime() - left.getTime());

    return dates.length > 0 ? dates[0].toISOString() : null;
}

export function formatSyncTimestamp(value: string | null, emptyLabel = "Never synced") {
    const date = parseSyncDate(value);
    if (!date) return emptyLabel;
    return format(date, "dd MMM yyyy, hh:mm a");
}

export function formatSyncRelative(
    value: string | null,
    emptyLabel = "Waiting for first sync",
) {
    const date = parseSyncDate(value);
    if (!date) return emptyLabel;
    return formatDistanceToNowStrict(date, { addSuffix: true });
}

export function formatSyncCompactDate(value: string | null, emptyLabel = "Never") {
    const date = parseSyncDate(value);
    if (!date) return emptyLabel;
    return format(date, "dd MMM");
}

export function formatSyncCompactTime(value: string | null, emptyLabel = "No sync") {
    const date = parseSyncDate(value);
    if (!date) return emptyLabel;
    return format(date, "hh:mm a");
}

export function getSyncActionCopy(action: SyncAction) {
    if (action === "push") {
        return {
            title: "Upload to GitHub",
            progressTitle: "Uploading to GitHub...",
            description:
                "Send your latest local books, progress, notes, and settings to GitHub.",
            progressDescription:
                "Your latest local books, progress, notes, and settings are being uploaded to GitHub. Keep this tab open until it finishes.",
            buttonLabel: "Upload to GitHub",
            progressLabel: "Syncing...",
            processingMessage: "Syncing your latest local library changes to GitHub.",
            successTitle: "Upload complete",
            failureTitle: "Upload failed",
        };
    }

    return {
        title: "Download from GitHub",
        progressTitle: "Downloading from GitHub...",
        description:
            "Fetch the latest books, progress, notes, and settings from GitHub and apply them locally.",
        progressDescription:
            "The latest books, progress, notes, and settings are being downloaded from GitHub. Keep this tab open until it finishes.",
        buttonLabel: "Download from GitHub",
        progressLabel: "Pulling...",
        processingMessage: "Pulling the latest library data from GitHub.",
        successTitle: "Download complete",
        failureTitle: "Download failed",
    };
}
