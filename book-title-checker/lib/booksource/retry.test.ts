import { afterEach, describe, expect, it, vi } from "vitest";
import { BookSourceUnavailableError } from "./types";
import { searchByTitle } from "./openlibrary";

const okBody = JSON.stringify({
  numFound: 1,
  docs: [{ key: "/works/OL1W", title: "Dune", author_name: ["Frank Herbert"], edition_count: 3 }],
});

function hung(): Promise<Response> {
  const err = new Error("The operation was aborted due to timeout");
  err.name = "TimeoutError";
  return Promise.reject(err);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("searchByTitle retries", () => {
  it("retries once after a hung connection and returns the second answer", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockImplementationOnce(hung)
      .mockResolvedValueOnce(new Response(okBody, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await searchByTitle("dune");
    expect(result.works).toHaveLength(1);
    expect(result.totalFound).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("gives up after three hung attempts with a source-unavailable error", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(hung);
    vi.stubGlobal("fetch", fetchMock);

    await expect(searchByTitle("dune")).rejects.toBeInstanceOf(BookSourceUnavailableError);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("retries a 503 but not a 404", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("busy", { status: 503 }))
      .mockResolvedValueOnce(new Response(okBody, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(searchByTitle("dune")).resolves.toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const notFound = vi.fn<typeof fetch>().mockResolvedValue(new Response("gone", { status: 404 }));
    vi.stubGlobal("fetch", notFound);
    await expect(searchByTitle("dune")).rejects.toBeInstanceOf(BookSourceUnavailableError);
    expect(notFound).toHaveBeenCalledTimes(1);
  });
});
