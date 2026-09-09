import type { WorkResult } from "./booksource/types";
import { normalizeMain, normalizeTitle, type MatchKind } from "./normalize";

/**
 * Crowding assessment.
 *
 * The verdict is NOT a legal opinion. Titles cannot be copyrighted, so the
 * only question the tool answers is a discoverability one: if a reader types
 * this title into Amazon or Goodreads, how much competition shows up?
 *
 * The tier names and copy below deliberately avoid "available", "taken" and
 * "infringement" because those words imply a legal claim that does not exist.
 */

export type Tier = "clear" | "in-use" | "crowded";

/**
 * One competitor. Open Library holds many records for the same book (reprints,
 * scans, translations filed as separate works), so records are grouped by
 * author and each group is judged once, on its combined edition count.
 */
export interface MatchGroup {
  /** The strongest record, shown as the representative. */
  work: WorkResult;
  /** Every record in the group, strongest first. */
  records: WorkResult[];
  kind: Exclude<MatchKind, "none">;
  /** 0 to about 1.5: how strongly this competitor owns the title in search. */
  strength: number;
  totalEditions: number;
  earliestYear?: number;
  latestYear?: number;
}

export interface Verdict {
  tier: Tier;
  /** Sum of weighted strengths. Exposed for debugging and tests, not for display. */
  score: number;
  exact: MatchGroup[];
  near: MatchGroup[];
  loose: MatchGroup[];
  /** Records set aside as catalogue noise, listed for transparency. */
  noise: WorkResult[];
  /** The single strongest competitor across exact and near matches, if any. */
  dominant: MatchGroup | null;
}

/* ------------------------------------------------------------------------ */
/* Tuning knobs. These encode editorial judgement, not maths, so they live   */
/* together at the top where they are easy to argue about and adjust.       */
/* ------------------------------------------------------------------------ */

export const VERDICT_TUNING = {
  /** Editions at which the edition signal reaches 1.0 (log scale). */
  editionsForFullSignal: 50,
  /**
   * The signal keeps growing past 1.0 for very large edition counts, up to
   * this cap, so a classic with a thousand editions outranks a recent reprint
   * with thirty. 1.5 is reached at about 350 editions.
   */
  editionSignalCap: 1.5,
  /** A book this many years old or newer gets the full recency signal. */
  recentYears: 3,
  /** Recency fades linearly to zero this many years after `recentYears`. */
  recencyFadeYears: 50,
  /** Signal for a book whose first publish year is unknown. */
  unknownYearSignal: 0.3,
  /**
   * Strength blends the stronger of the two signals with the weaker one.
   * At 0.65 / 0.35, a brand-new book with one edition scores 0.65 (in use)
   * and needs a few editions to count as crowded; a classic with hundreds
   * of editions is crowded regardless of age.
   */
  strongerSignalWeight: 0.65,
  /** How much a near match counts compared with an exact one. */
  nearWeight: 0.4,
  /** A single exact match at or above this strength makes the title crowded. */
  crowdedDominantStrength: 0.75,
  /** Or a total weighted score at or above this. */
  crowdedTotalScore: 2.0,
  /** Exact matches below this strength are "very old and obscure". */
  obscureStrength: 0.2,
  /** A near match at or above this strength stops a title being "clear". */
  nearBlocksClearStrength: 0.75,
  /** Below this total the title can still be called clear. */
  clearMaxScore: 0.5,
} as const;

/** 0 for one edition, ~0.5 around eight, 1.0 at fifty, capped at 1.5. */
export function editionSignal(editionCount: number): number {
  const e = Math.max(1, editionCount);
  const s = Math.log2(e) / Math.log2(VERDICT_TUNING.editionsForFullSignal);
  return Math.min(VERDICT_TUNING.editionSignalCap, s);
}

/** 1.0 for a book from the last few years, fading to 0 for anything old. */
export function recencySignal(year: number | undefined, currentYear: number): number {
  if (year === undefined || !Number.isFinite(year)) {
    return VERDICT_TUNING.unknownYearSignal;
  }
  const age = currentYear - year;
  if (age <= VERDICT_TUNING.recentYears) return 1;
  const faded = 1 - (age - VERDICT_TUNING.recentYears) / VERDICT_TUNING.recencyFadeYears;
  return Math.max(0, Math.min(1, faded));
}

function blend(e: number, r: number): number {
  const w = VERDICT_TUNING.strongerSignalWeight;
  return w * Math.max(e, r) + (1 - w) * Math.min(e, r);
}

/** Strength of a single record. */
/**
 * The year that says whether a book is still in the market: its most recent
 * edition when Open Library knows it, otherwise its first. A classic reprinted
 * last year competes like a new release; a book last printed in 1911 does not.
 */
export function activeYear(work: WorkResult): number | undefined {
  return work.lastPublishYear ?? work.firstPublishYear;
}

export function matchStrength(work: WorkResult, currentYear: number): number {
  return blend(editionSignal(work.editionCount), recencySignal(activeYear(work), currentYear));
}

/**
 * Groups records by author. "F. Scott Fitzgerald", "F. Fitzgerald",
 * "Francis Fitzgerald" and "Fitzgerald, F. Scott" all key to "fitzgerald f".
 * Records with no author are never merged with each other.
 */
export function authorKey(work: WorkResult): string {
  const raw = work.authors[0];
  if (!raw) return `unknown:${work.key}`;
  let name = raw;
  const comma = raw.indexOf(",");
  if (comma > 0) name = `${raw.slice(comma + 1)} ${raw.slice(0, comma)}`;
  const tokens = name
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length === 0) return `unknown:${work.key}`;
  const last = tokens[tokens.length - 1];
  return tokens.length === 1 ? last : `${last} ${tokens[0][0]}`;
}

/**
 * Subtitles that name a form rather than a book. "The Great Gatsby" and
 * "The Great Gatsby: A Novel" are one book; "Dune" and "Dune: House Atreides"
 * are not. Matching on the key below tells those two cases apart.
 */
const GENERIC_SUBTITLES = new Set([
  "a novel", "novel", "a memoir", "memoir", "a thriller", "a mystery", "a romance",
  "stories", "a story", "short stories", "poems", "essays", "a play", "the novel",
]);

/**
 * Records that are the same book: same author, same main title, and the same
 * subtitle unless the subtitle is a generic form word. Series entries by one
 * author ("Dune: House Atreides", "Dune: The Machine Crusade") stay separate,
 * so their editions are never summed into one imaginary competitor.
 */
export function groupKey(work: WorkResult): string {
  const { main, subtitle } = normalizeTitle(work.title);
  const rawSub = subtitle ?? work.subtitle ?? "";
  const sub = normalizeMain(rawSub);
  const subKey = GENERIC_SUBTITLES.has(sub) ? "" : sub;
  return `${authorKey(work)}|${main}|${subKey}`;
}

export interface ClassifiedWork {
  work: WorkResult;
  kind: MatchKind;
}

function buildGroups(
  items: ClassifiedWork[],
  kind: Exclude<MatchKind, "none">,
  currentYear: number,
): MatchGroup[] {
  const byBook = new Map<string, WorkResult[]>();
  for (const { work, kind: k } of items) {
    if (k !== kind) continue;
    const key = groupKey(work);
    const list = byBook.get(key);
    if (list) list.push(work);
    else byBook.set(key, [work]);
  }
  const groups: MatchGroup[] = [];
  for (const records of byBook.values()) {
    records.sort((a, b) => matchStrength(b, currentYear) - matchStrength(a, currentYear));
    const years = records.map((r) => r.firstPublishYear).filter((y): y is number => y !== undefined);
    const activeYears = records.map(activeYear).filter((y): y is number => y !== undefined);
    const totalEditions = records.reduce((sum, r) => sum + Math.max(0, r.editionCount), 0);
    const latestYear = activeYears.length ? Math.max(...activeYears) : undefined;
    const earliestYear = years.length ? Math.min(...years) : undefined;
    groups.push({
      work: records[0],
      records,
      kind,
      strength: blend(editionSignal(totalEditions), recencySignal(latestYear, currentYear)),
      totalEditions,
      earliestYear,
      latestYear,
    });
  }
  groups.sort((a, b) => b.strength - a.strength);
  return groups;
}

export function computeVerdict(
  classified: ClassifiedWork[],
  currentYear: number = new Date().getFullYear(),
  noise: WorkResult[] = [],
): Verdict {
  const exact = buildGroups(classified, "exact", currentYear);
  const near = buildGroups(classified, "near", currentYear);
  const loose = buildGroups(classified, "loose", currentYear);

  const exactTotal = exact.reduce((sum, g) => sum + g.strength, 0);
  const nearTotal = near.reduce((sum, g) => sum + g.strength, 0);
  const score = exactTotal + VERDICT_TUNING.nearWeight * nearTotal;

  const maxExact = exact[0]?.strength ?? 0;
  const maxNear = near[0]?.strength ?? 0;

  let tier: Tier;
  if (maxExact >= VERDICT_TUNING.crowdedDominantStrength || score >= VERDICT_TUNING.crowdedTotalScore) {
    tier = "crowded";
  } else if (
    (exact.length === 0 || maxExact < VERDICT_TUNING.obscureStrength) &&
    maxNear < VERDICT_TUNING.nearBlocksClearStrength &&
    score < VERDICT_TUNING.clearMaxScore
  ) {
    tier = "clear";
  } else {
    tier = "in-use";
  }

  // The strongest competitor regardless of kind: a near match with hundreds
  // of editions matters more than an exact match nobody has heard of.
  let dominant: MatchGroup | null = exact[0] ?? null;
  if (near[0] && (!dominant || near[0].strength > dominant.strength)) dominant = near[0];

  return { tier, score, exact, near, loose, noise, dominant };
}

/** Plain-language copy for each tier. Kept here so every page says the same thing. */
export const TIER_COPY: Record<Tier, { label: string; summary: string; nextStep: string }> = {
  clear: {
    label: "Clear",
    summary:
      "No published book with this exact title turned up, or only old and obscure ones. In search results you would mostly have it to yourself.",
    nextStep:
      "Open Library holds few ebooks that exist only on KDP, so search Amazon and Goodreads before you commit.",
  },
  "in-use": {
    label: "In use",
    summary:
      "Other books use this title, but none of them dominates search results. Yours would sit alongside them.",
    nextStep:
      "One distinctive extra word, or a specific subtitle, would set yours apart from the books below.",
  },
  crowded: {
    label: "Crowded",
    summary:
      "A book with real reach already uses this title. Readers searching for it would find that book first.",
    nextStep:
      "A different title, or this one with a distinguishing word added, usually clears the field.",
  },
};
