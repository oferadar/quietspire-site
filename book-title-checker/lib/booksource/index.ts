/**
 * The single entry point for book data. Nothing outside lib/booksource/ may
 * import openlibrary.ts directly.
 *
 * To swap the data source (for example to a locally hosted copy of the Open
 * Library monthly dump), write another file in this folder that exports
 * `searchByTitle(title: string): Promise<SearchResult>` and change the one
 * import line below. See README.md, "Swapping the data source".
 */
export type { SearchResult, WorkResult } from "./types";
export { BookSourceUnavailableError } from "./types";
export { searchByTitle } from "./openlibrary";
