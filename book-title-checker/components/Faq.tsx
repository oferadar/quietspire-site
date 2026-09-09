import type { FaqItem } from "@/lib/pages";

/**
 * FAQ block rendered as native <details> (keyboard accessible, no JS) with
 * matching FAQPage structured data so search engines can show the questions.
 */
export function Faq({ items }: { items: FaqItem[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <section aria-labelledby="faq-heading" className="mt-14">
      <h2 id="faq-heading" className="text-xl font-semibold text-ink">
        Questions
      </h2>
      <div className="mt-4 divide-y divide-rule border-y border-rule">
        {items.map((item) => (
          <details key={item.q} className="group py-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-1 font-medium text-ink [&::-webkit-details-marker]:hidden">
              <span>{item.q}</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                width="16"
                height="16"
                className="shrink-0 transition-transform duration-200 ease-out group-open:rotate-180 motion-reduce:transition-none"
              >
                <path d="M3 6l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </summary>
            <p className="mt-2 max-w-prose leading-relaxed text-ink-muted">{item.a}</p>
          </details>
        ))}
      </div>
      <script
        type="application/ld+json"
        // JSON-LD must be raw JSON in a script tag. "<" is escaped so a
        // question could never close the tag early.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </section>
  );
}
