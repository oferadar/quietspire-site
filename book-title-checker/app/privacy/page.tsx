import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { OWNER_LEGAL_NAME, SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What the Book Title Checker stores, what it sends to Open Library, and what it does not collect.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader currentSlug="/privacy" />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 pt-8 sm:px-6 sm:pt-12">
        <h1 className="text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
          Privacy
        </h1>
        <p className="mt-3 max-w-prose text-lg leading-relaxed text-ink-muted">
          This site is run by {OWNER_LEGAL_NAME} and collects as little as a website can. Last
          updated September 2026.
        </p>

        <section className="mt-12" aria-labelledby="p-type">
          <h2 id="p-type" className="text-xl font-semibold text-ink">
            What happens to the titles you type
          </h2>
          <p className="mt-3 max-w-prose leading-relaxed text-ink-muted">
            A title is normalized in your browser, sent to this site’s server, and looked up in Open
            Library. The answer for that normalized title is cached on the server for one day so the
            next person who checks it gets an instant response. The cache holds the title and the
            catalogue answer only. It holds nothing about who asked.
          </p>
          <p className="mt-3 max-w-prose leading-relaxed text-ink-muted">
            Your browser keeps a short list of your recent checks in its own local storage so you
            can return to them. That list never leaves your device, and the “Forget” control next to
            it deletes it.
          </p>
        </section>

        <section className="mt-10" aria-labelledby="p-no">
          <h2 id="p-no" className="text-xl font-semibold text-ink">
            What is not collected
          </h2>
          <p className="mt-3 max-w-prose leading-relaxed text-ink-muted">
            There are no accounts, no sign-ups, no email capture, no analytics scripts and no cookies
            set by this site. The site does not use any AI service and never sends what you type to
            one.
          </p>
        </section>

        <section className="mt-10" aria-labelledby="p-third">
          <h2 id="p-third" className="text-xl font-semibold text-ink">
            Third parties
          </h2>
          <p className="mt-3 max-w-prose leading-relaxed text-ink-muted">
            Open Library receives the normalized title as a search query, from this site’s server
            rather than from your browser. Book covers load directly from Open Library’s cover
            service, which sees your browser’s request the way any image host does. Links to Amazon,
            Goodreads and Google Books open those sites, which have their own privacy policies. The
            hosting provider keeps ordinary server logs for a short period.
          </p>
          <p className="mt-3 max-w-prose leading-relaxed text-ink-muted">
            If advertising is shown on this site, the ad network may set cookies or similar
            identifiers under its own policy. This page will name the network and link to its policy
            when that happens.
          </p>
        </section>

        <section className="mt-10" aria-labelledby="p-contact">
          <h2 id="p-contact" className="text-xl font-semibold text-ink">
            Contact
          </h2>
          <p className="mt-3 max-w-prose leading-relaxed text-ink-muted">
            Questions about this policy, or a request to have something removed, go to{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="underline decoration-rule underline-offset-4 hover:decoration-accent"
            >
              {SUPPORT_EMAIL}
            </a>
            . Since nothing is stored about you, there is usually nothing to remove, but ask anyway.
          </p>
        </section>
      </main>
      <SiteFooter currentSlug="/privacy" />
    </>
  );
}
