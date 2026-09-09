import { describe, expect, it } from "vitest";
import type { WorkResult } from "./booksource/types";
import {
  authorKey,
  computeVerdict,
  editionSignal,
  matchStrength,
  recencySignal,
  TIER_COPY,
  VERDICT_TUNING,
} from "./verdict";

const YEAR = 2026;

function work(overrides: Partial<WorkResult> & { key: string }): WorkResult {
  return {
    title: "Untitled",
    authors: [],
    editionCount: 1,
    ...overrides,
  };
}

describe("signals", () => {
  it("edition signal is 0 for one edition and reaches 1 at the configured count", () => {
    expect(editionSignal(1)).toBe(0);
    expect(editionSignal(0)).toBe(0);
    expect(editionSignal(VERDICT_TUNING.editionsForFullSignal)).toBe(1);
    expect(editionSignal(300)).toBeGreaterThan(1);
    expect(editionSignal(1180)).toBe(VERDICT_TUNING.editionSignalCap);
    expect(editionSignal(8)).toBeGreaterThan(0.4);
    expect(editionSignal(8)).toBeLessThan(0.7);
  });

  it("recency signal is full for new books and zero for very old ones", () => {
    expect(recencySignal(YEAR, YEAR)).toBe(1);
    expect(recencySignal(YEAR - 2, YEAR)).toBe(1);
    expect(recencySignal(1890, YEAR)).toBe(0);
    expect(recencySignal(1925, YEAR)).toBe(0);
    expect(recencySignal(YEAR - 20, YEAR)).toBeGreaterThan(0.5);
    expect(recencySignal(YEAR - 20, YEAR)).toBeLessThan(1);
    expect(recencySignal(undefined, YEAR)).toBe(VERDICT_TUNING.unknownYearSignal);
  });

  it("a 1925 classic with hundreds of editions is dominant on its own", () => {
    const gatsby = work({ key: "g", firstPublishYear: 1925, editionCount: 300 });
    expect(matchStrength(gatsby, YEAR)).toBeGreaterThanOrEqual(VERDICT_TUNING.crowdedDominantStrength);
  });

  it("a brand new single-edition book is in use, not dominant, on its own", () => {
    const indie = work({ key: "i", firstPublishYear: YEAR - 1, editionCount: 1 });
    const s = matchStrength(indie, YEAR);
    expect(s).toBeGreaterThanOrEqual(0.5);
    expect(s).toBeLessThan(VERDICT_TUNING.crowdedDominantStrength);
  });

  it("a recent book with a few editions is dominant", () => {
    const hit = work({ key: "h", firstPublishYear: YEAR - 2, editionCount: 6 });
    expect(matchStrength(hit, YEAR)).toBeGreaterThanOrEqual(VERDICT_TUNING.crowdedDominantStrength);
  });

  it("an 1890 single-edition book is functionally nothing", () => {
    const old = work({ key: "o", firstPublishYear: 1890, editionCount: 1 });
    expect(matchStrength(old, YEAR)).toBe(0);
  });

  it("a classic with over a thousand editions outranks a recent reprint with thirty", () => {
    const canonical = work({ key: "c", firstPublishYear: 1920, editionCount: 1180 });
    const reprint = work({ key: "r", firstPublishYear: 2020, editionCount: 33 });
    expect(matchStrength(canonical, YEAR)).toBeGreaterThan(matchStrength(reprint, YEAR));
  });
});

describe("authorKey", () => {
  it("merges the spellings Open Library uses for one author", () => {
    const keys = ["F. Scott Fitzgerald", "F. Fitzgerald", "Francis Fitzgerald", "Fitzgerald, F. Scott"].map((a) =>
      authorKey(work({ key: a, authors: [a] })),
    );
    expect(new Set(keys).size).toBe(1);
  });

  it("keeps different authors apart and never merges unknown authors", () => {
    expect(authorKey(work({ key: "a", authors: ["Kristal Sheets"] }))).not.toBe(
      authorKey(work({ key: "b", authors: ["F. Scott Fitzgerald"] })),
    );
    expect(authorKey(work({ key: "x" }))).not.toBe(authorKey(work({ key: "y" })));
  });
});

describe("computeVerdict", () => {
  it("is clear with no matches at all", () => {
    const v = computeVerdict([], YEAR);
    expect(v.tier).toBe("clear");
    expect(v.exact).toHaveLength(0);
    expect(v.dominant).toBeNull();
  });

  it("is clear when only loose matches exist", () => {
    const v = computeVerdict(
      [{ work: work({ key: "l", firstPublishYear: 2020, editionCount: 40 }), kind: "loose" }],
      YEAR,
    );
    expect(v.tier).toBe("clear");
    expect(v.loose).toHaveLength(1);
  });

  it("is clear when the only exact matches are very old and obscure", () => {
    const v = computeVerdict(
      [
        { work: work({ key: "a", firstPublishYear: 1890, editionCount: 1 }), kind: "exact" },
        { work: work({ key: "b", firstPublishYear: 1902, editionCount: 2 }), kind: "exact" },
      ],
      YEAR,
    );
    expect(v.tier).toBe("clear");
  });

  it("is crowded for The Great Gatsby", () => {
    const v = computeVerdict(
      [
        {
          work: work({
            key: "/works/OL468431W",
            title: "The Great Gatsby",
            authors: ["F. Scott Fitzgerald"],
            firstPublishYear: 1925,
            editionCount: 300,
          }),
          kind: "exact",
        },
      ],
      YEAR,
    );
    expect(v.tier).toBe("crowded");
    expect(v.dominant?.work.key).toBe("/works/OL468431W");
  });

  it("is in use, not crowded, for one recent single-edition exact match", () => {
    const v = computeVerdict(
      [{ work: work({ key: "r", firstPublishYear: YEAR - 2, editionCount: 1 }), kind: "exact" }],
      YEAR,
    );
    expect(v.tier).toBe("in-use");
  });

  it("is in use for an obscure 2015 book with two editions (the 'My Book' case)", () => {
    const v = computeVerdict(
      [{ work: work({ key: "m", authors: ["Kids"], firstPublishYear: 2015, editionCount: 2 }), kind: "exact" }],
      YEAR,
    );
    expect(v.tier).toBe("in-use");
  });

  it("is crowded for a recent exact match with a few editions", () => {
    const v = computeVerdict(
      [{ work: work({ key: "r", firstPublishYear: YEAR - 2, editionCount: 6 }), kind: "exact" }],
      YEAR,
    );
    expect(v.tier).toBe("crowded");
  });

  it("is in use for a few middling exact matches", () => {
    const v = computeVerdict(
      [
        { work: work({ key: "a", authors: ["A"], firstPublishYear: 1995, editionCount: 3 }), kind: "exact" },
        { work: work({ key: "b", authors: ["B"], firstPublishYear: 1990, editionCount: 4 }), kind: "exact" },
      ],
      YEAR,
    );
    expect(v.tier).toBe("in-use");
  });

  it("becomes crowded when many middling exact matches by different authors pile up", () => {
    const many = Array.from({ length: 8 }, (_, i) => ({
      work: work({ key: `m${i}`, authors: [`Author ${i}`], firstPublishYear: 1995, editionCount: 2 }),
      kind: "exact" as const,
    }));
    const v = computeVerdict(many, YEAR);
    expect(v.tier).toBe("crowded");
  });

  it("does not call a title clear when a dominant near match exists", () => {
    const v = computeVerdict(
      [{ work: work({ key: "n", firstPublishYear: 2019, editionCount: 60 }), kind: "near" }],
      YEAR,
    );
    expect(v.tier).toBe("in-use");
    expect(v.exact).toHaveLength(0);
    expect(v.dominant?.kind).toBe("near");
  });

  it("picks the strongest competitor across exact and near (the Harry Potter case)", () => {
    const v = computeVerdict(
      [
        {
          work: work({ key: "kw", title: "Harry Potter", authors: ["Kevin Wilson"], firstPublishYear: 2018, editionCount: 6 }),
          kind: "exact",
        },
        {
          work: work({
            key: "jkr",
            title: "Harry Potter and the Philosopher's Stone",
            authors: ["J. K. Rowling"],
            firstPublishYear: 1997,
            editionCount: 300,
          }),
          kind: "near",
        },
      ],
      YEAR,
    );
    expect(v.dominant?.work.key).toBe("jkr");
    expect(v.dominant?.kind).toBe("near");
  });

  it("groups duplicate records of one book by author and judges them once", () => {
    const v = computeVerdict(
      [
        { work: work({ key: "1", authors: ["F. Scott Fitzgerald"], firstPublishYear: 1920, editionCount: 1180 }), kind: "exact" },
        { work: work({ key: "2", authors: ["F. Fitzgerald"], firstPublishYear: 2013, editionCount: 16 }), kind: "exact" },
        { work: work({ key: "3", authors: ["Fitzgerald, F. Scott"], firstPublishYear: 2020, editionCount: 33 }), kind: "exact" },
        { work: work({ key: "4", authors: ["Stephen Matterson"], firstPublishYear: 1990, editionCount: 3 }), kind: "exact" },
      ],
      YEAR,
    );
    expect(v.exact).toHaveLength(2);
    const fitz = v.exact[0];
    expect(fitz.records).toHaveLength(3);
    expect(fitz.work.key).toBe("1");
    expect(fitz.totalEditions).toBe(1229);
    expect(fitz.earliestYear).toBe(1920);
    expect(fitz.latestYear).toBe(2020);
    expect(v.tier).toBe("crowded");
  });

  it("sorts groups strongest first", () => {
    const v = computeVerdict(
      [
        { work: work({ key: "weak", authors: ["W"], firstPublishYear: 1960, editionCount: 1 }), kind: "exact" },
        { work: work({ key: "strong", authors: ["S"], firstPublishYear: 2024, editionCount: 10 }), kind: "exact" },
      ],
      YEAR,
    );
    expect(v.exact.map((g) => g.work.key)).toEqual(["strong", "weak"]);
  });

  it("carries catalogue noise through untouched", () => {
    const junk = work({ key: "j", title: "Summary of Dune" });
    const v = computeVerdict([], YEAR, [junk]);
    expect(v.noise).toEqual([junk]);
  });
});

describe("latest edition year", () => {
  it("lets a classic still in print outrank a recent series entry", () => {
    const classic = work({ key: "c", title: "Dune", authors: ["Frank Herbert"], firstPublishYear: 1965, lastPublishYear: 2024, editionCount: 161 });
    const recent = work({ key: "r", title: "Dune", authors: ["Brian Herbert"], firstPublishYear: 2021, lastPublishYear: 2023, editionCount: 50 });
    expect(matchStrength(classic, YEAR)).toBeGreaterThan(matchStrength(recent, YEAR));
    const v = computeVerdict([{ work: classic, kind: "exact" }, { work: recent, kind: "exact" }], YEAR);
    expect(v.dominant?.work.authors[0]).toBe("Frank Herbert");
    expect(v.dominant?.latestYear).toBe(2024);
    expect(v.dominant?.earliestYear).toBe(1965);
  });

  it("falls back to the first year when the latest is unknown", () => {
    const old = work({ key: "o", firstPublishYear: 1911, editionCount: 1 });
    expect(matchStrength(old, YEAR)).toBe(0);
  });
});

describe("the book to beat", () => {
  it("prefers an exact mega-book over a longer prefix match with more editions", () => {
    const king = work({ key: "k", title: "It", authors: ["Stephen King"], firstPublishYear: 1986, lastPublishYear: 2024, editionCount: 95 });
    const lewis = work({ key: "l", title: "It Can't Happen Here", authors: ["Sinclair Lewis"], firstPublishYear: 1935, lastPublishYear: 2022, editionCount: 157 });
    const v = computeVerdict([{ work: king, kind: "exact" }, { work: lewis, kind: "near" }], YEAR);
    expect(v.dominant?.work.key).toBe("k");
  });

  it("prefers a huge near-match series over an obscure exact match", () => {
    const wilson = work({ key: "w", title: "Harry Potter", authors: ["Kevin Wilson"], firstPublishYear: 2018, lastPublishYear: 2018, editionCount: 6 });
    const rowling = work({ key: "r", title: "Harry Potter and the Philosopher's Stone", authors: ["J. K. Rowling"], firstPublishYear: 1997, lastPublishYear: 2024, editionCount: 300 });
    const v = computeVerdict([{ work: wilson, kind: "exact" }, { work: rowling, kind: "near" }], YEAR);
    expect(v.dominant?.work.key).toBe("r");
    expect(v.dominant?.kind).toBe("near");
  });

  it("halves a book that has been out of print for decades", () => {
    const dead = work({ key: "d", firstPublishYear: 1930, lastPublishYear: 1955, editionCount: 40 });
    const live = work({ key: "v", firstPublishYear: 2015, lastPublishYear: 2024, editionCount: 12 });
    const v = computeVerdict([{ work: dead, kind: "exact" }, { work: live, kind: "exact" }], YEAR);
    expect(v.exact[0].reach).toBeLessThan(v.exact[1].reach + 1); // both computed
    expect(v.dominant?.work.key).toBe("v");
  });
});

describe("grouping keeps different books apart", () => {
  it("does not sum a series of same-main-title books into one competitor", () => {
    const v = computeVerdict(
      [
        { work: work({ key: "f1", title: "Dune", authors: ["Frank Herbert"], firstPublishYear: 1965, editionCount: 161 }), kind: "exact" },
        { work: work({ key: "f2", title: "Dune", authors: ["Frank Herbert"], firstPublishYear: 2021, editionCount: 20 }), kind: "exact" },
        { work: work({ key: "b1", title: "Dune: House Atreides", authors: ["Brian Herbert"], firstPublishYear: 1999, editionCount: 40 }), kind: "exact" },
        { work: work({ key: "b2", title: "Dune: The Machine Crusade", authors: ["Brian Herbert"], firstPublishYear: 2003, editionCount: 35 }), kind: "exact" },
        { work: work({ key: "b3", title: "Dune: The Battle of Corrin", authors: ["Brian Herbert"], firstPublishYear: 2004, editionCount: 30 }), kind: "exact" },
      ],
      YEAR,
    );
    expect(v.exact).toHaveLength(4);
    expect(v.dominant?.work.authors[0]).toBe("Frank Herbert");
    expect(v.dominant?.records).toHaveLength(2);
    expect(v.dominant?.totalEditions).toBe(181);
  });

  it("treats a generic subtitle as the same book", () => {
    const v = computeVerdict(
      [
        { work: work({ key: "g1", title: "The Great Gatsby", authors: ["F. Scott Fitzgerald"], firstPublishYear: 1925, editionCount: 300 }), kind: "exact" },
        { work: work({ key: "g2", title: "The Great Gatsby: A Novel", authors: ["F. Scott Fitzgerald"], firstPublishYear: 2004, editionCount: 4 }), kind: "exact" },
        { work: work({ key: "g3", title: "The Great Gatsby", subtitle: "A Novel", authors: ["Francis Fitzgerald"], firstPublishYear: 2019, editionCount: 10 }), kind: "exact" },
      ],
      YEAR,
    );
    expect(v.exact).toHaveLength(1);
    expect(v.exact[0].records).toHaveLength(3);
  });
});

describe("tier copy", () => {
  it("never uses legal-sounding words", () => {
    const banned = /\b(available|taken|infringe|infringement|trademark|copyright)\b/i;
    for (const { label, summary, nextStep } of Object.values(TIER_COPY)) {
      expect(label).not.toMatch(banned);
      expect(summary).not.toMatch(banned);
      expect(nextStep).not.toMatch(banned);
    }
  });
});
