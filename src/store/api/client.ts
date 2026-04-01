import axios from "axios";

const rawApiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").trim();

function resolveApiBaseUrl() {
    if (!rawApiBaseUrl) return "";
    if (!import.meta.env.DEV) return rawApiBaseUrl;

    try {
        const parsed = new URL(rawApiBaseUrl);
        const isLocalBackend =
            (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") &&
            (parsed.protocol === "http:" || parsed.protocol === "https:");

        // In local development we prefer the Vite proxy for localhost targets so
        // cookie-based auth stays same-origin and avoids browser CORS blocking.
        if (isLocalBackend) {
            return "";
        }
    } catch {
        // Fall back to the raw value if the env is not a full URL.
    }

    return rawApiBaseUrl;
}

const API_BASE_URL = resolveApiBaseUrl();

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        Accept: "application/json",
    },
});
