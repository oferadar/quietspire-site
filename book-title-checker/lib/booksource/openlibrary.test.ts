import { describe, expect, it } from "vitest";
import { classifyMatch, normalizeTitle } from "../normalize";
import { partitionNoise } from "../noise";
import { computeVerdict } from "../verdict";
import gatsby from "./fixtures/great-gatsby.json";
import silentPatient from "./fixtures/silent-patient.json";
import { parseSearchResponse } from "./openlibrary";

const YEAR = 2026;

/** The full pipeline the route handler runs, on a captured Open Library response. */
function run(fixture: unknown, query: string) {
  const { works, totalFound } = parseSearchResponse(fixture);
  const { candidates, noise } = partitionNoise(works);
  const q = normalizeTitle(query);
  const classified = candidates.map((work) => ({ work, kind: classifyMatch(q, normalizeTitle(work.title)) }));
  return { works, totalFound, noise, verdict: computeVerdict(classified, YEAR, noise) };
}

describe("parseSearchResponse", () => {
  it("reads works, tolerates missing fields, and reports the total", () => {
    const { works, totalFound } = parseSearchResponse(gatsby);
    expect(works).toHaveLength(50);
    expect(totalFound).toBe(304);
    const canonical = works.find((w) => w.key === "/works/OL468431W");
    expect(canonical).toMatchObject({
      title: "The Great Gatsby(Published In 1925)",
      authors: ["F. Scott Fitzgerald"],
      firstPublishYear: 1920,
      editionCount: 1180,
      coverId: 10590366,
    });
    expect(works.some((w) => w.authors.length === 0)).toBe(true);
    expect(works.some((w) => w.coverId === undefined)).toBe(true);
  });

  it("rejects bodies that are not a search response", () => {
    expect(() => parseSearchResponse(null)).toThrow();
    expect(() => parseSearchResponse({ nope: [] })).toThrow();
  });
});

describe("real data: The Great Gatsby", () => {
  const r = run(gatsby, "The Great Gatsby");

  it("is crowded with Fitzgerald as the dominant competitor", () => {
    expect(r.verdict.tier).toBe("crowded");
    expect(r.verdict.dominant?.kind).toBe("exact");
    expect(r.verdict.dominant?.work.authors[0]).toMatch(/Fitzgerald/);
  });

  it("folds Fitzgerald's many records into one group with the canonical record on top", () => {
    const fitz = r.verdict.exact[0];
    expect(fitz.records.length).toBeGreaterThan(10);
    expect(fitz.work.key).toBe("/works/OL468431W");
    expect(fitz.totalEditions).toBeGreaterThan(1180);
    expect(r.verdict.exact.length).toBeLessThan(15);
  });

  it("sets study-guide records aside as noise", () => {
    const noiseAuthors = r.noise.flatMap((w) => w.authors).join(" | ");
    expect(noiseAuthors).toMatch(/SparkNotes/);
    expect(noiseAuthors).toMatch(/Cliffs Notes/);
  });
});

describe("real data: The Silent Patient", () => {
  const r = run(silentPatient, "The Silent Patient");

  it("is crowded with Michaelides as the dominant competitor", () => {
    expect(r.verdict.tier).toBe("crowded");
    expect(r.verdict.dominant?.work.authors[0]).toBe("Alex Michaelides");
    expect(r.verdict.dominant?.records.length).toBe(2);
  });

  it("removes the journals, summaries, box sets and 'Paperback -' records", () => {
    const titles = r.noise.map((w) => w.title);
    expect(titles).toEqual(
      expect.arrayContaining([
        "Paperback - the Silent Patient",
        "Summary of the Silent Patient by Alex Michaelides",
        "Silent Patient : the Second Season 2 : 6 X 9 Inches - 120 Pages",
      ]),
    );
    expect(r.noise.length).toBeGreaterThanOrEqual(7);
    for (const g of r.verdict.exact) expect(g.work.title).not.toMatch(/6 X 9|Paperback -|Summary/);
  });
});

describe("real data: nonsense", () => {
  it("is clear with nothing to show", () => {
    const r = run({ numFound: 0, docs: [] }, "xqzvbnm plork zzt");
    expect(r.verdict.tier).toBe("clear");
    expect(r.works).toHaveLength(0);
    expect(r.totalFound).toBe(0);
  });
});

describe("publish_year parsing", () => {
  it("keeps the most recent plausible year and ignores junk", () => {
    const r = parseSearchResponse({
      numFound: 1,
      docs: [
        { key: "/works/OL1W", title: "Dune", first_publish_year: 1965, publish_year: [1965, 1990, 2024, 9999, "x", 12] },
        { key: "/works/OL2W", title: "Old", first_publish_year: 1911 },
      ],
    });
    expect(r.works[0].lastPublishYear).toBe(2024);
    expect(r.works[1].lastPublishYear).toBeUndefined();
  });
});
