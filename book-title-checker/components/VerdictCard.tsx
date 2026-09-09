import { retailLinks } from "@/lib/links";
import type { Verdict } from "@/lib/verdict";
import { TIER_COPY } from "@/lib/verdict";
import { DiscoverabilityNote } from "./DiscoverabilityNote";

const COVER_BASE = "https://covers.openlibrary.org/b/id/";

function num(n: number): string {
  return n.toLocaleString("en-US");
}

function pluralEditions(n: number): string {
  return n === 1 ? "1 edition" : `${num(n)} editions`;
}

export function VerdictCard({
  verdict,
  displayTitle,
  subtitle,
  checked,
  totalFound,
}: {
  verdict: Verdict;
  displayTitle: string;
  subtitle: string | null;
  checked: number;
  totalFound: number | null;
}) {
  const copy = TIER_COPY[verdict.tier];
  const dominant = verdict.dominant;
  // Signal color has one job: the verdict that should make an author pause.
  const stampColor = verdict.tier === "crowded" ? "text-signal" : "text-ink";
  const links = retailLinks(displayTitle);
  const moreRecords = totalFound !== null && totalFound > checked;

  return (
    <article
      className="rounded-md border border-rule bg-card p-5 sm:p-6"
      data-tier={verdict.tier}
      aria-labelledby="verdict-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <p className="text-xs text-ink-muted">Verdict for</p>
          <h2 id="verdict-heading" className="text-2xl font-semibold leading-tight text-ink">
            {displayTitle}
            {subtitle ? (
              <span className="block text-base font-normal text-ink-muted">{subtitle}</span>
            ) : null}
          </h2>
        </div>
        <p className={`stamp anim-stamp rounded-sm font-mono text-sm font-medium ${stampColor}`}>
          {copy.label}
        </p>
      </div>

      <p className="mt-4 max-w-prose leading-relaxed text-ink">{copy.summary}</p>

      {dominant ? (
        <div className="mt-5 flex gap-4 border-t border-rule pt-4">
          <div className="h-[72px] w-12 shrink-0 overflow-hidden rounded-sm border border-rule bg-skeleton">
            {dominant.work.coverId ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`${COVER_BASE}${dominant.work.coverId}-M.jpg`}
                alt=""
                width={48}
                height={72}
                decoding="async"
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-ink-muted">
              {dominant.kind === "exact" ? "The book to beat, same title" : "The book to beat, near match"}
            </p>
            <p className="font-medium leading-snug text-ink">
              {dominant.work.title}
              {dominant.work.authors[0] ? (
                <span className="font-normal text-ink-muted"> by {dominant.work.authors[0]}</span>
              ) : null}
            </p>
            <p className="mt-1 font-mono text-xs text-ink-muted">
              {dominant.earliestYear !== undefined
                ? dominant.latestYear !== undefined && dominant.latestYear !== dominant.earliestYear
                  ? `${dominant.earliestYear}–${dominant.latestYear}`
                  : String(dominant.earliestYear)
                : "year unknown"}
              <span aria-hidden="true"> · </span>
              {pluralEditions(dominant.totalEditions)}
              {dominant.records.length > 1 ? (
                <>
                  <span aria-hidden="true"> · </span>
                  {num(dominant.records.length)} catalogue records
                </>
              ) : null}
            </p>
          </div>
        </div>
      ) : null}

      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-rule pt-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-ink-muted">Exact matches</dt>
          <dd className="font-mono text-ink">{verdict.exact.length}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-muted">Near matches</dt>
          <dd className="font-mono text-ink">{verdict.near.length}</dd>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <dt className="text-xs text-ink-muted">Records checked</dt>
          <dd className="font-mono text-ink">
            {moreRecords ? `${num(checked)} of ${num(totalFound)}` : num(checked)}
          </dd>
        </div>
      </dl>
      {moreRecords ? (
        <p className="mt-2 max-w-prose text-xs text-ink-muted">
          Open Library holds {num(totalFound)} records mentioning this title. The {num(checked)} most
          relevant were judged; the rest are mostly weaker matches and duplicates.
        </p>
      ) : null}

      <div className="mt-5 border-t border-rule pt-4">
        <p className="max-w-prose leading-relaxed text-ink">{copy.nextStep}</p>
        <p className="mt-2 text-sm text-ink-muted">
          See this title on{" "}
          {links.map((l, i) => (
            <span key={l.label}>
              <a
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block py-1 font-medium text-ink underline decoration-rule underline-offset-4 hover:decoration-accent"
              >
                {l.label}
              </a>
              {i < links.length - 1 ? (i === links.length - 2 ? " and " : ", ") : "."}
            </span>
          ))}
        </p>
      </div>

      <div className="mt-4 border-t border-rule pt-4">
        <DiscoverabilityNote compact />
      </div>
    </article>
  );
}
