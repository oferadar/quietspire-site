/**
 * A "work" as the checker understands it. Open Library groups many editions
 * (paperback, hardcover, translations, reprints) under one work, which is the
 * right granularity for "is this title in use?".
 *
 * This type is the contract between the data source and the rest of the app.
 * Swapping the data source (e.g. to a local Open Library dump) must keep it.
 */
export interface WorkResult {
  /** Open Library work key, e.g. "/works/OL468431W". Used as a stable id. */
  key: string;
  /** Raw title as stored by the source. May include a subtitle after a colon. */
  title: string;
  /** Separate subtitle field, when the source has one. */
  subtitle?: string;
  /** Author display names. Empty when unknown. */
  authors: string[];
  /** Year of the earliest known edition. Undefined when unknown. */
  firstPublishYear?: number;
  /**
   * Year of the most recent known edition. A 1965 novel still being printed
   * in 2024 is a live competitor; this is what says so.
   */
  lastPublishYear?: number;
  /** How many editions the source knows about. 0 when unknown. */
  editionCount: number;
  /** Open Library cover id for https://covers.openlibrary.org/b/id/{id}-M.jpg */
  coverId?: number;
}

/** What one search returns. */
export interface SearchResult {
  /** The most relevant works, at most ~50. */
  works: WorkResult[];
  /**
   * How many records the source says match in total, when it reports one.
   * Can be far larger than works.length; shown to the reader as context.
   */
  totalFound: number | null;
}

/** Thrown by a data source when it cannot answer at all (network, 5xx, bad JSON). */
export class BookSourceUnavailableError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "BookSourceUnavailableError";
  }
}
