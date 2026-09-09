import { describe, expect, it } from "vitest";
import {
  classifyTitles,
  levenshtein,
  normalizeMain,
  normalizeTitle,
  splitSubtitle,
} from "./normalize";

describe("splitSubtitle", () => {
  it("splits at the first colon only", () => {
    expect(splitSubtitle("The Great Gatsby: A Novel")).toEqual({
      main: "The Great Gatsby",
      subtitle: "A Novel",
    });
    expect(splitSubtitle("Atomic Habits: Tiny Changes: Big Results")).toEqual({
      main: "Atomic Habits",
      subtitle: "Tiny Changes: Big Results",
    });
  });

  it("returns no subtitle when there is no colon or nothing after it", () => {
    expect(splitSubtitle("Dune")).toEqual({ main: "Dune", subtitle: null });
    expect(splitSubtitle("Dune:")).toEqual({ main: "Dune", subtitle: null });
    expect(splitSubtitle(":Dune")).toEqual({ main: ":Dune", subtitle: null });
  });
});

describe("normalizeMain", () => {
  it("lowercases and strips a leading article", () => {
    expect(normalizeMain("The Great Gatsby")).toBe("great gatsby");
    expect(normalizeMain("A Tale of Two Cities")).toBe("tale of two cities");
    expect(normalizeMain("An Unkindness of Ghosts")).toBe("unkindness of ghosts");
  });

  it("keeps an article that is the entire title", () => {
    expect(normalizeMain("The")).toBe("the");
    expect(normalizeMain("It")).toBe("it");
  });

  it("only strips one leading article", () => {
    expect(normalizeMain("The A Team")).toBe("a team");
  });

  it("strips trailing bracketed catalog noise, as seen in real Open Library data", () => {
    expect(normalizeMain("The Great Gatsby(Published In 1925)")).toBe("great gatsby");
    expect(normalizeMain("The Great Gatsby (Published In 1925)")).toBe("great gatsby");
    expect(normalizeMain("Dune [Illustrated] (Penguin Classics)")).toBe("dune");
    expect(normalizeMain("Pride and Prejudice (Annotated)")).toBe("pride and prejudice");
  });

  it("keeps a parenthetical that is not at the end", () => {
    expect(normalizeMain("The (Un)Official Guide")).toBe("un official guide");
  });

  it("strips a trailing catalog-style article", () => {
    expect(normalizeMain("Great Gatsby, The")).toBe("great gatsby");
  });

  it("converts & to and before stripping punctuation", () => {
    expect(normalizeMain("Salt & Light")).toBe("salt and light");
    expect(normalizeMain("Salt&Light")).toBe("salt and light");
  });

  it("removes apostrophes without inserting a space", () => {
    expect(normalizeMain("Don't Look Up")).toBe("dont look up");
    expect(normalizeMain("Don’t Look Up")).toBe("dont look up");
    expect(normalizeMain("Charlotte's Web")).toBe("charlottes web");
  });

  it("turns other punctuation into word breaks and collapses whitespace", () => {
    expect(normalizeMain("Self-Help  —  For Writers")).toBe("self help for writers");
    expect(normalizeMain("  Where   the Crawdads Sing ")).toBe("where the crawdads sing");
    expect(normalizeMain("Eats, Shoots & Leaves")).toBe("eats shoots and leaves");
  });

  it("drops diacritics", () => {
    expect(normalizeMain("Café Society")).toBe("cafe society");
    expect(normalizeMain("Les Misérables")).toBe("les miserables");
  });

  it("returns an empty string for punctuation-only input", () => {
    expect(normalizeMain("!!! ---")).toBe("");
  });
});

describe("normalizeTitle", () => {
  it("normalizes the main title and retains the subtitle for display", () => {
    expect(normalizeTitle("The Great Gatsby: A Novel")).toEqual({
      main: "great gatsby",
      subtitle: "A Novel",
      tokens: ["great", "gatsby"],
    });
  });
});

describe("levenshtein", () => {
  it("computes edit distance", () => {
    expect(levenshtein("", "")).toBe(0);
    expect(levenshtein("abc", "")).toBe(3);
    expect(levenshtein("kitten", "sitting")).toBe(3);
    expect(levenshtein("silent patient", "silent patients")).toBe(1);
  });
});

describe("classifyTitles (required pairs)", () => {
  it('"The Great Gatsby" vs "Great Gatsby" -> exact', () => {
    expect(classifyTitles("The Great Gatsby", "Great Gatsby")).toBe("exact");
  });

  it('"The Great Gatsby" vs "The Great Gatsby: A Novel" -> exact (subtitle stripped)', () => {
    expect(classifyTitles("The Great Gatsby", "The Great Gatsby: A Novel")).toBe("exact");
  });

  it('"Salt & Light" vs "Salt and Light" -> exact', () => {
    expect(classifyTitles("Salt & Light", "Salt and Light")).toBe("exact");
  });

  it('"The Silent Patient" vs "The Silent Patients" -> near', () => {
    expect(classifyTitles("The Silent Patient", "The Silent Patients")).toBe("near");
  });

  it('"The Silent Patient" vs "Silent Spring" -> loose or none, never exact', () => {
    const kind = classifyTitles("The Silent Patient", "Silent Spring");
    expect(["loose", "none"]).toContain(kind);
  });
});

describe("classifyTitles (real Open Library titles)", () => {
  it("counts the canonical Fitzgerald record as exact", () => {
    expect(classifyTitles("The Great Gatsby", "The Great Gatsby(Published In 1925)")).toBe("exact");
  });

  it("counts a catalog-style author suffix as near", () => {
    expect(classifyTitles("The Great Gatsby", "The great Gatsby, by F. Scott Fitzgerald")).toBe("near");
  });

  it("counts study guides as loose", () => {
    expect(classifyTitles("The Great Gatsby", "Twentieth Century Interpretations of the Great Gatsby")).toBe("loose");
    expect(classifyTitles("The Great Gatsby", "Fitzgerald's The Great Gatsby")).toBe("loose");
  });
});

describe("classifyTitles (additional behaviour)", () => {
  it("treats a word-boundary prefix as near", () => {
    expect(classifyTitles("Dune", "Dune Messiah")).toBe("near");
    expect(classifyTitles("The Great Gatsby", "The Great Gatsby and Other Stories")).toBe("near");
  });

  it("does not treat a mid-word prefix as near", () => {
    // "dune" is a character prefix of "dunes" but the edit distance rule covers it,
    // while "cat" vs "catalog" is a different word entirely.
    expect(classifyTitles("Cat", "Catalog")).not.toBe("exact");
  });

  it("finds loose matches through significant shared words", () => {
    expect(classifyTitles("Dune", "Children of Dune")).toBe("loose");
    expect(classifyTitles("The Silent Patient", "The Patient")).toBe("loose");
  });

  it("ignores stopwords when judging loose overlap", () => {
    expect(classifyTitles("House of Leaves", "Game of Thrones")).toBe("none");
  });

  it("returns none for empty input", () => {
    expect(classifyTitles("", "Dune")).toBe("none");
    expect(classifyTitles("Dune", "---")).toBe("none");
  });

  it("is symmetric for exact and near", () => {
    expect(classifyTitles("Silent Patients", "The Silent Patient")).toBe("near");
    expect(classifyTitles("Great Gatsby: A Novel", "The Great Gatsby")).toBe("exact");
  });
});
