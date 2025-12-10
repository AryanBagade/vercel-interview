import fs from "node:fs/promises";
import path from "node:path";

import { MAX_AUTOCOMPLETE_WORD_LIST_PATH } from "./constants";

let cachedWords: string[] | null = null;
let loadPromise: Promise<string[]> | null = null;

function parseWordList(raw: string) {
    return raw.split(/\r?\n/).map((word) => word.trim()).filter((Boolean));
}

async function readWordListFromDisk() {
    const absolutePath = path.join(process.cwd(), MAX_AUTOCOMPLETE_WORD_LIST_PATH);
    const fileContent = await fs.readFile(absolutePath, "utf-8");
    return parseWordList(fileContent);
}

export async function getWordList() {
    if (cachedWords) {
        return cachedWords;
    }
    if (!loadPromise) {
        loadPromise = readWordListFromDisk().then((words) => {
            cachedWords = words;
            return words;
        }).catch((error) => {
            loadPromise = null;
            throw error;
        });
    }
    return loadPromise;
}

