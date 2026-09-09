"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { CheckResponse } from "@/app/api/check/route";
import { normalizeTitle } from "@/lib/normalize";
import { forgetChecks, rememberCheck, useRecentChecks } from "@/lib/recent";
import { TIER_COPY, type Tier, type Verdict } from "@/lib/verdict";
import { CompactList, MatchList } from "./MatchList";
import { VerdictCard } from "./VerdictCard";

const TITLE_PARAM = "title";
const TITLES_PARAM = "titles";
const MAX_COMPARE = 5;
const MIN_LENGTH = 2;

type Mode = "single" | "compare";

type SingleState =
  | { status: "idle" }
  | { status: "loading"; raw: string }
  | { status: "invalid"; message: string }
  | { status: "unavailable"; raw: string; message: string }
  | {
      status: "done";
      raw: string;
      subtitle: string | null;
      verdict: Verdict;
      checked: number;
      totalFound: number | null;
    };

interface CompareRow {
  raw: string;
  status: "loading" | "done" | "invalid" | "unavailable";
  verdict?: Verdict;
  message?: string;
}

const TIER_ORDER: Record<Tier, number> = { clear: 0, "in-use": 1, crowded: 2 };

const UNAVAILABLE_MESSAGE =
  "Search is temporarily unavailable. The catalogue did not answer. Try again in a minute.";

async function fetchCheck(main: string, signal: AbortSignal): Promise<CheckResponse | null> {
  try {
    const res = await fetch(`/api/check?q=${encodeURIComponent(main)}`, {
      signal,
      headers: { Accept: "application/json" },
    });
    return (await res.json()) as CheckResponse;
  } catch {
    return null;
  }
}

function setUrlParams(params: Record<string, string | null>) {
  try {
    const url = new URL(window.location.href);
    for (const [k, v] of Object.entries(params)) {
      if (v === null) url.searchParams.delete(k);
      else url.searchParams.set(k, v);
    }
    window.history.replaceState(null, "", url.toString());
  } catch {
    /* history is a convenience, never a requirement */
  }
}

/** One title per line, trimmed, de-duplicated after normalization, capped. */
function splitTitles(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const raw = line.trim();
    if (!raw) continue;
    const main = normalizeTitle(raw).main;
    if (seen.has(main)) continue;
    seen.add(main);
    out.push(raw);
    if (out.length === MAX_COMPARE) break;
  }
  return out;
}

function displayTitleOf(raw: string): string {
  return normalizeTitle(raw).subtitle ? raw.slice(0, raw.indexOf(":")).trim() : raw;
}

/**
 * The search box and everything it produces. Results render in place: no
 * navigation, no modal. The results region has a fixed minimum height so the
 * loading state and the verdict occupy the same space and nothing jumps.
 *
 * Two modes share the region: one title, or a shortlist of up to five.
 */
export function TitleChecker({ examples }: { examples: string[] }) {
  const [mode, setMode] = useState<Mode>("single");
  const [raw, setRaw] = useState("");
  const [shortlist, setShortlist] = useState("");
  const [state, setState] = useState<SingleState>({ status: "idle" });
  const [rows, setRows] = useState<CompareRow[] | null>(null);
  const [status, setStatus] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const recent = useRecentChecks();
  const inputId = useId();
  const hintId = useId();
  const listId = useId();
  const listHintId = useId();

  const runSearch = useCallback(async (value: string) => {
    const trimmed = value.trim();
    const normalized = normalizeTitle(trimmed);

    if (normalized.main.length === 0) {
      setState({ status: "invalid", message: "Type a title first." });
      setStatus("Type a title first.");
      inputRef.current?.focus();
      return;
    }
    if (normalized.main.length < MIN_LENGTH) {
      setState({ status: "invalid", message: "Type at least two characters." });
      setStatus("Type at least two characters.");
      inputRef.current?.focus();
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState({ status: "loading", raw: trimmed });
    setStatus(`Checking ${trimmed}.`);
    setUrlParams({ [TITLE_PARAM]: trimmed, [TITLES_PARAM]: null });

    const body = await fetchCheck(normalized.main, controller.signal);
    if (controller.signal.aborted) return;

    if (!body) {
      setState({ status: "unavailable", raw: trimmed, message: UNAVAILABLE_MESSAGE });
      setStatus("Search is temporarily unavailable.");
      return;
    }
    if (!body.ok) {
      if (body.error === "unavailable") {
        setState({ status: "unavailable", raw: trimmed, message: body.message });
        setStatus("Search is temporarily unavailable.");
      } else {
        setState({ status: "invalid", message: body.message });
        setStatus(body.message);
      }
      return;
    }
    const v = body.verdict;
    setState({
      status: "done",
      raw: trimmed,
      subtitle: normalized.subtitle,
      verdict: v,
      checked: body.checked,
      totalFound: body.totalFound,
    });
    setStatus(
      `${TIER_COPY[v.tier].label}. ${v.exact.length} exact ${v.exact.length === 1 ? "match" : "matches"}, ${v.near.length} near.`,
    );
    rememberCheck(trimmed, v.tier);
  }, []);

  const runCompare = useCallback(async (titles: string[]) => {
    const list = titles.slice(0, MAX_COMPARE);
    if (list.length === 0) {
      setRows(null);
      setStatus("Type at least one title.");
      textareaRef.current?.focus();
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setRows(list.map((r) => ({ raw: r, status: "loading" })));
    setStatus(`Comparing ${list.length} titles.`);
    setUrlParams({ [TITLE_PARAM]: null, [TITLES_PARAM]: list.join("\n") });

    const update = (i: number, patch: Partial<CompareRow>) =>
      setRows((prev) => (prev ? prev.map((r, j) => (j === i ? { ...r, ...patch } : r)) : prev));

    await Promise.all(
      list.map(async (rawTitle, i) => {
        const n = normalizeTitle(rawTitle);
        if (n.main.length < MIN_LENGTH) {
          update(i, { status: "invalid", message: "Too short to check." });
          return;
        }
        const body = await fetchCheck(n.main, controller.signal);
        if (controller.signal.aborted) return;
        if (!body) update(i, { status: "unavailable", message: "Search unavailable. Try again." });
        else if (!body.ok) {
          update(i, {
            status: body.error === "unavailable" ? "unavailable" : "invalid",
            message: body.error === "unavailable" ? "Search unavailable. Try again." : body.message,
          });
        } else {
          update(i, { status: "done", verdict: body.verdict });
          rememberCheck(rawTitle, body.verdict.tier);
        }
      }),
    );
    if (!controller.signal.aborted) setStatus(`Compared ${list.length} titles.`);
  }, []);

  const switchMode = useCallback((next: Mode) => {
    abortRef.current?.abort();
    setMode(next);
    setState({ status: "idle" });
    setRows(null);
    setStatus("");
    setUrlParams({ [TITLE_PARAM]: null, [TITLES_PARAM]: null });
  }, []);

  const openSingle = useCallback(
    (value: string) => {
      abortRef.current?.abort();
      setMode("single");
      setRows(null);
      setRaw(value);
      void runSearch(value);
    },
    [runSearch],
  );

  // Deep links: /?title=... or /?titles=a%0Ab run on load, and every search
  // updates the URL in place so a result can be shared or refreshed.
  //
  // This is a one-time read of an external system (the URL) on mount, which
  // is what effects are for. The set-state-in-effect rule cannot tell that
  // apart from a render loop, so it is disabled for this block. The
  // alternative, useSearchParams(), would pull the search box out of the
  // prerendered HTML behind a Suspense boundary, which is worse.
  useEffect(() => {
    let params: URLSearchParams;
    try {
      params = new URLSearchParams(window.location.search);
    } catch {
      return;
    }
    const single = (params.get(TITLE_PARAM) ?? "").trim();
    const multi = params.get(TITLES_PARAM) ?? "";
    /* eslint-disable react-hooks/set-state-in-effect */
    if (multi.trim().length > 0) {
      const titles = splitTitles(multi);
      setMode("compare");
      setShortlist(titles.join("\n"));
      void runCompare(titles);
    } else if (single.length > 0) {
      setRaw(single);
      void runSearch(single);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [runSearch, runCompare]);

  // Put the caret where the work is when the mode changes.
  useEffect(() => {
    if (mode === "compare") textareaRef.current?.focus();
  }, [mode]);

  const busy = state.status === "loading" || (rows?.some((r) => r.status === "loading") ?? false);

  return (
    <div>
      <p role="status" aria-live="polite" className="sr-only">
        {status}
      </p>

      {mode === "single" ? (
        <>
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              void runSearch(raw);
            }}
            className="flex flex-col gap-3 sm:flex-row"
            noValidate
          >
            <div className="flex-1">
              <label htmlFor={inputId} className="sr-only">
                Book title to check
              </label>
              <input
                ref={inputRef}
                id={inputId}
                name="title"
                type="text"
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                placeholder="Type a book title"
                autoFocus
                autoComplete="off"
                autoCapitalize="words"
                enterKeyHint="search"
                maxLength={200}
                aria-describedby={hintId}
                aria-invalid={state.status === "invalid" ? true : undefined}
                className="h-14 w-full rounded-md border border-border bg-card px-4 text-lg text-ink"
              />
            </div>
            <button
              type="submit"
              disabled={state.status === "loading"}
              className="h-14 rounded-md bg-accent px-6 font-medium text-accent-ink transition-opacity duration-150 disabled:opacity-60 sm:min-w-32"
            >
              {state.status === "loading" ? "Checking…" : "Check title"}
            </button>
          </form>
          <p id={hintId} className="mt-2 text-sm text-ink-muted">
            Subtitles after a colon are set aside. “The”, case and punctuation are ignored.{" "}
            <button
              type="button"
              onClick={() => switchMode("compare")}
              className="inline-block py-1 text-ink underline decoration-rule underline-offset-4 hover:decoration-accent"
            >
              Have a shortlist? Compare up to five titles.
            </button>
          </p>
        </>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runCompare(splitTitles(shortlist));
          }}
          noValidate
        >
          <label htmlFor={listId} className="text-sm font-medium text-ink">
            Your shortlist, one title per line
          </label>
          <textarea
            ref={textareaRef}
            id={listId}
            name="titles"
            rows={5}
            value={shortlist}
            onChange={(e) => setShortlist(e.target.value)}
            placeholder={"The Guest\nSanctuary\nThe Ledger"}
            autoCapitalize="words"
            aria-describedby={listHintId}
            className="mt-1 w-full rounded-md border border-border bg-card px-4 py-3 text-lg leading-snug text-ink"
          />
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            <button
              type="submit"
              disabled={busy}
              className="h-12 rounded-md bg-accent px-6 font-medium text-accent-ink transition-opacity duration-150 disabled:opacity-60"
            >
              {busy ? "Comparing…" : "Compare titles"}
            </button>
            <button
              type="button"
              onClick={() => switchMode("single")}
              className="inline-block py-1 text-sm text-ink underline decoration-rule underline-offset-4 hover:decoration-accent"
            >
              Check one title instead
            </button>
          </div>
          <p id={listHintId} className="mt-2 text-sm text-ink-muted">
            Up to five. Each title gets the same verdict as a single check; the list is sorted
            clearest first once every answer is in.
          </p>
        </form>
      )}

      <div className="mt-6 min-h-72" aria-busy={busy}>
        {mode === "single" ? (
          <>
            {state.status === "idle" ? (
              <EmptyState
                examples={examples}
                recent={recent}
                onPick={openSingle}
              />
            ) : null}
            {state.status === "invalid" ? (
              <p role="alert" className="font-medium text-signal">
                {state.message}
              </p>
            ) : null}
            {state.status === "loading" ? <LoadingSkeleton title={state.raw} /> : null}
            {state.status === "unavailable" ? (
              <Unavailable raw={state.raw} message={state.message} onRetry={() => void runSearch(state.raw)} />
            ) : null}
            {state.status === "done" ? (
              <Results
                raw={state.raw}
                subtitle={state.subtitle}
                verdict={state.verdict}
                checked={state.checked}
                totalFound={state.totalFound}
              />
            ) : null}
          </>
        ) : rows ? (
          <CompareResults rows={rows} onOpen={openSingle} onRetry={() => void runCompare(rows.map((r) => r.raw))} />
        ) : (
          <p className="max-w-prose text-sm leading-relaxed text-ink-muted">
            Paste the titles you are choosing between. You will get one verdict per title, the
            strongest competitor for each, and a link to the full results.
          </p>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  examples,
  recent,
  onPick,
}: {
  examples: string[];
  recent: { title: string; tier: Tier }[];
  onPick: (v: string) => void;
}) {
  const chip =
    "rounded-md border border-border bg-card px-3 py-1.5 text-sm text-ink hover:border-ink";
  return (
    <div className="min-h-72">
      <p className="text-sm font-medium text-ink">Try one</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {examples.map((ex) => (
          <li key={ex}>
            <button type="button" onClick={() => onPick(ex)} className={chip}>
              {ex}
            </button>
          </li>
        ))}
      </ul>
      {recent.length > 0 ? (
        <>
          <p className="mt-5 flex items-baseline gap-3 text-sm font-medium text-ink">
            Your recent checks
            <button
              type="button"
              onClick={forgetChecks}
              className="inline-block py-1 text-sm font-normal text-ink-muted underline decoration-rule underline-offset-4 hover:decoration-accent"
            >
              Forget
            </button>
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {recent.map((r) => (
              <li key={r.title}>
                <button type="button" onClick={() => onPick(r.title)} className={chip}>
                  {r.title}
                  <span className="text-ink-muted"> · {TIER_COPY[r.tier].label}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      <p className="mt-5 max-w-prose text-sm leading-relaxed text-ink-muted">
        The verdict is one word: Clear, In use, or Crowded. Under it: the book to beat, every
        matching book with author, years and edition count, and links to the same search on Amazon
        and Goodreads.
      </p>
    </div>
  );
}

function LoadingSkeleton({ title }: { title: string }) {
  // 0: nothing yet. 1: a normal wait. 2: Open Library is hanging and the
  // server is on its second or third attempt.
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 1500);
    const t2 = setTimeout(() => setStage(2), 9000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);
  return (
    <div className="min-h-72 rounded-md border border-rule bg-card p-5 sm:p-6" aria-hidden="true">
      <p className="text-xs text-ink-muted">Checking</p>
      <p className="text-2xl font-semibold leading-tight text-ink">{title}</p>
      <div className="mt-4 space-y-2">
        <div className="skeleton h-4 w-11/12 rounded" />
        <div className="skeleton h-4 w-9/12 rounded" />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3">
        <div className="skeleton h-9 rounded" />
        <div className="skeleton h-9 rounded" />
        <div className="skeleton h-9 rounded" />
      </div>
      <p className="mt-5 min-h-5 text-sm text-ink-muted">
        {stage === 1
          ? "Asking Open Library. This usually takes a few seconds; the next check of this title is instant."
          : stage === 2
            ? "Open Library is slow right now. Still trying, for up to about twenty seconds."
            : ""}
      </p>
    </div>
  );
}

function Unavailable({ raw, message, onRetry }: { raw: string; message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-md border border-signal bg-card p-5">
      <p className="font-medium text-signal">Search temporarily unavailable</p>
      <p className="mt-2 text-ink">{message}</p>
      <p className="mt-1 max-w-prose text-sm text-ink-muted">
        No verdict is shown for “{raw}” because none could be computed. A missing answer does not
        make a title clear.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-ink hover:border-ink"
      >
        Try again
      </button>
    </div>
  );
}

function Results({
  raw,
  subtitle,
  verdict,
  checked,
  totalFound,
}: {
  raw: string;
  subtitle: string | null;
  verdict: Verdict;
  checked: number;
  totalFound: number | null;
}) {
  return (
    <div className="anim-rise">
      <VerdictCard
        verdict={verdict}
        displayTitle={displayTitleOf(raw)}
        subtitle={subtitle}
        checked={checked}
        totalFound={totalFound}
      />
      <MatchList
        heading="Exact matches"
        description="Same title after normalization. Records for one book by one author are folded into a single row."
        groups={verdict.exact}
      />
      <MatchList
        heading="Near matches"
        description="A letter or two different, or one title begins with the other."
        groups={verdict.near}
      />
      <CompactList
        summary="Similar titles"
        detail="share most of their words and do not count toward the verdict"
        items={verdict.loose.map((g) => ({ work: g.work, key: g.work.key }))}
      />
      <CompactList
        summary="Set aside as catalogue noise"
        detail="summaries, journals, box sets and similar records that are not books you compete with"
        items={verdict.noise.map((w) => ({ work: w, key: w.key }))}
      />
      {verdict.exact.length === 0 && verdict.near.length === 0 ? (
        <p className="mt-6 max-w-prose text-sm text-ink-muted">
          No exact or near matches in Open Library. Search Amazon and Goodreads by hand before you
          commit: very new self-published books can take a while to appear in the catalogue.
        </p>
      ) : null}
    </div>
  );
}

function CompareResults({
  rows,
  onOpen,
  onRetry,
}: {
  rows: CompareRow[];
  onOpen: (raw: string) => void;
  onRetry: () => void;
}) {
  const allDone = rows.every((r) => r.status !== "loading");
  const ordered = allDone
    ? [...rows].sort((a, b) => {
        const ta = a.verdict ? TIER_ORDER[a.verdict.tier] : 3;
        const tb = b.verdict ? TIER_ORDER[b.verdict.tier] : 3;
        return ta - tb;
      })
    : rows;
  const anyUnavailable = rows.some((r) => r.status === "unavailable");
  const linkClass =
    "inline-block py-1 text-sm text-ink underline decoration-rule underline-offset-4 hover:decoration-accent";

  return (
    <div className={allDone ? "anim-rise" : undefined}>
      <ol className="divide-y divide-rule border-y border-rule">
        {ordered.map((row) => {
          const v = row.verdict;
          const d = v?.dominant ?? null;
          return (
            <li key={row.raw} className="py-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <p className="min-w-0 flex-1 font-medium text-ink">{displayTitleOf(row.raw)}</p>
                {row.status === "loading" ? (
                  <span className="skeleton h-7 w-24 rounded-sm" aria-hidden="true" />
                ) : null}
                {v ? (
                  <span
                    className={`stamp rounded-sm font-mono text-xs font-medium ${
                      v.tier === "crowded" ? "text-signal" : "text-ink"
                    }`}
                  >
                    {TIER_COPY[v.tier].label}
                  </span>
                ) : null}
              </div>
              {v ? (
                <>
                  <p className="mt-1 text-sm text-ink-muted">
                    <span className="font-mono">{v.exact.length}</span> exact ·{" "}
                    <span className="font-mono">{v.near.length}</span> near
                    {d ? (
                      <>
                        {" · book to beat: "}
                        <span className="text-ink">{d.work.title}</span>
                        {d.work.authors[0] ? ` by ${d.work.authors[0]}` : ""}
                        {d.earliestYear ? ` (${d.earliestYear})` : ""}
                      </>
                    ) : null}
                  </p>
                  <button type="button" onClick={() => onOpen(row.raw)} className={linkClass}>
                    Full results
                  </button>
                </>
              ) : null}
              {row.status === "invalid" || row.status === "unavailable" ? (
                <p className="mt-1 text-sm text-signal">{row.message}</p>
              ) : null}
            </li>
          );
        })}
      </ol>
      {allDone && anyUnavailable ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-ink hover:border-ink"
        >
          Try the missing ones again
        </button>
      ) : null}
    </div>
  );
}
