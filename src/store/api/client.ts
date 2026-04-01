import axios from "axios";

const rawApiBaseUrl = (
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8484"
).trim();

function resolveApiBaseUrl() {
    if (!rawApiBaseUrl) return "";
    if (!import.meta.env.DEV) return rawApiBaseUrl;

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
