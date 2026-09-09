import Link from "next/link";
import { PAGES } from "@/lib/pages";
import { SITE_NAME } from "@/lib/site";

/**
 * Skip link, site name, and a nav to every page. The five pages share one
 * engine but carry different guidance (KDP rules, fiction, the legal
 * reframing), so they are visible at the top of every page.
 *
 * On phones the nav wraps to a second line. Nothing scrolls or clips.
 */
export function SiteHeader({ currentSlug }: { currentSlug: string }) {
  return (
    <header className="border-b border-rule">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-ink"
      >
        Skip to content
      </a>
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-x-6 px-4 pt-3 sm:px-6">
        <p className="py-1 font-medium text-ink">{SITE_NAME}</p>
        <p className="py-1 text-sm text-ink-muted">Data from Open Library</p>
        <nav aria-label="Pages" className="basis-full">
          <ul className="flex flex-wrap gap-x-5 text-sm">
            {PAGES.map((page) => {
              const current = page.slug === currentSlug;
              return (
                <li key={page.slug}>
                  <Link
                    href={page.slug}
                    aria-current={current ? "page" : undefined}
                    className={`inline-block border-b-2 py-2 ${
                      current
                        ? "border-accent font-medium text-ink"
                        : "border-transparent text-ink-muted hover:text-ink"
                    }`}
                  >
                    {page.navShort}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
