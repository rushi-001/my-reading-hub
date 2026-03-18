import type { Book } from "@/types/book";

export interface ParsedBookQuery {
    raw: string;
    textTokens: string[];
    tagTokens: string[];
    groupTokens: string[];
}

function normalizeToken(token: string) {
    return token.trim().toLowerCase();
}

export function parseBookQuery(query: string): ParsedBookQuery {
    const raw = query.trim();
    const tokens = raw
        .split(/\s+/)
        .map(normalizeToken)
        .filter(Boolean);

    const textTokens: string[] = [];
    const tagTokens: string[] = [];
    const groupTokens: string[] = [];

    for (const token of tokens) {
        if (token.startsWith("tag:") && token.length > 4) {
            tagTokens.push(token.slice(4));
            continue;
        }
        if (token.startsWith("#") && token.length > 1) {
            tagTokens.push(token.slice(1));
            continue;
        }
        if (token.startsWith("group:") && token.length > 6) {
            groupTokens.push(token.slice(6));
            continue;
        }
        textTokens.push(token);
    }

    return { raw, textTokens, tagTokens, groupTokens };
}

export function isBookQueryEmpty(query: ParsedBookQuery) {
    return (
        query.textTokens.length === 0 &&
        query.tagTokens.length === 0 &&
        query.groupTokens.length === 0
    );
}

export function normalizeBookGroup(groupValue: string) {
    const normalized = groupValue.trim();
    return normalized.length > 0 ? normalized : null;
}

export function matchesBookQuery(book: Book, parsed: ParsedBookQuery) {
    if (isBookQueryEmpty(parsed)) return true;

    const tags = (book.tags || []).map((tag) => tag.toLowerCase());
    const group = (book.groupId || "").toLowerCase();
    const searchableText = [
        book.title,
        book.author,
        book.description,
        book.format,
        book.groupId ?? "",
        ...(book.tags || []),
    ]
        .join(" ")
        .toLowerCase();

    const textMatch = parsed.textTokens.every((token) =>
        searchableText.includes(token),
    );
    const tagMatch = parsed.tagTokens.every((token) =>
        tags.some((tag) => tag.includes(token)),
    );
    const groupMatch = parsed.groupTokens.every((token) =>
        group.includes(token),
    );

    return textMatch && tagMatch && groupMatch;
}
