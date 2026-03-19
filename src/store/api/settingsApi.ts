import type { AppSettings } from "@/types/book";
import { apiClient } from "@/store/api/client";

export interface SettingsResponse {
    settings: AppSettings;
}

// Expected request:
// - method: GET
// - path: /api/settings
// - body: none
//
// Expected response example:
// {
//   "settings": {
//     "showIcons": true,
//     "commandPalettePosition": "top-center",
//     "stackGroups": false,
//     "stackMaxVisible": 3,
//     "autoScrollSpeed": 0,
//     "sidebarVisible": true,
//     "showCalendarHeatmap": true
//   }
// }
export async function fetchSettingsApi(): Promise<SettingsResponse> {
    const { data } = await apiClient.get<SettingsResponse>("/api/settings");
    return data;
}

// Expected request:
// - method: PUT
// - path: /api/settings
// - body (JSON):
//   {
//     "showIcons": true,
//     "commandPalettePosition": "center-center",
//     "stackGroups": false,
//     "stackMaxVisible": 3,
//     "autoScrollSpeed": 0,
//     "sidebarVisible": true,
//     "showCalendarHeatmap": true
//   }
//
// Expected response example:
// {
//   "settings": {
//     "showIcons": true,
//     "commandPalettePosition": "center-center",
//     "stackGroups": false,
//     "stackMaxVisible": 3,
//     "autoScrollSpeed": 0,
//     "sidebarVisible": true,
//     "showCalendarHeatmap": true
//   }
// }
export async function updateSettingsApi(
    settings: AppSettings,
): Promise<SettingsResponse> {
    const { data } = await apiClient.put<SettingsResponse>("/api/settings", settings);
    return data;
}
