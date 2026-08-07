# Design-fidelity tooling

Two scripts keep the build honest against Figma **without an LLM in the verify
loop** — the model identifies a fix once; these catch regressions cheaply
thereafter.

## 1. Structure snapshot — `scripts/figma-snapshot.json`

A committed, compact record of each screen's geometry (frame-relative boxes,
fills, text specs), with **component instances recorded as placements** rather
than expanded — a screen is an arrangement of components.

```bash
npm run figma:check     # assert every tracked screen's node-id still resolves
```

**The change report is `git diff`.** After you edit the mockups:

1. Open `scripts/figma-snapshot.fig.js`, adjust the `SCREENS` list if needed.
2. Paste its body into a `use_figma` MCP call on the Polari file; it ends with
   `throw new Error('DATA:' + json)` (read-only; the JSON rides out on the
   error). Transport caps the message at ~20 kB — if a batch is too big, split
   `SCREENS` and run twice.
3. Overwrite `scripts/figma-snapshot.json`, prettify
   (`node -e "…JSON.stringify(j,null,2)"`), commit.

`git diff scripts/figma-snapshot.json` then shows exactly which node moved,
resized or recoloured. No live re-dump needed to _see_ the change, and any
model reads the local file (cheap, greppable) instead of re-fetching from Figma.

A screen whose id went stale after a redesign is recorded as `missing` and
fails `figma:check` — otherwise it silently stops being tracked.

## 2. Pixel diff — `scripts/pixel-diff.mjs`

Renders a route in the machine's Chrome (headless, no npm deps), compares it to
a Figma export PNG, and prints a **numeric heatmap** + writes a diff PNG.

```bash
# export the frame at scale 1 via the design MCP → design/exports/<screen>.png
npm run figma:diff -- \
  --route='/quiz/results?mode=ten&score=7' \
  --figma=design/exports/results-normal.png \
  --out=design/diffs/results-normal --width=399 --height=859 --tol=48
```

The heatmap (`·` <1%, `1–9` = ×10%, `#` ≥90%, top-left origin) localises drift
to a grid cell, so a cheap model reads a table, not an image.

**Know its edges:**

- Best on flat-colour / layout screens (Today, Dictionary, the quiz question).
- Noisy on **full-bleed gradient or photo backgrounds** (results, landing): a
  small global colour difference in the raster swamps the layout signal. Raise
  `--tol`, or just trust the structure snapshot there.
- The app's tab bar floats at the viewport bottom while Figma's sits at y757, so
  the bottom band always reads as changed — expected, not drift.
- Entrance animations / auto-advancing screens may not settle under virtual
  time; screenshot a steady state or raise `--wait`.

## What is _not_ here, and why

A variable-font → static-instance cutter is **not needed**: the static Digitale
cuts the app actually renders (Regular/Semibold/Bold/Extrabold plus the
Regular/Semibold/Bold italics) are committed as `.otf` under `assets/fonts/`,
so native loads real cuts, while web serves the variable `.woff2` from
`public/fonts/` and pins the axis in CSS (`src/lib/webFontFaces.web.ts`).
Nothing to generate.

Only the weights in `src/lib/fontAssets.ts` are kept. The unused cuts (Thin,
Extralight, Light and their italics) and the duplicate `.woff2` copies under
`assets/fonts/` were removed — recover them from git history if a design ever
calls for them.

`design/exports/`, `design/renders/` and `design/diffs/` are reproducible and
git-ignored — only the scripts and the snapshot are tracked.
