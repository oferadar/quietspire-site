"use client";

import { useState } from "react";
import type { WorkResult } from "@/lib/booksource";
import type { MatchGroup } from "@/lib/verdict";

/** Rows shown before the list folds behind a "show all" button. */
const FOLD_AFTER = 8;

const COVER_BASE = "https://covers.openlibrary.org/b/id/";

function num(n: number): string {
  return n.toLocaleString("en-US");
}

function pluralEditions(n: number): string {
  return n === 1 ? "1 edition" : `${num(n)} editions`;
}

function yearRange(g: MatchGroup): string {
  if (g.earliestYear === undefined) return "year unknown";
  if (g.latestYear !== undefined && g.latestYear !== g.earliestYear) return `${g.earliestYear}–${g.latestYear}`;
  return String(g.earliestYear);
}

function GroupRow({ group }: { group: MatchGroup }) {
  const { work } = group;
  const authors = work.authors.length > 0 ? work.authors.slice(0, 3).join(", ") : "Author unknown";
  const more = work.authors.length > 3 ? ` and ${work.authors.length - 3} more` : "";
  const href = `https://openlibrary.org${work.key}`;

  return (
    <li className="flex gap-4 py-3">
      <div className="h-[72px] w-12 shrink-0 overflow-hidden rounded-sm border border-rule bg-skeleton">
        {work.coverId ? (
          // Plain <img>, not next/image: covers are already small, come from a
          // third-party host, and image optimization would add a paid quota
          // to a site that must stay free to run. Width/height reserve space
          // so a late-loading cover cannot shift layout.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${COVER_BASE}${work.coverId}-M.jpg`}
            alt=""
            width={48}
            height={72}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium leading-snug text-ink">
          <a
            href={href}
            rel="noopener noreferrer"
            target="_blank"
            className="inline-block py-0.5 underline decoration-rule underline-offset-4 hover:decoration-accent"
          >
            {work.title}
          </a>
          {work.subtitle ? (
            <span className="block text-sm font-normal text-ink-muted">{work.subtitle}</span>
          ) : null}
        </p>
        <p className="mt-0.5 text-sm text-ink-muted">
          {authors}
          {more}
        </p>
        <p className="mt-1 font-mono text-xs text-ink-muted">
          <span>{yearRange(group)}</span>
          <span aria-hidden="true"> · </span>
          <span>{pluralEditions(group.totalEditions)}</span>
          {group.records.length > 1 ? (
            <>
              <span aria-hidden="true"> · </span>
              <span>{num(group.records.length)} catalogue records</span>
            </>
          ) : null}
        </p>
      </div>
    </li>
  );
}

export function MatchList({
  heading,
  description,
  groups,
}: {
  heading: string;
  description: string;
  groups: MatchGroup[];
}) {
  const [expanded, setExpanded] = useState(false);
  if (groups.length === 0) return null;
  const id = `matches-${heading.toLowerCase().replace(/\s+/g, "-")}`;
  const folded = !expanded && groups.length > FOLD_AFTER + 2;
  const visible = folded ? groups.slice(0, FOLD_AFTER) : groups;
  return (
    <section className="mt-8" aria-labelledby={id}>
      <h3 id={id} className="text-sm font-medium text-ink">
        {heading} <span className="font-mono text-ink-muted">{groups.length}</span>
      </h3>
      <p className="mt-1 text-sm text-ink-muted">{description}</p>
      <ul className="mt-3 divide-y divide-rule border-y border-rule">
        {visible.map((g) => (
          <GroupRow key={g.work.key} group={g} />
        ))}
      </ul>
      {folded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-3 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-ink hover:border-ink"
        >
          Show all {groups.length}
        </button>
      ) : null}
    </section>
  );
}

/** Collapsed list of loose matches or noise: title, author, year. */
export function CompactList({
  summary,
  detail,
  items,
}: {
  summary: string;
  detail: string;
  items: { work: WorkResult; key: string }[];
}) {
  if (items.length === 0) return null;
  return (
    <details className="mt-8 border-t border-rule pt-3">
      <summary className="cursor-pointer list-none py-1 text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
        {summary} <span className="font-mono text-ink-muted">{items.length}</span>
        <span className="ml-2 font-normal text-ink-muted">{detail}</span>
      </summary>
      <ul className="mt-2 divide-y divide-rule">
        {items.map(({ work, key }) => (
          <li key={key} className="py-2 text-sm">
            <a
              href={`https://openlibrary.org${work.key}`}
              rel="noopener noreferrer"
              target="_blank"
              className="inline-block py-0.5 font-medium text-ink underline decoration-rule underline-offset-4 hover:decoration-accent"
            >
              {work.title}
            </a>
            <span className="text-ink-muted">
              {work.authors[0] ? ` · ${work.authors[0]}` : ""}
              {work.firstPublishYear ? ` · ${work.firstPublishYear}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}
