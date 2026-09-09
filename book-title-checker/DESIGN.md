# DESIGN.md

What this site looks like and why. `ANTI-SLOP.md` is the list of things it
must never do; this file records the choices that were made on purpose so
nobody strips them in an over-correction.

## The sentence the design was derived from

A self-publishing author, alone at a desk late in the evening with a finished
manuscript, checking a title with equal parts hope and dread, wanting a
straight answer from something that behaves like a reference librarian and
nothing like a pitch.

That rules out cream paper and display serifs (the "bookish" first reflex),
and it rules out SaaS blue and glass cards (the "tool" second reflex). What
is left is a quiet instrument: tinted neutrals, one working typeface with a
real mono cut for the numbers, and a verdict that reads like a stamp on a
catalogue card.

## Color

Restrained strategy: tinted neutrals, one accent under 10% of any surface,
one signal color. Neutrals are tinted toward the accent hue rather than warm
or pure gray. All ratios were computed, not eyeballed (`app/globals.css`
carries the numbers next to each token).

| Token | Light | Dark | Job |
|---|---|---|---|
| paper | `#f2f4f3` | `#0f1512` | page ground |
| card | `#fafbfa` | `#161d19` | the verdict surface and controls |
| ink | `#16201c` | `#e6ebe8` | text |
| ink-muted | `#4b5751` | `#a3aea8` | secondary text, ≥ 6.8:1 on both surfaces |
| ink-faint | `#5d6963` | `#a3aea8` | placeholders, ≥ 5.5:1 on card |
| rule | `#cbd2ce` | `#2a3430` | decorative hairlines only |
| border | `#717d77` | `#5f6b65` | control borders, ≥ 3:1 |
| accent | `#1e5b47` | `#86cdb1` | brand, the one action button, links, focus ring |
| signal | `#9b2431` | `#ff929b` | the Crowded stamp and the unavailable state, nothing else |

Clear and In use are set in ink. Only Crowded gets the signal color, because
that is the one verdict that should make an author pause. No tinted
backgrounds, no traffic lights.

## Type

IBM Plex Sans (400 / 500 / 600) for everything you read, IBM Plex Mono (400 /
500) for every number, with `tabular-nums` set globally on `.font-mono`.
Headings top out at semibold. H1 is 1.875rem on phones and 2.25rem from the
`sm` breakpoint; the rest of the scale is Tailwind's fixed rem steps.
`text-wrap: balance` on h1–h3, `pretty` on paragraphs, prose capped at
`max-w-prose`.

## Surfaces

One card: the verdict. Everything else is hairline dividers on the page
ground. Radii are 6px on containers and 4px on the stamp and cover thumbnails.
No shadows anywhere; the stamp's double rule is a border plus an offset
outline.

## Motion

Three effects, each tied to a state, each 150–220ms on ease-out-quart:

- the results block rises 4px as it arrives
- the verdict stamp settles from 1.04× as it lands
- the loading blocks pulse while a real network request is in flight

`prefers-reduced-motion: reduce` swaps the first two for a 150ms crossfade
and freezes the pulse. Nothing is hidden until an animation runs.

## Allowed on purpose

These trip the mechanical checks in `ANTI-SLOP.md` and stay:

- `uppercase` on `.stamp` only. A rubber stamp is set in capitals; this is
  the single designed motif of the site and it is 14px medium mono, never an
  eyebrow above a section.
- `sm:grid-cols-3` on the verdict's three-figure strip (exact matches, near
  matches, records checked) and on the loading skeleton that mirrors it. It is
  data with a context label, and it is the only grid on the site.
- A second stamp size (12px) in the shortlist comparison, where five verdicts
  sit in one column and need to be read at a glance.
- The one em dash the copy grep finds is a test fixture in
  `lib/normalize.test.ts` proving em dashes get stripped from titles.
- A skeleton while `/api/check` is in flight. Open Library takes 2–5 seconds;
  the wait is real.
- `outline` on `.stamp` for its second rule. The focus ring is the base
  `:focus-visible` rule and nothing overrides it.
