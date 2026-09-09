import { NextResponse, type NextRequest } from "next/server";
import { BookSourceUnavailableError } from "@/lib/booksource";
import { classifyMatch, normalizeTitle } from "@/lib/normalize";
import { partitionNoise } from "@/lib/noise";
import { cachedSearch } from "@/lib/search";
import { computeVerdict, type Verdict } from "@/lib/verdict";

/**
 * GET /api/check?q=<title>
 *
 * The client normalizes before calling, so the URL is canonical and Vercel's
 * CDN can cache the JSON per title on top of the data cache in lib/search.ts.
 * The server normalizes again anyway: it costs nothing and keeps the route
 * safe to call directly.
 */

export const dynamic = "force-dynamic";
/** Three Open Library attempts of up to 7 s each must fit inside one invocation. */
export const maxDuration = 30;

const MAX_QUERY_LENGTH = 200;

/** Successful, non-empty answers: CDN-cache a day, serve stale up to a week. */
const CACHE_OK = "public, s-maxage=86400, stale-while-revalidate=604800";
/** Empty answers and errors are never cached anywhere. */
const CACHE_NONE = "no-store";

export type CheckError = "empty_query" | "too_short" | "too_long" | "unavailable";

export interface CheckOk {
  ok: true;
  query: { main: string };
  verdict: Verdict;
  /** How many records were fetched and judged. */
  checked: number;
  /** How many records the source holds in total, when it says. */
  totalFound: number | null;
}

export interface CheckFailed {
  ok: false;
  error: CheckError;
  message: string;
}

export type CheckResponse = CheckOk | CheckFailed;

function json(body: CheckResponse, status: number, cacheControl: string, extra?: Record<string, string>) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": cacheControl, ...extra },
  });
}

export async function GET(request: NextRequest) {
  const raw = (request.nextUrl.searchParams.get("q") ?? "").trim();

  if (raw.length > MAX_QUERY_LENGTH) {
    return json(
      { ok: false, error: "too_long", message: `Titles longer than ${MAX_QUERY_LENGTH} characters are not supported.` },
      400,
      CACHE_NONE,
    );
  }

  const query = normalizeTitle(raw);
  if (query.main.length === 0) {
    return json({ ok: false, error: "empty_query", message: "Type a title to check." }, 400, CACHE_NONE);
  }
  if (query.main.length < 2) {
    return json({ ok: false, error: "too_short", message: "Type at least two characters." }, 400, CACHE_NONE);
  }

  let result;
  try {
    result = await cachedSearch(query.main);
  } catch (err) {
    if (err instanceof BookSourceUnavailableError) {
      // Server logs are the only place the cause is visible; the client gets
      // a generic message on purpose.
      console.error(`[check] "${query.main}" unavailable: ${err.message}`);
      return json(
        {
          ok: false,
          error: "unavailable",
          message: "Search is temporarily unavailable. Open Library did not answer. Try again in a minute.",
        },
        503,
        CACHE_NONE,
        { "Retry-After": "60" },
      );
    }
    throw err;
  }

  const { works, totalFound } = result;
  const { candidates, noise } = partitionNoise(works);
  const classified = candidates.map((work) => ({
    work,
    kind: classifyMatch(query, normalizeTitle(work.title)),
  }));
  const verdict = computeVerdict(classified, new Date().getFullYear(), noise);

  return json(
    { ok: true, query: { main: query.main }, verdict, checked: works.length, totalFound },
    200,
    works.length === 0 ? CACHE_NONE : CACHE_OK,
  );
}
