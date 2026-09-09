/**
 * Outbound search links. These are plain links, not integrations: no API,
 * no key, no affiliate tag. They exist because Open Library holds few ebooks
 * that live only on Amazon, so the last step of any check is a look at the
 * retailers themselves.
 */
export interface RetailLink {
  label: string;
  href: string;
}

export function retailLinks(title: string): RetailLink[] {
  const quoted = encodeURIComponent(`"${title}"`);
  const plain = encodeURIComponent(title);
  return [
    { label: "Amazon", href: `https://www.amazon.com/s?k=${quoted}&i=stripbooks` },
    { label: "Goodreads", href: `https://www.goodreads.com/search?q=${plain}` },
    { label: "Google Books", href: `https://www.google.com/search?tbm=bks&q=${quoted}` },
  ];
}
