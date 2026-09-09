/**
 * The legal-accuracy note that must appear with every set of results.
 * Titles cannot be copyrighted; the only thing at stake is discoverability.
 */
export function DiscoverabilityNote({ compact = false }: { compact?: boolean }) {
  return (
    <p className={`max-w-prose text-ink-muted ${compact ? "text-sm" : "text-base"} leading-relaxed`}>
      <strong className="font-medium text-ink">Two books may share a title.</strong> Titles cannot
      be copyrighted, and a single book’s title generally cannot be trademarked. A shared title
      costs discoverability: a reader searching Amazon or Goodreads for this title would see the
      books below before, or instead of, yours.
    </p>
  );
}
