import { apiClient } from "@/store/api/client";
import type { AuthSession } from "@/types/book";

export interface AdminAuthResponse {
    admin: AuthSession;
}

export interface LoginAdminPayload {
    username: string;
    password: string;
}

export interface LogoutAdminPayload {
    adminId?: string;
}

export interface LogoutAdminResponse {
    success: boolean;
}

export async function loginAdminApi(
    payload: LoginAdminPayload,
): Promise<AdminAuthResponse> {
    const { data } = await apiClient.post<AdminAuthResponse>(
        "/api/admin-auth/login",
        payload,
    );
    return data;
}

export async function fetchAdminMeApi(): Promise<AdminAuthResponse> {
    const { data } = await apiClient.get<AdminAuthResponse>("/api/admin-auth/me");
    return data;
}

export async function logoutAdminApi(
    payload?: LogoutAdminPayload,
): Promise<LogoutAdminResponse> {
    const requestBody = payload?.adminId ? payload : {};
    const { data } = await apiClient.post<LogoutAdminResponse>(
        "/api/admin-auth/logout",
        requestBody,
    );
    return data;
}
