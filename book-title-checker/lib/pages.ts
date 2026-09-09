/**
 * One engine, several landing pages. Each entry here becomes a page with its
 * own title tag, description, H1, explanatory copy and FAQ. The FAQ questions
 * are deliberately different on every page: duplicated FAQ content across
 * pages is both bad for readers and bad for search.
 *
 * Wording rule for the whole site: never "available", "taken" or
 * "infringement" in anything that reads as a verdict. Those words imply a
 * legal claim on titles that does not exist. Page headings may quote the
 * phrase a searcher typed ("Is my book title taken?") and then reframe it.
 */

export interface FaqItem {
  q: string;
  a: string;
}

export interface PageSection {
  heading: string;
  paragraphs: string[];
}

export interface PageConfig {
  /** Route path, "/" for the primary page. */
  slug: string;
  /** Descriptive label for the footer's cross-links. */
  navLabel: string;
  /** Two-or-three-word label for the header nav. */
  navShort: string;
  /** <title> tag. */
  title: string;
  /** Meta description, ideally under 160 characters. */
  description: string;
  h1: string;
  lede: string;
  /** Titles offered as one-click examples in the empty state. */
  examples: string[];
  sections: PageSection[];
  faq: FaqItem[];
}

export const PAGES: PageConfig[] = [
  {
    slug: "/",
    navLabel: "Book Title Checker",
    navShort: "Title checker",
    title: "Book Title Checker: See If a Book Title Is Already in Use",
    description:
      "Free book title checker. See which published books already use a title, how many editions they have, and whether it is clear, in use, or crowded.",
    h1: "Book Title Checker",
    lede:
      "Type a title. See which published books already use it, and how hard it would be for readers to find yours.",
    examples: ["The Silent Patient", "Salt and Light", "Educated"],
    sections: [
      {
        heading: "What this checks",
        paragraphs: [
          "The checker searches Open Library, the public catalogue of published books run by the Internet Archive. It first normalizes your title: case, punctuation, a leading “The”, and anything after a colon are ignored, so “The Great Gatsby: A Novel” and “great gatsby” count as the same title.",
          "Every book with a matching title is then weighed by two things: how many editions it has, and how recently it was first published. A title carried by a book with three hundred editions is far more crowded than one carried by a single edition from 1911.",
        ],
      },
      {
        heading: "Why it matters",
        paragraphs: [
          "Titles cannot be copyrighted, so nothing stops two books from sharing one. A shared title costs you attention. When a reader searches Amazon or Goodreads for your title, every other book with that title competes with yours, and the one with more editions, reviews and years on the shelf usually appears first.",
        ],
      },
      {
        heading: "How to read the verdict",
        paragraphs: [
          "Clear means no book with this exact title turned up, or only old and obscure ones. In use means other books share the title but none dominates. Crowded means at least one well-known book already uses it, so readers searching for the title would mostly find that book first.",
        ],
      },
    ],
    faq: [
      {
        q: "Where does the data come from?",
        a: "From Open Library, a free catalogue of published books maintained by the Internet Archive. It covers most trade-published books and a large share of self-published ones, and it is updated continuously by librarians and volunteers.",
      },
      {
        q: "Does it search Amazon or Goodreads?",
        a: "No. Neither offers a free public search API, and this tool has no paid services behind it. Treat the result as a strong first pass, then search your title on Amazon and Goodreads by hand before you commit.",
      },
      {
        q: "Why does it ignore “The” and the subtitle?",
        a: "Because readers do. “The Silent Patient” and “Silent Patient” are the same title to anyone typing into a search box, and a subtitle rarely changes which book someone thinks they are looking at. Matching on the main title finds the collisions that matter.",
      },
      {
        q: "What counts as an exact match?",
        a: "Two titles are exact when they are identical after normalization: lowercased, punctuation removed, “&” read as “and”, a leading article dropped, and any subtitle after a colon set aside. Near matches differ by a letter or two, or one title starts with the other. Loose matches merely share most of their words.",
      },
      {
        q: "Does a crowded title mean I cannot use it?",
        a: "No. There is no legal bar to reusing a book title. Crowded means that readers who search for the title will mostly find the other book, so you would be relying on your name, your cover, categories and advertising to be found instead.",
      },
      {
        q: "Is the checker free? Do I need an account?",
        a: "It is free and there are no accounts. The site is supported by a small amount of advertising. Nothing you type is stored beyond a short-lived cache that makes the same search faster for the next person.",
      },
    ],
  },
  {
    slug: "/book-title-availability",
    navLabel: "Book title availability",
    navShort: "Availability",
    title: "Book Title Availability Check: Is Your Title Clear or Crowded?",
    description:
      "Check book title availability the way that matters. Titles are never owned. They can be crowded, and this shows which published books already compete for yours.",
    h1: "Book Title Availability",
    lede:
      "Titles are never owned, so “availability” means something different for books: how much competition a title already has.",
    examples: ["The Guest", "Atomic Habits", "Sanctuary"],
    sections: [
      {
        heading: "What “available” means for a book title",
        paragraphs: [
          "A domain name is either registered or it is not. A book title has no registry and no owner. Copyright does not protect titles, names or short phrases, and trademark law generally does not cover the title of a single book. Two, ten, or fifty books can share one title and all be published lawfully.",
          "So the useful question is how much you would share it. This page answers that: it looks up every published book with the same title and weighs how much room each one leaves you in a search result.",
        ],
      },
      {
        heading: "The three signals we weigh",
        paragraphs: [
          "Exact matches: how many published works carry the same normalized title. Edition count: a work with hundreds of editions has been reprinted, translated and assigned for decades, and will outrank a new release for years. Recency: a title first used in 1890 is functionally free, while one first used in 2023 belongs to a book still being actively sold.",
        ],
      },
      {
        heading: "Making a title more yours",
        paragraphs: [
          "If a title you love is in use, you do not have to give it up. Adding one distinctive word often clears the field entirely. A specific subtitle helps readers confirm they have the right book. And a title that pairs unmistakably with your author name is easier to find than a common phrase on its own.",
        ],
      },
    ],
    faq: [
      {
        q: "Can I reserve or register a book title?",
        a: "There is nothing to register. The copyright office does not register titles, and a single book title is generally not eligible for trademark. Series names are sometimes treated differently, which is a question for a trademark attorney rather than a title checker.",
      },
      {
        q: "What if the only match is from 1910?",
        a: "Then the title is effectively free for you. A century-old book with a handful of editions barely appears in modern search results. The checker calls that Clear, and shows you the old match underneath so you can judge for yourself.",
      },
      {
        q: "Should I check before or after writing the book?",
        a: "Both. Checking early saves you from growing attached to a title that a bestseller already owns in readers’ minds. Checking again just before publishing catches anything new, since thousands of books are released every week.",
      },
      {
        q: "Does the subtitle affect the result?",
        a: "Matching uses only the part before the colon, because that is what readers type. Your subtitle still matters: it is the cheapest way to tell your book apart from another with the same main title.",
      },
      {
        q: "How current is the data?",
        a: "Open Library is edited continuously. Each title you check is looked up live and then remembered for one day, so a title checked twice in the same day returns the same answer instantly.",
      },
    ],
  },
  {
    slug: "/novel-title-checker",
    navLabel: "Novel title checker",
    navShort: "Novels",
    title: "Novel Title Checker: Find Out Which Novels Share Your Title",
    description:
      "Check a novel title against published fiction. See which novels already use it, who wrote them, how many editions exist, and whether readers would find yours.",
    h1: "Novel Title Checker",
    lede:
      "Fiction titles get reused more than any other kind. See which novels already carry yours before you commit to it.",
    examples: ["The Guest List", "Verity", "The Light We Lost"],
    sections: [
      {
        heading: "Why novel titles collide",
        paragraphs: [
          "Novels favour short, evocative phrases, and there are only so many of those. “The Guest”, “The Wife”, “Sanctuary” and “The Ledger” have each been used by several unrelated novels. Genre conventions make it worse: thrillers gravitate to “The” plus one ominous noun, and romance to the same handful of puns.",
          "This checker searches the whole catalogue, fiction and non-fiction alike, because a reader’s search box does not know the difference. If a memoir shares your novel’s title, it still sits beside yours in the results.",
        ],
      },
      {
        heading: "Classics and bestsellers",
        paragraphs: [
          "A title used by a classic is crowded even when the classic is a hundred years old. Hundreds of editions, school reading lists and film adaptations keep it at the top of every search. A recent bestseller in your own genre is crowded for a different reason: its readers are exactly the readers you want, and they will find it first.",
        ],
      },
      {
        heading: "Series and sequels",
        paragraphs: [
          "The checker looks at individual works. If you are naming a series, the series name is the one place where trademark can come into play, because a series name functions more like a brand than a title. That is a question for a trademark attorney; the individual book titles inside the series are checked here like any other.",
        ],
      },
    ],
    faq: [
      {
        q: "Can two novels have the same title?",
        a: "Yes, and they often do. There is no legal restriction on reusing a title for a work of fiction. The cost is purely practical: readers searching for one will see the other.",
      },
      {
        q: "My title matches a classic. Is that a problem?",
        a: "For discoverability, usually yes. A classic with hundreds of editions will sit above your book in search results indefinitely, and some readers will assume your listing is a mistake. Unless your book is deliberately in conversation with the classic, a different title will serve you better.",
      },
      {
        q: "Should a novel have a subtitle?",
        a: "Most novels use “A Novel” or nothing at all. The checker ignores subtitles when matching, so a subtitle will not change your verdict, but on retail sites a short descriptive subtitle can help readers tell your book from another with the same main title.",
      },
      {
        q: "Does the checker understand series names?",
        a: "No. It treats each work individually and does not know that “Dune Messiah” belongs to a series called Dune. Check the series name separately, and remember that series names are the one case where trademark questions can arise.",
      },
      {
        q: "Can I change a novel’s title after publishing?",
        a: "For ebooks, most platforms including KDP let you edit the title later. For paperbacks and hardcovers the title is tied to the ISBN, so changing it usually means publishing a new edition. Check the current help pages of your platform, since the rules change.",
      },
    ],
  },
  {
    slug: "/kdp-book-title-checker",
    navLabel: "KDP book title checker",
    navShort: "KDP",
    title: "KDP Book Title Checker: Check a Title Before You Publish on Amazon",
    description:
      "Check your KDP book title before you upload. See which books already use it, how crowded Amazon search would be, and how to use the subtitle field to stand out.",
    h1: "KDP Book Title Checker",
    lede:
      "KDP will not warn you when a hundred other books share your title. This page will, before you upload and while changing it is still free.",
    examples: ["Atomic Habits", "The Silent Patient", "Deep Work"],
    sections: [
      {
        heading: "What KDP does and does not check",
        paragraphs: [
          "When you enter a title in KDP, Amazon checks it against its metadata guidelines: no keyword stuffing, no claims like “bestseller”, no other authors’ names or brands, and the title must match what is on the cover. It does not check whether other books already use the same title, because that is allowed.",
          "This tool fills that gap. It looks up your title in Open Library, which covers most of what is also on Amazon, and tells you how much company you would have.",
        ],
      },
      {
        heading: "How Amazon search treats duplicate titles",
        paragraphs: [
          "Amazon ranks search results by relevance and sales history. Two books with the same title are equally relevant, so the one with more sales, reviews and time on the site wins the top spot. A new release sharing a title with an established book will usually appear below it, sometimes far below it.",
        ],
      },
      {
        heading: "Using the title and subtitle fields well",
        paragraphs: [
          "KDP gives you a title field, a subtitle field and a series field. Keep the title clean and match it to the cover. Put your differentiation in the subtitle, where a few plain words about the book help readers confirm they have the right one. Put keywords in the seven keyword slots and keep them out of the title, because keyword-stuffed titles are a common reason for KDP to reject a submission.",
        ],
      },
    ],
    faq: [
      {
        q: "Does KDP reject duplicate titles?",
        a: "No. KDP allows any number of books to share a title. It rejects titles that break its metadata rules, such as stuffing keywords, adding promotional claims, or using another author’s name or a brand without permission.",
      },
      {
        q: "Does this tool check Amazon’s catalogue directly?",
        a: "No. Amazon does not offer a free public search API. The tool uses Open Library, which includes the large majority of books that are also sold on Amazon. As a final step, search your title on Amazon yourself.",
      },
      {
        q: "Can I change my KDP title later?",
        a: "For a Kindle ebook, yes: title and subtitle can be edited after publishing. For a KDP paperback or hardcover the title is locked to the ISBN once the book is live, so a change means setting it up as a new book. Confirm the current rules in KDP Help before relying on this.",
      },
      {
        q: "Should I put keywords in my title to rank higher?",
        a: "No. KDP’s guidelines prohibit keywords that are not part of the actual title, and books have been blocked for it. Use the keyword slots and categories instead, and let the title be a title.",
      },
      {
        q: "What about my series name?",
        a: "Enter it in KDP’s series field and leave it out of the title. This checker does not evaluate series names, and a series name is the one place where a trademark question can arise, so check it separately.",
      },
      {
        q: "Does a crowded title hurt my sales?",
        a: "It hurts one route to your book: readers searching by title. Readers who arrive through your author name, categories, also-boughts or advertising are unaffected. If title search matters to your plan, choose a clearer title.",
      },
    ],
  },
  {
    slug: "/is-my-book-title-taken",
    navLabel: "Is my book title taken?",
    navShort: "Is it taken?",
    title: "Is My Book Title Taken? Check Which Books Already Use It",
    description:
      "No one owns a book title. Titles do get crowded. Check which published books already use yours and how much they would compete with it in search.",
    h1: "Is My Book Title Taken?",
    lede:
      "No one owns a book title, so no title is ever taken. Titles do get crowded, and this page shows how crowded yours is.",
    examples: ["Educated", "Becoming", "The Road"],
    sections: [
      {
        heading: "Why no title is ever taken",
        paragraphs: [
          "Copyright protects the text of a book. Names, titles and short phrases are specifically excluded from it. Trademark protects brands, and a single book’s title is generally not treated as a brand. The result is that the title of a published book gives its author no right to stop you from using it. None of this is legal advice. This much, though, is settled.",
        ],
      },
      {
        heading: "What “taken” means in practice",
        paragraphs: [
          "What another book can take is the search result. When a reader types your title into Amazon, Goodreads or Google, the existing book, with its reviews and its years of sales, will usually appear first. The more editions it has and the more recently it came out, the more of the page it takes. That is what this checker measures.",
        ],
      },
      {
        heading: "When to think twice",
        paragraphs: [
          "Three cases deserve a second thought. A famous title, because readers will assume your listing is an error. A recent bestseller in your own genre, because you would be competing for the very same readers. And a title that is also a company or product name, because that raises a trademark question that a title checker cannot answer.",
        ],
      },
    ],
    faq: [
      {
        q: "Is it illegal to use the same title as another book?",
        a: "Generally no. Titles are not protected by copyright, and single-work titles are generally not protected by trademark. This is not legal advice, and the rare exception involves a title that has become a brand, but an ordinary title shared with an ordinary book is lawful.",
      },
      {
        q: "What if a bestseller already has my title?",
        a: "You may still use it, but readers searching for the title will find the bestseller first, and some will buy it thinking it is yours. For a debut, that is usually a reason to choose something else or add a distinguishing word.",
      },
      {
        q: "Can I trademark my book title?",
        a: "For a single book, generally not. Trademark offices treat one title as the name of a work rather than a brand. A series name used across several books can sometimes be registered. Talk to a trademark attorney if that applies to you.",
      },
      {
        q: "What happens to the title I type here?",
        a: "It is looked up in Open Library and the answer is cached for one day so the next person checking the same title gets a faster response. There are no accounts and nothing is tied to you.",
      },
      {
        q: "How do I double-check on Amazon and Goodreads?",
        a: "Search the exact title in quotation marks on each site, then look at the first page of results: how many books share the title, how recent they are, and how many reviews they have. That page is what your future readers will see.",
      },
    ],
  },
];

export function getPage(slug: string): PageConfig {
  const page = PAGES.find((p) => p.slug === slug);
  if (!page) throw new Error(`Unknown page slug: ${slug}`);
  return page;
}
