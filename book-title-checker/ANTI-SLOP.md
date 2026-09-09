# ANTI-SLOP.md

The rules that keep this site from looking or reading like it was generated.
`DESIGN.md` says what to do; this file says what never to do, why it fails,
and how to check for it mechanically before shipping. Every rule here was
either on the owner's own list, an Impeccable absolute ban, or something the
independent audit actually caught on this codebase.

The standard is not "would a designer like it." It is: could someone look
at this and say "AI made that" without doubt? If yes, it fails.

## The three tests

1. **The slop test.** Could anyone say "AI made that" at a glance? Fail.
2. **The category-reflex test, two altitudes.** If the theme and palette are
   guessable from the product category alone (revenue tool → money green,
   SaaS purple, tech blue), that is the first reflex. If they are guessable
   from category plus anti-references ("not SaaS purple → cream editorial",
   "not cream → dark terminal"), that is the second. Rework until neither is
   guessable. This site landed on petrol + brass for exactly that reason.
3. **The product test.** Would someone fluent in Linear, Figma, Stripe, or
   Raycast sit down and trust this, or pause at every subtly-off control?
   Familiar affordances are a feature in a tool. Strangeness without purpose
   is the failure.

## 1. Visual tells (hard bans)

| Tell | Why it reads as generated | Do instead |
|---|---|---|
| Gradients of any kind: backgrounds, text, "subtle" ones, chart fills fading to transparent | The 2023–2026 default skin | Flat fills. One committed solid-color surface if you need weight |
| Glass, `backdrop-blur`, translucent cards | Decoration that hides weak hierarchy | Solid surfaces, hairline borders |
| Dot grids, radial orbs, blur blobs, mesh or noise backgrounds | Texture reached for by reflex | Nothing. Type and data carry the page |
| Drop shadows on everything; glow shadows tinted with the brand color | "Depth" applied to things that do not float | Hairlines. One elevation level, only for things that actually float (menus, a drag bubble) |
| Soft big radii (12–16px+ on every container) | Reads as template-kit | 6px containers, 4px badges and pills |
| Colored side-stripe borders (`border-left` > 1px as an accent) | Never intentional | Full hairline, a background tint, or a leading glyph |
| The hero-metric template: big number, tiny label, supporting stats, gradient accent | SaaS dashboard cliché | Number as hero by scale, flat panel, and a context line saying what the number is for |
| Three identical feature cards in a row; icon + heading + text grids | The reflex layout for "how it works" | A sequence list with dividers, or prose. Numbered only if the steps are a real sequence |
| `01 / 02 / 03` numerals as section scaffolding | Landing-page grammar | Numbers only where order carries information |
| Tiny uppercase tracked "eyebrow" labels above every section or field | Appears on most generations regardless of brief | Sentence case, small, medium weight |
| Bento grids, terminal-window mockups, sparkle icons, animated arrows on links, cards that lift on hover, hover animation on everything | Motion and layout as decoration | Motion only when it conveys state (see §6) |
| Rainbow accents: four-hue category badges, six hard-coded accent hexes, Tailwind's stock palette renamed as "brand" | Color without a job | One primary and one signal color, derived (see §3) |
| Purple-and-black, neon, basic pastels, cream / sand / parchment page backgrounds | The four saturated lanes: SaaS, dark-neon, pastel, editorial-warm | Derive from the product scene; tint neutrals toward the brand hue, not toward warm-by-default |
| Checkmark bullets (✓ / ✕), emoji, glyph icons set as text (⚠) | Listicle grammar; also fail contrast | Plain dash bullets; inline SVG at 3:1 |
| Fake testimonials, three pricing tiers, "as seen on" logos, no real product demo | Fabricated proof | Real artifacts. When the product is a tool, the tool is the demo and the hero |
| Pure white page ground, or zero-chroma grays next to a colored brand | Lifeless; the brand and the chrome feel like different objects | Neutrals tinted 0.005–0.015 chroma toward the brand hue |
| Skeleton loaders where nothing loads asynchronously | Theater | Only for real loading. This site has none |
| Nested cards (a card inside a card) | Always wrong | Hairline dividers inside one surface |

## 2. Typography

- Banned families (current AI defaults): Inter, Geist, Space Grotesk, Plus
  Jakarta Sans, DM Sans, DM Serif Display, Manrope, Sora, Outfit.
- One family is usually right for a tool. A superfamily with a real mono cut
  is ideal: here, IBM Plex Sans for UI and prose, IBM Plex Mono for every
  number. Numbers always get `font-mono tabular-nums`.
- Headings top out at `font-semibold`. No `font-bold` / `extrabold` walls.
- No display serif on a tool. No display fonts in labels, buttons, or data.
- Product UI uses a fixed rem scale with a tight ratio (1.125–1.2), not
  fluid `clamp()` headings.
- Display heading ceiling 6rem; letter-spacing floor -0.04em.
- `text-wrap: balance` on h1–h3, `pretty` on article body. Prose ≤ ~70ch.
- Reading times are honest: ~200 words per minute, rounded, never inflated.

## 3. Color

- **Derive it, never select it.** Before picking anything, write one concrete
  sentence: who uses this, where, under what light, in what mood. Let that
  force the answer. This site's sentence: an indie developer at 1am between
  builds, on a laptop, working out whether ads could cover rent; they want an
  instrument they can trust, not a pitch deck.
- Never reach for OKLCH hue ~250 (blue) or ~60 (warm orange) by reflex. Those
  two are the AI default pair. Never money-green for finance, purple for SaaS,
  teal-and-coral, navy-and-gold.
- Pick a strategy first: Restrained (tinted neutrals + one accent ≤10%) is the
  product default. Committed (one saturated color owning 30–60% of one
  surface) is earned by exactly one surface here, the revenue readout.
- **Every color has one job.** Petrol = brand, action, current selection,
  focus. Brass = "best" or "recommended" (rank #1, the rewarded-video bar, the
  rate on the readout). Brass is never a button and never a text background
  except the notice tint. Chart fills mean something: brass = recommended,
  petrol tones = interruptive formats, gray = low value.
- No gray text on a colored background. Use a lighter or darker step of the
  background's own hue.
- **Compute contrast. Do not eyeball it.** Body text ≥ 4.5:1; large text
  (≥18px, or bold ≥14px) ≥ 3:1; placeholders 4.5:1; meaningful graphics such
  as chart bars ≥ 3:1 against what they sit on (the track, not the page).
  Check a fill against the track color, not white. Two fills failed exactly
  that way here and were darkened before shipping.

```bash
node -e '
function lum(h){h=h.replace("#","");const c=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4));return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2];}
function cr(a,b){const l1=lum(a),l2=lum(b);return ((Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05)).toFixed(2);}
console.log(cr("#5C6869","#F1F5F5"));  // text, background
'
```

## 4. Copy

- **No em dashes.** Not the character (U+2014), not `&mdash;`, not `--`.
  Rewrite with a period, comma, colon, or parentheses. En dashes in numeric
  ranges (`$2.50 – $28`, `2–4 minutes`, `2024–2025`) are correct and stay.
- No "it's not X, it's Y", "not X but Y", "X, not Y" as a rhetorical hinge.
  State the thing.
- No filler openers or closers: "Here's the thing", "Let's be honest", "In
  conclusion", "The takeaway", "The bottom line", "It's worth noting", "at the
  end of the day", "in today's fast-paced world".
- No reflexive rule-of-three adjective lists ("fast, simple, and powerful").
  Real lists of distinct items are fine.
- No marketing adjectives: enterprise-grade, powerful, seamless, cutting-edge,
  revolutionary, effortless, world-class, "no fluff". A free calculator that
  calls itself enterprise-grade reads as fake authority.
- No formula repeated across pages. Eight of eleven guide excerpts once ended
  "Here's how…"; every page ended with the identical CTA sentence. Each page
  gets its own wording.
- No emoji. No "→" appended to link labels. No hedging tics ("actually",
  "really") unless they carry meaning or match a real search phrase.
- No fake first-hand claims, no invented credentials, no earnings the site
  has not made. And never the owner's name or any identifying detail anywhere
  on the public site.

## 5. Structure and layout

- Cards are the lazy answer. Use one only when it is genuinely the best
  affordance. Never nest them.
- When the product is a tool, the tool is the first thing on the page. No
  marketing hero above a calculator.
- Vary spacing for rhythm; luxury is unused space, but a tool is allowed
  density where the user needs it.
- Responsive is structural: nothing overflows at 375px, wide tables scroll
  inside their own wrapper, selects never truncate their label at 1280px, the
  tab bar never clips on a phone.
- On phones the primary output (the number) comes before the controls.

## 6. Motion

- In product UI, motion conveys state and nothing else: state change,
  feedback, loading, reveal. 150–250ms. `ease-out-quart` or `ease-out-expo`.
  No bounce, no elastic.
- No page-load choreography. No scroll-fade-rise on every section. No
  odometer counters rolling up from zero (the revenue readout eases toward a
  new value on input; it never performs on load).
- Reveals enhance an already-visible default. Content visibility is never
  gated on a transition, or it ships blank in headless renderers.
- Every effect has a designed `prefers-reduced-motion: reduce` path. Here the
  global rule in `globals.css` collapses all transitions to instant, and
  `useTweened` snaps immediately when the media query matches.
- Allowed here, on purpose: the sliding tab underline, the slider value bubble
  while dragging or keyboard-driven, the thumb scaling 1.2× on press, chart
  bars easing to a new width.

## 7. Accessibility floor (WCAG AA, enforced)

These are the specific failures the audit found on the old build. Each one is
now a check.

- Every `<select>` and `<input>` has an accessible name: a `<label htmlFor>`
  or `aria-label`. A styled `<span>` above a control is not a label.
- One control per toggle. A checkbox button and a separate label button for
  the same thing is two tab stops and no association.
- The base `*:focus-visible` ring is the focus indicator. Never override it
  on a control with a paler `focus:ring-*`; a higher-specificity `.class:focus`
  rule silently replaces a 7:1 ring with a 1.4:1 one.
- Hit targets ≥ 24px. Sliders draw a 2px track inside a 24px input. Inline
  links in lists get vertical padding.
- Real ARIA patterns: tabs are `tablist` / `tab` / `tabpanel` with roving
  `tabindex` and arrow keys; a segmented picker is a `radiogroup`; never
  `aria-current="false"`.
- A skip-to-content link. Every page reachable from a phone (About was not).
- Muted text is still text: ≥ 4.5:1 on the surface it actually sits on.
- Never rely on color alone to carry meaning.

## 8. The mechanical check (run before every ship)

Every rule above that can be detected, is. Run this from the project root;
every count should be zero except where a review says otherwise.

```bash
# Copy
grep -rnP '\x{2014}|&mdash;' app components lib                # em dashes (U+2014)
grep -rniE "not (just|only) .*(but|it's)|isn't .* it's" app     # not-X-it's-Y (review hits)
grep -rniE "here's how|here's what|here's the thing|bottom line|no fluff|enterprise-grade|seamless" app lib
grep -rnP "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]" app components  # emoji
grep -rn '⚠\|✓\|✕' app components                              # glyph icons as text

# Visual
grep -rn 'gradient' app components tailwind.config.ts          # any gradient
grep -rn 'backdrop-blur' app components                        # glass
grep -rn 'uppercase' app components                            # eyebrows
grep -rn 'hover:-translate\|hover:scale\|group-hover:translate' app components
grep -rho 'rounded-2\?xl' app components | wc -l               # big radii
grep -rho 'shadow-[a-z-]*' app components | grep -v 'shadow-none\|shadow-float'
grep -rn 'border-l-[2-9]\|border-r-[2-9]' app components       # side stripes
grep -rn 'grid-cols-3' app components                          # three-across (review each)
grep -rn 'text-slate-\|text-gray-\|bg-slate-\|bg-gray-' app components   # raw palette bypassing tokens
grep -rn 'Inter\|Jakarta\|Geist\|Grotesk\|DM_' app/layout.tsx  # banned fonts

# Accessibility
grep -rn 'aria-current="false"' app components
grep -rn 'focus:ring-' app components app/globals.css          # focus overrides (review each)
```

Then `npm run build` (type-check and lint), then `/impeccable audit` for the
scored pass, then verify in a real browser at desktop and 375px: contrast
from computed styles, no horizontal scroll, smallest hit target, and the
slider extremes.

## 9. Allowed on purpose (so nobody over-corrects)

Stripping every tell lands on "clean but gray." These are deliberate and
documented, and they stay:

- One committed petrol panel for the revenue readout, and one for the
  in-article calculator CTA. Nowhere else.
- A real numbered sequence for "How the estimate is built" (it is a sequence).
- A grid of guide cards on the index (a content list, not a feature grid).
  The five `grid-cols-3` hits the checklist flags are all sanctioned: the
  guide grids on the home page and the index, the related-guides grid under
  each article, the three-option platform picker, and the three-stat strip
  on the readout.
- Hairline mono pills for category and reading time.
- Brass on rank #1, the rewarded bar, and the step numerals.
- The slider bubble, the sliding tab underline, the thumb press scale.

When in doubt: give the color a job, give the motion a state, give the number
a context line, and compute the contrast.
