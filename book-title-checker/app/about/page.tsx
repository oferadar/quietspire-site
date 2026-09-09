import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { OWNER_LEGAL_NAME, OWNER_URL, SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "What the Book Title Checker does, where its data comes from, how the verdict is computed, and what it deliberately does not do.",
  alternates: { canonical: "/about" },
};

const linkClass = "underline decoration-rule underline-offset-4 hover:decoration-accent";

export default function AboutPage() {
  return (
    <>
      <SiteHeader currentSlug="/about" />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 pt-8 sm:px-6 sm:pt-12">
        <h1 className="text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
          About this site
        </h1>
        <p className="mt-3 max-w-prose text-lg leading-relaxed text-ink-muted">
          A free tool for authors deciding what to call a finished book. Type a title, see which
          published books already use it, and judge how hard it would be for readers to find yours.
        </p>

        <section className="mt-12" aria-labelledby="about-data">
          <h2 id="about-data" className="text-xl font-semibold text-ink">
            Where the data comes from
          </h2>
          <p className="mt-3 max-w-prose leading-relaxed text-ink-muted">
            Every search goes to{" "}
            <a href="https://openlibrary.org" rel="noopener noreferrer" className={linkClass}>
              Open Library
            </a>
            , the public catalogue of published books run by the Internet Archive. It covers most
            trade-published books and many self-published ones. It holds few ebooks that exist only
            on Amazon KDP, which is why every result links to the Amazon and Goodreads searches you
            should run before you commit.
          </p>
        </section>

        <section className="mt-10" aria-labelledby="about-verdict">
          <h2 id="about-verdict" className="text-xl font-semibold text-ink">
            How the verdict is computed
          </h2>
          <p className="mt-3 max-w-prose leading-relaxed text-ink-muted">
            Your title is normalized first: case, punctuation, a leading “The” and anything after a
            colon are ignored. Catalogue noise such as summaries, journals and box sets is set aside.
            Records for the same book by the same author are folded into one competitor. Each
            competitor is then weighed on two signals, how many editions it has and how recently it
            was published, and the title is called Clear, In use, or Crowded.
          </p>
        </section>

        <section className="mt-10" aria-labelledby="about-not">
          <h2 id="about-not" className="text-xl font-semibold text-ink">
            What it does not do
          </h2>
          <p className="mt-3 max-w-prose leading-relaxed text-ink-muted">
            It does not give legal advice; titles cannot be copyrighted and a single book’s title
            generally cannot be trademarked. It does not search Amazon or Goodreads directly, does not
            generate titles, and does not keep accounts. Nothing you type is tied to you. See the{" "}
            <Link href="/privacy" className={linkClass}>
              privacy page
            </Link>{" "}
            for the details.
          </p>
        </section>

        <section className="mt-10" aria-labelledby="about-who">
          <h2 id="about-who" className="text-xl font-semibold text-ink">
            Who runs it
          </h2>
          <p className="mt-3 max-w-prose leading-relaxed text-ink-muted">
            <a href={OWNER_URL} rel="noopener noreferrer" className={linkClass}>
              {OWNER_LEGAL_NAME}
            </a>
            , a small independent studio that makes apps, games and free single-purpose tools. The
            site is supported by a small amount of advertising and costs nothing to use. Found a
            wrong verdict, a bug, or a title the checker handled badly? Write to{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className={linkClass}>
              {SUPPORT_EMAIL}
            </a>
            . We read everything.
          </p>
        </section>
      </main>
      <SiteFooter currentSlug="/about" />
    </>
  );
}
