import Link from "next/link";
import { PAGES } from "@/lib/pages";
import { OWNER_NAME, OWNER_URL, SUPPORT_EMAIL } from "@/lib/site";

export function SiteFooter({ currentSlug }: { currentSlug: string }) {
  const others = PAGES.filter((p) => p.slug !== currentSlug);
  const linkClass = "inline-block py-1 underline decoration-rule underline-offset-4 hover:decoration-accent";
  return (
    <footer className="mt-16 border-t border-rule">
      <div className="mx-auto max-w-3xl px-4 py-8 text-sm text-ink-muted sm:px-6">
        <p className="font-medium text-ink">Other ways to check a title</p>
        <ul className="mt-1 flex flex-wrap gap-x-5">
          {others.map((p) => (
            <li key={p.slug}>
              <Link href={p.slug} className={linkClass}>
                {p.navLabel}
              </Link>
            </li>
          ))}
        </ul>
        <ul className="mt-4 flex flex-wrap gap-x-5">
          <li>
            <Link href="/about" className={linkClass}>
              About this site
            </Link>
          </li>
          <li>
            <Link href="/privacy" className={linkClass}>
              Privacy
            </Link>
          </li>
        </ul>
        <p className="mt-6 max-w-prose leading-relaxed">
          Book data comes from{" "}
          <a href="https://openlibrary.org" rel="noopener noreferrer" className={linkClass}>
            Open Library
          </a>
          , a project of the Internet Archive. This site gives general information about how titles
          behave in search results. It is not legal advice.
        </p>
        <p className="mt-4 max-w-prose leading-relaxed">
          Made by{" "}
          <a href={OWNER_URL} rel="noopener noreferrer" className={linkClass}>
            {OWNER_NAME}
          </a>
          . Questions and bug reports:{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className={linkClass}>
            {SUPPORT_EMAIL}
          </a>
        </p>
      </div>
    </footer>
  );
}
