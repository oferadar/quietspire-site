# Claude Code kickoff prompt: Book Title Checker

Copy everything below the line into a fresh Claude Code session in an empty directory.

---

## Project

Build a free web tool that tells an author whether a book title is already in use, and how crowded it is. Target user: self-publishing authors on KDP deciding what to call a finished manuscript.

The tool is ad-supported, so it must be cheap to run, must work with no user accounts, and must survive being ignored for months at a time.

## Stack

- Next.js (App Router), TypeScript, Tailwind CSS
- Deployed to Vercel
- No database in v1
- No authentication in v1
- No LLM or AI API calls anywhere (cost constraint, this is non-negotiable)
- No third-party service other than Open Library

## Data source

Open Library Search API: `https://openlibrary.org/search.json`

- No API key required
- Query by title: `?title=<encoded>&fields=key,title,author_name,first_publish_year,edition_count,cover_i&limit=50`
- Open Library returns *works*, where a work groups many editions

Important: Open Library has published no rate limit for this endpoint, and every visitor to the site will share our single server IP. Treat the API as a scarce resource. Aggressive caching is a core requirement, not an optimization.

Put all Open Library access behind a single module at `lib/booksource/`. Export one interface, something like `searchByTitle(title: string): Promise<WorkResult[]>`. Nothing else in the codebase touches Open Library directly. We will later swap the implementation for a locally hosted copy of their monthly data dumps, and that swap must touch exactly one file.

## Caching

- Cache every query result keyed by the normalized title
- Use Next.js route handler caching with a long revalidate window (24 hours minimum). Title data does not change hour to hour.
- Do not cache empty or errored responses
- If Open Library is unreachable, show a clear "search is temporarily unavailable" state. Never show a false "this title is available."

## The hard part: title normalization

This is the core of the product. Two titles are the same book title to a human but different strings to a computer. Implement a normalization function in `lib/normalize.ts` and unit test it thoroughly.

Normalize by:

- Lowercasing
- Stripping leading articles (a, an, the)
- Removing punctuation, including apostrophes, colons, em dashes, and ampersands (convert `&` to `and` before stripping)
- Collapsing whitespace
- Separating a subtitle at the first colon and matching on the main title, while retaining the subtitle for display

Then classify each result against the query:

- **Exact**: normalized strings are identical
- **Near**: normalized Levenshtein distance under a threshold, or one is a prefix of the other
- **Loose**: significant shared token overlap

Write tests covering at least these pairs:
- "The Great Gatsby" vs "Great Gatsby" → exact
- "The Great Gatsby" vs "The Great Gatsby: A Novel" → exact (subtitle stripped)
- "Salt & Light" vs "Salt and Light" → exact
- "The Silent Patient" vs "The Silent Patients" → near
- "The Silent Patient" vs "Silent Spring" → loose or no match, not exact

## Verdict logic

Do not just report a count. Compute a crowding assessment in `lib/verdict.ts` from the exact and near matches, weighted by:

- Number of exact matches
- Edition count of each match (a title held by a book with 200 editions is far more crowded than one with 1)
- Recency (`first_publish_year`). A title last used in 1890 is functionally free. One used in 2023 is not.

Output three tiers with plain wording:

- **Clear** — no exact matches, or only very old and obscure ones
- **In use** — exact matches exist but none dominant
- **Crowded** — one or more exact matches with high edition counts or recent publication

Show the evidence underneath the verdict. Every match gets title, author, first publish year, edition count, and cover thumbnail from `https://covers.openlibrary.org/b/id/{cover_i}-M.jpg`.

## Legal accuracy requirement

This is important and must not be softened.

Book titles cannot be copyrighted, and outside of series names they generally cannot be trademarked. Two books may legally share a title. The tool must never imply that a taken title is a legal problem.

Frame the entire product around discoverability instead: an author using an existing title competes with that book in Amazon and Goodreads search results. Put a short, clear explanation of this on every results page. Do not use words like "available," "taken," or "infringement" in the verdict copy, because they imply a legal claim that does not exist. Use "in use" and "crowded."

## Pages

One engine, several landing pages, each targeting a different search query. Share the same component and vary the copy, heading, and FAQ.

- `/` — Book Title Checker (primary)
- `/book-title-availability` 
- `/novel-title-checker`
- `/kdp-book-title-checker`
- `/is-my-book-title-taken`

Each page needs its own title tag, meta description, H1, and a distinct FAQ block with 4 to 6 questions rendered as FAQPage JSON-LD structured data. Do not duplicate FAQ content across pages.

Also generate `sitemap.xml` and `robots.txt`.

## UI requirements

- The search input is the first thing on the page, above the fold, focused on load
- Results render without a page navigation
- Works on mobile
- Loading state must not shift layout
- No cookie banner, no modal, no newsletter popup, no interstitial of any kind
- Fast. Lighthouse performance above 90.

## Explicit non-goals for v1

Do not build any of these, even if they seem useful:

- User accounts or saved searches
- Any database
- Any AI-generated title suggestions
- Amazon, Goodreads, or Google Books integration
- Trademark lookup
- Email capture

## Definition of done

- `npm run build` passes clean with no TypeScript errors
- Unit tests for `normalize.ts` and `verdict.ts` pass, covering the cases listed above
- All five pages render with distinct metadata and FAQ content
- A search for "The Great Gatsby" returns a Crowded verdict with the Fitzgerald work as an exact match
- A search for a nonsense string returns a Clear verdict with no matches and no error
- Open Library being down produces a visible error state, never a false Clear
- `README.md` documents how to swap the data source to a local dump

## How to work

Start by reading the Open Library search endpoint response for a few real titles so you are building against actual data rather than assumptions. Then build normalization and its tests before anything touches the UI, because everything else depends on it being right.

Ask me before adding any dependency beyond Next.js, React, Tailwind, and a test runner.
