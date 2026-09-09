import type { PageConfig } from "@/lib/pages";
import { Faq } from "./Faq";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { TitleChecker } from "./TitleChecker";

/**
 * The shared shell for every landing page. Only the copy varies.
 * Order matters: the tool is the first thing on the page, above the fold,
 * with the explanatory copy and FAQ underneath the results area.
 */
export function LandingPage({ page }: { page: PageConfig }) {
  return (
    <>
      <SiteHeader currentSlug={page.slug} />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 pt-8 sm:px-6 sm:pt-12">
        <h1 className="text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
          {page.h1}
        </h1>
        <p className="mt-3 max-w-prose text-lg leading-relaxed text-ink-muted">{page.lede}</p>

        <div className="mt-6">
          <TitleChecker examples={page.examples} />
        </div>

        {page.sections.map((section) => (
          <section key={section.heading} className="mt-12" aria-labelledby={slugify(section.heading)}>
            <h2 id={slugify(section.heading)} className="text-xl font-semibold text-ink">
              {section.heading}
            </h2>
            {section.paragraphs.map((p, i) => (
              <p key={i} className="mt-3 max-w-prose leading-relaxed text-ink-muted">
                {p}
              </p>
            ))}
          </section>
        ))}

        <Faq items={page.faq} />
      </main>
      <SiteFooter currentSlug={page.slug} />
    </>
  );
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
