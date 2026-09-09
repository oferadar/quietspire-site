/**
 * Title normalization and matching.
 *
 * Two titles can be "the same book title" to a human but different strings to
 * a computer: "The Great Gatsby" / "Great Gatsby" / "The Great Gatsby: A Novel".
 * Everything here is pure and synchronous so it can run on the server and in
 * the browser, and so it is trivially unit-testable.
 */

const LEADING_ARTICLES = new Set(["a", "an", "the"]);

/**
 * Words that carry almost no signal for "loose" matching. Kept deliberately
 * short: over-aggressive stopword lists turn real titles into empty sets.
 */
const STOPWORDS = new Set([
  "a", "an", "the", "of", "and", "in", "to", "for", "on", "at", "by", "with",
  "from", "or", "is",
]);

export type MatchKind = "exact" | "near" | "loose" | "none";

export interface NormalizedTitle {
  /** The normalized main title. This is what matching compares. */
  main: string;
  /** Subtitle text after the first colon, trimmed, kept for display only. */
  subtitle: string | null;
  /** Tokens of `main`, in order. */
  tokens: string[];
}

/**
 * Splits "Main title: subtitle" at the first colon. The subtitle is retained
 * for display but ignored for matching, because "The Great Gatsby: A Novel"
 * and "The Great Gatsby" are the same title in a reader's mind.
 */
export function splitSubtitle(raw: string): { main: string; subtitle: string | null } {
  const idx = raw.indexOf(":");
  if (idx <= 0) return { main: raw.trim(), subtitle: null };
  const main = raw.slice(0, idx).trim();
  const subtitle = raw.slice(idx + 1).trim();
  // A title that starts with a colon or is only a colon is not a subtitle split.
  if (main.length === 0) return { main: raw.trim(), subtitle: null };
  return { main, subtitle: subtitle.length > 0 ? subtitle : null };
}

/**
 * Normalizes one title string (with any subtitle already removed) into the
 * canonical form used for comparison.
 *
 * Steps, in order:
 *  1. Unicode-decompose and drop diacritics ("Café" -> "Cafe").
 *  2. Lowercase.
 *  3. "&" -> " and " (so "Salt & Light" equals "Salt and Light").
 *  4. Drop trailing bracketed groups: "The Great Gatsby (Published In 1925)".
 *     Open Library stores the canonical Gatsby record exactly that way.
 *  5. Drop a trailing catalog-style article: "Great Gatsby, The" -> "Great Gatsby".
 *  6. Remove apostrophes and periods without inserting a space ("don't" -> "dont").
 *  7. Replace every other punctuation mark or symbol with a space.
 *  8. Collapse whitespace.
 *  9. Drop a single leading article (a / an / the), unless it is the whole title.
 */
export function normalizeMain(main: string): string {
  let s = main.normalize("NFKD").replace(/\p{M}+/gu, "");
  s = s.toLowerCase();
  s = s.replace(/&/g, " and ");
  // Catalog noise appended in brackets: "(Published In 1925)", "[Illustrated]",
  // "(Penguin Classics)". Only trailing groups are dropped; a parenthetical in
  // the middle of a title is part of the title.
  s = s.replace(/(\s*[(\[][^()\[\]]*[)\]])+\s*$/u, "");
  s = s.replace(/,\s*(the|an|a)\s*$/u, "");
  s = s.replace(/[’‘'`.]/g, "");
  s = s.replace(/[^\p{L}\p{N}\s]+/gu, " ");
  s = s.replace(/\s+/g, " ").trim();
  const tokens = s.length > 0 ? s.split(" ") : [];
  if (tokens.length > 1 && LEADING_ARTICLES.has(tokens[0])) tokens.shift();
  return tokens.join(" ");
}

/** Full pipeline: split subtitle, normalize the main title, tokenize. */
export function normalizeTitle(raw: string): NormalizedTitle {
  const { main, subtitle } = splitSubtitle(raw);
  const normalized = normalizeMain(main);
  return {
    main: normalized,
    subtitle,
    tokens: normalized.length > 0 ? normalized.split(" ") : [],
  };
}

/** Classic Levenshtein edit distance, iterative two-row version. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let prev = new Array<number>(b.length + 1);
  let curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    const ca = a.charCodeAt(i - 1);
    for (let j = 1; j <= b.length; j++) {
      const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/**
 * Thresholds for the fuzzy tiers. Exposed so the tests and the verdict copy
 * can reference the same numbers.
 */
export const MATCH_THRESHOLDS = {
  /** Levenshtein distance divided by the longer length must be under this. */
  nearMaxRatio: 0.2,
  /** Any single edit ("Patient" / "Patients") is always near. */
  nearMaxAbsolute: 1,
  /** Shared non-stopword tokens divided by the smaller token set. */
  looseMinOverlap: 0.5,
} as const;

function isTokenPrefix(shorter: string[], longer: string[]): boolean {
  if (shorter.length === 0 || shorter.length > longer.length) return false;
  for (let i = 0; i < shorter.length; i++) {
    if (shorter[i] !== longer[i]) return false;
  }
  return true;
}

function contentTokens(tokens: string[]): Set<string> {
  const kept = tokens.filter((t) => !STOPWORDS.has(t));
  // If a title is made only of stopwords ("It Is"), fall back to all tokens.
  return new Set(kept.length > 0 ? kept : tokens);
}

/**
 * Classifies a candidate title against the query. Both arguments are
 * NormalizedTitle values so the caller pays for normalization once per string.
 *
 *  - exact: normalized main titles are identical
 *  - near:  a tiny edit distance, or one title's words are a prefix of the other's
 *  - loose: the titles share a significant fraction of their meaningful words
 *  - none:  everything else
 */
export function classifyMatch(query: NormalizedTitle, candidate: NormalizedTitle): MatchKind {
  const a = query.main;
  const b = candidate.main;
  if (a.length === 0 || b.length === 0) return "none";
  if (a === b) return "exact";

  const distance = levenshtein(a, b);
  const longest = Math.max(a.length, b.length);
  if (
    distance <= MATCH_THRESHOLDS.nearMaxAbsolute ||
    distance / longest < MATCH_THRESHOLDS.nearMaxRatio
  ) {
    return "near";
  }

  const qa = query.tokens;
  const qb = candidate.tokens;
  const [shorter, longer] = qa.length <= qb.length ? [qa, qb] : [qb, qa];
  if (isTokenPrefix(shorter, longer)) return "near";

  const sa = contentTokens(qa);
  const sb = contentTokens(qb);
  let shared = 0;
  for (const t of sa) if (sb.has(t)) shared++;
  const overlap = shared / Math.min(sa.size, sb.size);
  if (shared >= 1 && overlap >= MATCH_THRESHOLDS.looseMinOverlap) return "loose";

  return "none";
}

/** Convenience for callers that hold raw strings. */
export function classifyTitles(queryRaw: string, candidateRaw: string): MatchKind {
  return classifyMatch(normalizeTitle(queryRaw), normalizeTitle(candidateRaw));
}
