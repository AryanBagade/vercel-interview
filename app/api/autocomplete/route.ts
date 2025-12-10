import { NextRequest, NextResponse } from "next/server";

import { MAX_AUTOCOMPLETE_RESULTS, MIN_QUERY_LENGTH } from "@/lib/constants";

import { findPrefixMatches } from "@/lib/autocomplete";
import { getWordList } from "@/lib/wordlist";

export const dynamic = "force-dynamic";

//function defination

export async function GET(request: NextRequest) {
    const query = (request.nextUrl.searchParams.get("q") ?? "").trim();

    if (query.length < MIN_QUERY_LENGTH) {
        return NextResponse.json({
            results: [],
            meta: {
                minQueryLength: MIN_QUERY_LENGTH,
                truncated: false,
            }
        });
    }

    try {
        const words = await getWordList();
        const matches = findPrefixMatches(words, query, MAX_AUTOCOMPLETE_RESULTS);

        return NextResponse.json({
            results: matches,
            meta: {
                minQueryLength: MIN_QUERY_LENGTH,
                truncated: matches.length === MAX_AUTOCOMPLETE_RESULTS,
            }
        });
    } catch (error) {
        console.error("Autocomplete API error:", error);
        return NextResponse.json({
            results: [],
            meta: {
                minQueryLength: MIN_QUERY_LENGTH,
                truncated: false,
            }
        }, { status: 500 });
    }
}


