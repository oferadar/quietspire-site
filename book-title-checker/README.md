# Book Title Checker

A free web tool that tells an author whether a book title is already in use, and how crowded it is. Built for self-publishing authors deciding what to call a finished manuscript.

It is deliberately small: Next.js, one public data source, no database, no accounts, no AI, no paid services. It is meant to keep working untouched for months.

## Ownership and where the code lives

Made by [Quietspire LLC](https://quietspire.com). Support address: support@quietspire.com (it appears in the footer, the About and Privacy pages, and in the User-Agent sent to Open Library, which asks heavy users to identify themselves).

The source lives in the `book-title-checker/` folder of the [quietspire-site](https://github.com/oferadar/quietspire-site) repository, next to the static quietspire.com pages. That repository is served by GitHub Pages, which cannot run this app (the `/api/check` route and the data cache need a server), so the app deploys from Vercel instead: import the repository, set **Root Directory** to `book-title-checker`, framework Next.js, and add `NEXT_PUBLIC_SITE_URL` once the domain is chosen. GitHub Pages will ignore the folder apart from serving its source files as plain text under quietspire.com/book-title-checker/, which is harmless because the repository is public anyway.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit tests for normalization and the verdict
npm run build      # production build, also type-checks
npm run start      # serve the production build
npm run lint
```

Node 22 or newer. No environment variables are required. Set `NEXT_PUBLIC_SITE_URL` (for example `https://example.com`, no trailing slash) once the domain exists so the sitemap, robots and canonical URLs use it; until then Vercel's own production URL is used automatically.

## How it works

1. The visitor types a title (or a shortlist of up to five). The browser normalizes it (`lib/normalize.ts`) and requests `/api/check?q=<normalized title>` once per title.
2. The route handler (`app/api/check/route.ts`) normalizes again, asks `lib/search.ts` for matching works, sets catalogue noise aside (`lib/noise.ts`), classifies each remaining work as exact / near / loose against the query, and computes a verdict (`lib/verdict.ts`).
3. `lib/search.ts` wraps the data source in a 24-hour cache. The data source (`lib/booksource/`) is the only code that talks to Open Library.
4. The client renders the verdict and the evidence in place. No navigation, no modal. Recent checks are remembered in the browser's localStorage only (`lib/recent.ts`).

### Normalization

Two strings are the same title when they are identical after:

- Unicode decomposition with diacritics removed ("Café" = "Cafe")
- lowercasing
- `&` read as "and"
- trailing bracketed groups dropped ("The Great Gatsby (Published In 1925)" is genuinely how Open Library stores the canonical record)
- a trailing catalog article dropped ("Great Gatsby, The")
- apostrophes and periods removed, every other punctuation mark turned into a space, whitespace collapsed
- one leading article (a / an / the) dropped, unless it is the whole title

The subtitle, everything after the first colon, is set aside for display and ignored for matching.

Classification against the query:

- **exact**: normalized strings identical
- **near**: Levenshtein distance of 1, or distance under 20% of the longer string, or one title's words are a prefix of the other's
- **loose**: at least half of the shorter title's meaningful words (stopwords removed) appear in the other

Thresholds live in `MATCH_THRESHOLDS` in `lib/normalize.ts`.

### Catalogue noise

Open Library is full of records that carry a title without being a book anyone competes with: "Summary of X", journals sized "6 x 9, 120 pages", "Paperback - X" duplicates, box sets, study guides. `lib/noise.ts` sets them aside before classification. Hard patterns (summary, workbook, trim sizes, page counts, box set, SparkNotes as author...) always count; soft words (journal, notes, diary, guide) count only when the record is also weak: one edition and no cover, so "Bridget Jones's Diary" survives. Noise is still listed on the page, collapsed, for transparency.

### Grouping

Open Library often holds twenty or more records for one book (reprints, scans, translations filed as separate works). Records are grouped by author (`authorKey` in `lib/verdict.ts` folds "F. Scott Fitzgerald", "F. Fitzgerald" and "Fitzgerald, F. Scott" together) and each group is judged once on its combined edition count and its most recent year. The page shows the strongest record as the representative, with the year range, total editions and record count.

### Verdict

Each group gets a strength from two signals: edition count (log scale, 1.0 at 50 editions, capped at 1.5) and recency (1.0 for the last three years, fading to 0 over fifty years). They blend as `0.65 × stronger + 0.35 × weaker`. A brand-new book with one edition scores 0.65 (in use); with six editions it passes 0.75 (crowded); a classic with hundreds of editions is crowded regardless of age. Near matches count at 40% towards the total.

- **Crowded**: any exact group with strength ≥ 0.75, or a total score ≥ 2.0
- **Clear**: no exact groups (or only ones below 0.2), no near group ≥ 0.75, total below 0.5
- **In use**: everything else

"The book to beat" is the strongest group across exact and near, so a near match with hundreds of editions (Rowling for "Harry Potter") outranks an exact match nobody has heard of.

All of those numbers are in `VERDICT_TUNING` at the top of `lib/verdict.ts`. They are editorial judgement, not maths; change them there and the tests will tell you what moved. `lib/booksource/openlibrary.test.ts` runs the whole pipeline on two captured Open Library responses (`lib/booksource/fixtures/`), so tuning changes are checked against real data.

### Wording rule

Titles cannot be copyrighted and single-work titles generally cannot be trademarked. The verdict copy therefore never says "available", "taken" or "infringement". It says clear, in use, crowded, and frames everything as discoverability. `lib/verdict.test.ts` enforces the banned words on the tier copy. The URLs `/book-title-availability` and `/is-my-book-title-taken` exist because that is what people search for; each page immediately reframes the phrase.

## Caching

Open Library has no published rate limit and every visitor shares this site's one server IP, so the same title must never be fetched twice in a day. There are two layers:

1. **Data cache** (`lib/search.ts`): `unstable_cache` keyed by normalized title, `revalidate: 86400`. On Vercel this is the durable Data Cache and survives deployments.
2. **CDN cache** (`app/api/check/route.ts`): successful non-empty answers are sent with `Cache-Control: public, s-maxage=86400, stale-while-revalidate=604800`, so Vercel's edge serves repeat requests for the same URL without invoking the function at all. The client normalizes before requesting, which is what makes the URL canonical.

Two rules are enforced on purpose:

- **Empty results are never cached.** The cached function throws a sentinel on an empty result, `unstable_cache` stores nothing on a throw, and the public function turns the sentinel back into `[]`. The HTTP response is `no-store`.
- **Failures are never cached.** A failed Open Library call returns HTTP 503 with `no-store` and `Retry-After: 60`, and the page shows "search temporarily unavailable". It never shows a false Clear.

If nonsense queries ever become a load problem, the place to add a short cache for empty answers is the `works.length === 0` branch of the route handler.

## Pages

One engine, five landing pages, each with its own title tag, description, H1, explanatory copy and FAQ (rendered as `<details>` plus FAQPage JSON-LD). All copy is in `lib/pages.ts`; add an entry there and a one-line `app/<slug>/page.tsx` to add a page. `app/sitemap.ts` and `app/robots.ts` read the same list. `/about` and `/privacy` are plain pages; the 404 (`app/not-found.tsx`) carries the checker so a bad link still lands on the tool.

Icons and the link-preview image are generated at build time from `app/icon.tsx`, `app/apple-icon.tsx` and `app/opengraph-image.tsx` with `next/og`. No image files to maintain.

## Outbound links

Every verdict links to the same search on Amazon, Goodreads and Google Books (`lib/links.ts`). These are plain links, not integrations: no API, no key, no affiliate tag. If you join Amazon Associates later, the tag goes in that one file; it would be the site's second revenue source and it costs nothing to run.

## Swapping the data source

Everything about Open Library's HTTP API lives in `lib/booksource/openlibrary.ts`. The rest of the app only ever imports from `lib/booksource/index.ts`, which re-exports one function:

```ts
searchByTitle(title: string): Promise<WorkResult[]>
```

To move to a locally hosted copy of Open Library's monthly dump:

1. Get the works dump from https://openlibrary.org/developers/dumps (`ol_dump_works_latest.txt.gz`, several GB). It is far too large for a serverless function, so load it into something queryable: a Postgres or SQLite table with a normalized-title column and an index on it is enough. Store, per work: key, title, subtitle, author names, first publish year, edition count, cover id.
2. Write `lib/booksource/localdump.ts` exporting `searchByTitle` with the same signature. Contract:
   - return `{ works, totalFound }`: at most ~50 `WorkResult` objects deduplicated by `key`, plus the total record count when the store knows it (or `null`)
   - return `{ works: [], totalFound: 0 }` when nothing matches
   - throw `BookSourceUnavailableError` when the store cannot be reached, so the route returns 503 instead of a false Clear
   - do not cache inside; `lib/search.ts` already does
3. Change the one import line in `lib/booksource/index.ts`:
   ```ts
   export { searchByTitle } from "./localdump";
   ```

Nothing else changes. `lib/booksource/types.ts` is the contract; keep it stable.

## Ads

No ad code is included. When you add a network (for example AdSense), be aware that it is a third-party script that will cost Lighthouse points and, in some jurisdictions, raises a consent-banner question that the spec currently forbids. Place the unit below the results area in `components/LandingPage.tsx` so it never pushes the search box below the fold. Before applying, add a contact method to `app/privacy/page.tsx` and name the network there; both are things ad networks check.

## Known limitations

- Open Library is slow (2–5 s) and sometimes refuses connections for minutes at a time. The fetch times out after 12 s; the cache means a title only has to succeed once per day. After 1.5 s the loading state says so.
- Open Library holds few ebooks that exist only on Amazon KDP, so a Clear verdict in an indie-heavy genre can be wrong. Every Clear verdict says so and links to the Amazon and Goodreads searches.
- Open Library data is messy. Noise filtering and author grouping handle the common cases; the evidence list still shows the raw records so the reader can judge.

## Layout

```
app/
  api/check/route.ts      the JSON endpoint
  layout.tsx              fonts, metadata base
  page.tsx                / (primary page)
  <slug>/page.tsx         the other four landing pages
  sitemap.ts, robots.ts
components/
  TitleChecker.tsx        search box, shortlist compare, state machine, results (client)
  VerdictCard.tsx         the stamp, the book to beat, next step, retail links
  MatchList.tsx           grouped evidence rows, collapsed lists
  LandingPage.tsx         shared page shell
  Faq.tsx                 details/summary + JSON-LD
lib/
  normalize.ts (+test)    title normalization and match classification
  noise.ts (+test)        catalogue-noise filter
  verdict.ts (+test)      grouping and crowding assessment
  search.ts               24 h cache around the data source
  links.ts                Amazon / Goodreads / Google Books search URLs
  recent.ts               recent checks in localStorage
  booksource/             the only code that knows about Open Library (+fixture tests)
  pages.ts                all landing-page copy
  site.ts                 canonical URL
```
