import { describe, expect, it } from "vitest";
import type { WorkResult } from "./booksource/types";
import { isCatalogueNoise, partitionNoise } from "./noise";

function work(overrides: Partial<WorkResult> & { title: string }): WorkResult {
  return { key: `/works/${overrides.title}`, authors: [], editionCount: 1, ...overrides };
}

describe("isCatalogueNoise (real Open Library records)", () => {
  it("drops summaries, journals, box sets and 'Paperback -' duplicates", () => {
    const junk = [
      work({ title: "Summary of the Silent Patient by Alex Michaelides", authors: ["Speed Read Publishing"] }),
      work({ title: "Summary Review and Discussion of the Silent Patient by Alex Michaelides" }),
      work({ title: "Paperback - the Silent Patient", authors: ["Omen King"], coverId: 14641112 }),
      work({ title: "Silent Patient : the Second Season 2 : 6 X 9 Inches - 120 Pages", authors: ["Soft cover Water cover"] }),
      work({ title: "Best-Selling Series, 2 Books Collection Set. the Maidens, the Silent Patient by Alex Michaelides", authors: ["Alex Michaelides"] }),
      work({ title: "Best Journals : The Silent Patient : Alex Michaelides : Journal Your Thoughts In Real Time As You Read", authors: ["S Lewis"] }),
      work({ title: "The Great Gatsby", subtitle: "Notes", authors: ["Phillip Northman"], coverId: 6505941 }),
      work({ title: "The Great Gatsby", authors: ["SparkNotes"], coverId: 1 }),
      work({ title: "Fitzgerald's The Great Gatsby", authors: ["Cliffs Notes Staff"], coverId: 523009 }),
      work({ title: "The Great Gatsby Workbook", authors: ["Someone"], coverId: 2, editionCount: 5 }),
    ];
    for (const w of junk) expect(isCatalogueNoise(w), w.title).toBe(true);
  });

  it("keeps real books, including ones with soft words in the title", () => {
    const real = [
      work({ title: "The Silent Patient", authors: ["Alex Michaelides"], coverId: 9407338, editionCount: 26 }),
      work({ title: "The Great Gatsby(Published In 1925)", authors: ["F. Scott Fitzgerald"], coverId: 10590366, editionCount: 1180 }),
      work({ title: "Bridget Jones's Diary", authors: ["Helen Fielding"], coverId: 3, editionCount: 90 }),
      work({ title: "The Notebook", authors: ["Nicholas Sparks"], coverId: 4, editionCount: 60 }),
      work({ title: "Notes from Underground", authors: ["Fyodor Dostoevsky"], coverId: 5, editionCount: 200 }),
      work({ title: "The Diary of a Young Girl", authors: ["Anne Frank"], coverId: 6, editionCount: 300 }),
      work({ title: "The Silent Patient" }),
      work({ title: "Silent Patient", authors: ["Darlene Jamison"] }),
    ];
    for (const w of real) expect(isCatalogueNoise(w), w.title).toBe(false);
  });

  it("treats a soft word as noise only when the record is weak", () => {
    expect(isCatalogueNoise(work({ title: "The Silent Patient Journal" }))).toBe(true);
    expect(isCatalogueNoise(work({ title: "The Silent Patient Journal", coverId: 9, editionCount: 3 }))).toBe(false);
  });

  it("partitions a list", () => {
    const { candidates, noise } = partitionNoise([
      work({ title: "Dune", authors: ["Frank Herbert"], coverId: 1, editionCount: 161 }),
      work({ title: "Dune Trivia Quiz" }),
    ]);
    expect(candidates.map((w) => w.title)).toEqual(["Dune"]);
    expect(noise.map((w) => w.title)).toEqual(["Dune Trivia Quiz"]);
  });
});
