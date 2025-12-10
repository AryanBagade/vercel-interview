import { MAX_AUTOCOMPLETE_RESULTS } from "./constants";

function lowerBound(words: string[], prefix: string) {
    let low = 0;
    let high = words.length;
    while (low < high) {
        const mid = Math.floor((low + high) / 2);
        // Compare lowercase versions for case-insensitive binary search
        if (words[mid].toLowerCase() < prefix) {
            low = mid + 1;
        } else {
            high = mid;
        }
    }
    return low;
}

export function findPrefixMatches(words: string[], rawQuery: string, limit = MAX_AUTOCOMPLETE_RESULTS) {
    const normalizedQuery = rawQuery.toLowerCase();
    if (!normalizedQuery.length) return [];

    const matches: string[] = [];
    const startIndex = lowerBound(words, normalizedQuery);
    for (let i = startIndex; i < words.length && matches.length < limit; i++) {
        const candidate = words[i];
        const normalizedCandidate = candidate.toLowerCase();
        if (!normalizedCandidate.startsWith(normalizedQuery)) break;
        matches.push(candidate);
        if (matches.length >= limit) break;
    }
    return matches;
}
