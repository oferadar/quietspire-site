import { SITE_URL, SUPPORT_EMAIL } from "@/lib/site";
import { BookSourceUnavailableError, type SearchResult, type WorkResult } from "./types";

/**
 * Open Library implementation of the book source.
 *
 * This is the ONLY file that knows Open Library's HTTP API exists. It does no
 * caching of its own: the caller (lib/search.ts) decides what to cache and
 * for how long, because "never cache an empty or failed answer" is a product
 * rule, not a transport detail.
 */

const ENDPOINT = "https://openlibrary.org/search.json";
const FIELDS = "key,title,subtitle,author_name,first_publish_year,edition_count,cover_i";
const LIMIT = 50;
/** Open Library routinely takes 2-5 s and sometimes hangs. Fail before the platform does. */
const TIMEOUT_MS = 12000;
/** Open Library asks heavy users to identify themselves. No personal data here. */
const USER_AGENT = `BookTitleChecker/1.0 (+${SITE_URL}; ${SUPPORT_EMAIL})`;

interface OpenLibraryDoc {
  key?: unknown;
  title?: unknown;
  subtitle?: unknown;
  author_name?: unknown;
  first_publish_year?: unknown;
  edition_count?: unknown;
  cover_i?: unknown;
}

function asString(v: unknown): string | undefined {
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : undefined;
}

function asInt(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? Math.trunc(v) : undefined;
}

function toWork(doc: OpenLibraryDoc): WorkResult | null {
  const key = asString(doc.key);
  const title = asString(doc.title);
  if (!key || !title) return null;
  const authors = Array.isArray(doc.author_name)
    ? doc.author_name.filter((a): a is string => typeof a === "string" && a.trim().length > 0)
    : [];
  return {
    key,
    title,
    subtitle: asString(doc.subtitle),
    authors,
    firstPublishYear: asInt(doc.first_publish_year),
    editionCount: asInt(doc.edition_count) ?? 0,
    coverId: asInt(doc.cover_i),
  };
}

export function parseSearchResponse(json: unknown): SearchResult {
  if (typeof json !== "object" || json === null) {
    throw new BookSourceUnavailableError("Open Library returned a non-object body");
  }
  const body = json as { docs?: unknown; numFound?: unknown };
  if (!Array.isArray(body.docs)) {
    throw new BookSourceUnavailableError("Open Library response has no docs array");
  }
  const seen = new Set<string>();
  const works: WorkResult[] = [];
  for (const doc of body.docs) {
    const work = toWork(doc as OpenLibraryDoc);
    if (!work || seen.has(work.key)) continue;
    seen.add(work.key);
    works.push(work);
  }
  return { works, totalFound: asInt(body.numFound) ?? null };
}

export async function searchByTitle(title: string): Promise<SearchResult> {
  const url = new URL(ENDPOINT);
  url.searchParams.set("title", title);
  url.searchParams.set("fields", FIELDS);
  url.searchParams.set("limit", String(LIMIT));

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      // Caching is handled one layer up so that empty and failed answers are
      // never stored. Do not let Next's fetch cache do it here.
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    throw new BookSourceUnavailableError("Open Library did not respond", err);
  }

  if (!res.ok) {
    throw new BookSourceUnavailableError(`Open Library answered HTTP ${res.status}`);
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch (err) {
    throw new BookSourceUnavailableError("Open Library returned invalid JSON", err);
  }

  return parseSearchResponse(json);
}
