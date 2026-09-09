import type { WorkResult } from "./booksource/types";

/**
 * Catalogue noise: records that carry a book's title without being a book
 * an author competes with. Open Library is full of them: "Summary of X",
 * "X: 6 x 9 inches, 120 pages" journals, "Paperback - X" duplicates, box
 * sets, study guides. Counting them as exact matches inflates the verdict
 * and fills the evidence list with junk.
 *
 * Two tiers. Hard patterns mark a record as noise on their own. Soft words
 * (journal, notes, diary...) also appear in real titles, so they only count
 * when the record is weak as well: one edition and no cover.
 */

const HARD_TITLE_PATTERNS: RegExp[] = [
  /\bsummary\b/i,
  /\bstudy guide\b/i,
  /\bsparknotes?\b/i,
  /\bcliffs? ?notes\b/i,
  /\bshmoop\b/i,
  /\bbookrags\b/i,
  /\bworkbook\b/i,
  /\bcolou?ring book\b/i,
  /\bactivity book\b/i,
  /\b\d+(\.\d+)?\s?x\s?\d+(\.\d+)?\s?(in|inch|inches)?\b/i, // trim sizes: 6 x 9, 8.5x11
  /\b\d+ pages\b/i,
  /\blined\b/i,
  /\bblank\b.*\b(pages|book)\b/i,
  /^(paperback|hardcover|hardback|kindle|audiobook|ebook|large print)\s*[-:–]/i,
  /\b(box(ed)? set|collection set|books? collection|\d+[- ]books? (set|collection|bundle)|bundle)\b/i,
  /\bconversation starters\b/i,
  /\btrivia\b/i,
  /\bquiz\b/i,
  /\bplanner\b/i,
  /\blog ?book\b/i,
  /\bguest book\b/i,
  /\bdiscussion (guide|questions|prompts)\b/i,
  /\breading (guide|group guide)\b/i,
  /\bteacher'?s? guide\b/i,
  /\blesson plans?\b/i,
];

const SUBTITLE_ONLY_PATTERNS: RegExp[] = [/^(notes|study guide|summary|a study guide|analysis)$/i];

const SOFT_TITLE_PATTERNS: RegExp[] = [
  /\bjournal\b/i,
  /\bnotebook\b/i,
  /\bnotes\b/i,
  /\bdiary\b/i,
  /\bcompanion\b/i,
  /\banalysis\b/i,
  /\bguide\b/i,
];

const AUTHOR_PATTERNS: RegExp[] = [
  /sparknotes?|cliffs? ?notes|shmoop|bookrags|instaread|speed ?read|quick ?read|summar(y|ies)|study guide|blinkist|readtrepreneur|milkyway media|joosr|swift ?reads|worth ?books|book ?notes|book ?habits|scribd/i,
];

export function isCatalogueNoise(work: WorkResult): boolean {
  const text = work.subtitle ? `${work.title} : ${work.subtitle}` : work.title;
  if (HARD_TITLE_PATTERNS.some((p) => p.test(text))) return true;
  if (work.subtitle && SUBTITLE_ONLY_PATTERNS.some((p) => p.test(work.subtitle!.trim()))) return true;
  if (work.authors.some((a) => AUTHOR_PATTERNS.some((p) => p.test(a)))) return true;
  const weak = work.editionCount <= 1 && work.coverId === undefined;
  if (weak && SOFT_TITLE_PATTERNS.some((p) => p.test(text))) return true;
  return false;
}

/** Splits a result set into the records worth judging and the noise. */
export function partitionNoise(works: WorkResult[]): { candidates: WorkResult[]; noise: WorkResult[] } {
  const candidates: WorkResult[] = [];
  const noise: WorkResult[] = [];
  for (const w of works) (isCatalogueNoise(w) ? noise : candidates).push(w);
  return { candidates, noise };
}
