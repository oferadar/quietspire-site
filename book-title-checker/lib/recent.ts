import { useMemo, useSyncExternalStore } from "react";
import { normalizeTitle } from "./normalize";
import type { Tier } from "./verdict";

/**
 * Recent checks, kept in the browser's localStorage only. Nothing here ever
 * reaches the server. Every access is wrapped: private windows, blocked
 * storage and old browsers all fall back to "no recent checks".
 */

const KEY = "btc:recent";
const MAX = 8;

export interface RecentCheck {
  title: string;
  tier: Tier;
  at: number;
}

const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function getSnapshot(): string {
  try {
    return window.localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function getServerSnapshot(): string {
  return "[]";
}

function parse(raw: string): RecentCheck[] {
  try {
    const list = JSON.parse(raw) as unknown;
    if (!Array.isArray(list)) return [];
    return list.filter(
      (r): r is RecentCheck =>
        typeof r === "object" &&
        r !== null &&
        typeof (r as RecentCheck).title === "string" &&
        ["clear", "in-use", "crowded"].includes((r as RecentCheck).tier),
    );
  } catch {
    return [];
  }
}

export function useRecentChecks(): RecentCheck[] {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(() => parse(raw), [raw]);
}

export function rememberCheck(title: string, tier: Tier): void {
  try {
    const main = normalizeTitle(title).main;
    const list = parse(getSnapshot()).filter((r) => normalizeTitle(r.title).main !== main);
    list.unshift({ title, tier, at: Date.now() });
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
    emit();
  } catch {
    /* storage unavailable: the feature simply does nothing */
  }
}

export function forgetChecks(): void {
  try {
    window.localStorage.removeItem(KEY);
    emit();
  } catch {
    /* ignore */
  }
}
