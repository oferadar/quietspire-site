import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TitleChecker } from "@/components/TitleChecker";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <>
      <SiteHeader currentSlug="" />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 pt-8 sm:px-6 sm:pt-12">
        <p className="font-mono text-sm text-ink-muted">404</p>
        <h1 className="mt-1 text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
          There is no page here
        </h1>
        <p className="mt-3 max-w-prose text-lg leading-relaxed text-ink-muted">
          The address may be mistyped, or the page has moved. The checker itself is right below, and
          the{" "}
          <Link href="/" className="underline decoration-rule underline-offset-4 hover:decoration-accent">
            front page
          </Link>{" "}
          has the rest.
        </p>
        <div className="mt-6">
          <TitleChecker examples={["The Silent Patient", "Salt and Light", "Educated"]} />
        </div>
      </main>
      <SiteFooter currentSlug="" />
    </>
  );
}
