import { unstable_cache } from "next/cache";
import { searchByTitle, type SearchResult } from "@/lib/booksource";

/**
 * Cached search. This is the only place the app talks to the book source.
 *
 * Every visitor shares one server IP towards Open Library, so the same
 * normalized title must never be fetched twice in a day. Two rules from the
 * spec shape this file:
 *
 *  1. Cache every non-empty result for at least 24 hours (title data does not
 *     change hour to hour).
 *  2. Never cache an empty or failed answer. An outage must not freeze a
 *     false "clear" into the cache, and a nonsense query should not take up
 *     cache space.
 *
 * `unstable_cache` stores whatever the wrapped function returns and stores
 * nothing when it throws. So the wrapped function throws a private sentinel
 * on an empty result, and the public function turns that back into an empty
 * result.
 */

export const SEARCH_REVALIDATE_SECONDS = 86_400; // 24 h

class EmptyResultSentinel extends Error {
  constructor() {
    super("empty result (not cached)");
    this.name = "EmptyResultSentinel";
  }
}

const cachedNonEmptySearch = unstable_cache(
  async (normalizedTitle: string): Promise<SearchResult> => {
    const result = await searchByTitle(normalizedTitle);
    if (result.works.length === 0) throw new EmptyResultSentinel();
    return result;
  },
  // Bump the version whenever SearchResult changes shape, so stale entries
  // from an older deployment are never read back.
  ["booksource-search-v2"],
  { revalidate: SEARCH_REVALIDATE_SECONDS, tags: ["booksource"] },
);

/**
 * @param normalizedTitle the normalized main title (see lib/normalize.ts).
 *   Callers must normalize first so that cache keys are canonical.
 * @throws BookSourceUnavailableError when the source cannot answer.
 */
export async function cachedSearch(normalizedTitle: string): Promise<SearchResult> {
  try {
    return await cachedNonEmptySearch(normalizedTitle);
  } catch (err) {
    if (err instanceof EmptyResultSentinel) return { works: [], totalFound: 0 };
    throw err;
  }
}
