import type { PdfTheme } from "@/types/book";

export const PDF_THEME_OPTIONS: Array<{
    value: PdfTheme;
    label: string;
}> = [
    { value: "original", label: "Original" },
    { value: "dark", label: "Dark" },
    { value: "light", label: "Light" },
    { value: "sepia_invert", label: "Sepia Invert" },
];

const PDF_THEME_VALUES = new Set<PdfTheme>(
    PDF_THEME_OPTIONS.map((option) => option.value),
);

export function normalizePdfTheme(value: unknown): PdfTheme {
    if (typeof value !== "string") {
        return "original";
    }

    const normalizedValue = value.trim().toLowerCase();
    if (normalizedValue === "sepia-invert") {
        return "sepia_invert";
    }
    if (normalizedValue === "sepia") {
        return "light";
    }
    if (PDF_THEME_VALUES.has(normalizedValue as PdfTheme)) {
        return normalizedValue as PdfTheme;
    }

    return "original";
}
