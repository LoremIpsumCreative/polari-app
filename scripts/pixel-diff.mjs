// Headless pixel-diff harness: render an app route in the machine's Chrome,
// compare it to a Figma export PNG, and print a NUMERIC report — an overall
// change score plus a grid heatmap of where the differences concentrate. The
// point is to take the model out of the verify loop: a script reads pixels and
// emits a table, instead of a screenshot being fed to an LLM for eyeballing.
//
//   node scripts/pixel-diff.mjs --route=/quiz \
//        --figma=design/exports/landing.png --out=design/diffs/landing
//
// Flags:
//   --route    app path to screenshot (served from --url, default localhost:3000)
//   --url      dev server origin (default http://localhost:3000)
//   --figma    path to the Figma export PNG (export at scale 1 → 393 wide)
//   --out      basename for outputs: writes <out>.render.png and <out>.diff.png
//   --width    viewport width (default 393 — the design space; app scale = 1)
//   --height   viewport height (default 852)
//   --wait     ms to settle after load before capture (default 2500)
//   --tol      per-channel delta that counts as "changed" (default 32)
//   --cols/--rows  heatmap grid (default 8 × 12)
//   --reduced-motion  emulate prefers-reduced-motion: reduce before loading
//
// WHY PUPPETEER AND NOT `chrome --screenshot`:
//   The old version shelled out to Chrome with --window-size=393,852. That sets
//   the capture size but NOT the layout viewport: Chrome laid the page out at
//   500px and cropped the shot to 393. Proof — a marker pinned to `right:0`
//   never appeared in the capture, and this app's Create Account card rendered
//   at x62, which is exactly (500-430)/2 + 27, its position in a 430 column
//   centred in a 500 viewport. At a true 393 viewport it sits at x27. So every
//   number this script printed compared a 500-wide layout against a 393 export.
//   puppeteer-core drives the same installed Chrome over CDP, where
//   setViewport genuinely resizes the layout viewport. Nothing is downloaded.
//
// Animated screens: pass --reduced-motion rather than fishing for a --wait that
// happens to land on a still moment. Today's present loops forever and the quiz
// landing plays a 5.2s entrance, so an unfrozen capture compares whatever phase
// it caught: Today reads 5.6% at rest and 15.9% caught at the top of its bounce,
// from identical code. The frames themselves are drawn at rest, so freezing the
// app the same way is the like-for-like comparison.

import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { PNG } from 'pngjs';
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

function arg(name, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

const route = arg('route', '/');
const url = arg('url', 'http://localhost:3000');
const figmaPath = arg('figma', null);
const out = arg('out', 'design/diffs/diff');
const width = Number(arg('width', 393));
const height = Number(arg('height', 852));
const wait = Number(arg('wait', 2500));
const tol = Number(arg('tol', 32));
const cols = Number(arg('cols', 8));
const rows = Number(arg('rows', 12));
// Screens that loop cannot be diffed against a still frame: whatever phase the
// capture lands on is the phase you compare, and the number swings wildly with
// it. The app honours prefers-reduced-motion by presenting the finished, at-rest
// screen, which is also what the Figma frame draws — so emulating the setting
// gives a deterministic capture to compare. Use it for any animated route.
const reducedMotion = process.argv.includes('--reduced-motion');

if (!figmaPath || !existsSync(figmaPath)) {
  console.error(
    `Missing --figma export.\nExport the frame at scale 1 (via the design MCP download_assets)\n` +
      `to a PNG and pass it as --figma. Got: ${figmaPath}`,
  );
  process.exit(2);
}
if (!existsSync(CHROME)) {
  console.error(`Chrome not found at ${CHROME}. Adjust CHROME in pixel-diff.mjs.`);
  process.exit(2);
}

mkdirSync(dirname(resolve(out)), { recursive: true });
const renderPath = `${out}.render.png`;

// 1. Screenshot the route over CDP, where the viewport is the layout viewport.
//    `clip` pins the capture to the design frame so a taller document still
//    yields exactly width×height anchored top-left, matching the export.
const target = url.replace(/\/$/, '') + route;
console.log(`▶ rendering ${target} at ${width}×${height} …`);

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  defaultViewport: { width, height, deviceScaleFactor: 1 },
  args: ['--hide-scrollbars', '--force-device-scale-factor=1'],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  if (reducedMotion) {
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  }
  await page.goto(target, { waitUntil: 'networkidle2', timeout: 60_000 });

  // Assert the layout really is the width we asked for — the failure this
  // script exists to avoid is silently diffing a differently-sized layout.
  const actual = await page.evaluate(() => window.innerWidth);
  if (actual !== width) {
    console.error(`✗ layout viewport is ${actual}px, expected ${width}px — refusing to diff.`);
    await browser.close();
    process.exit(2);
  }

  // Dismiss the launch screen. It mounts over the whole app on every cold
  // start, and a headless capture is always a cold start — so without this
  // every route diffs against the launch sequence rather than the screen under
  // it. It made all eleven screens jump at once, including ones previously
  // measured pixel-exact, which is the signature of a global overlay rather
  // than real drift.
  await page
    .evaluate(() => {
      const open = [...document.querySelectorAll('*')].find(
        (e) => e.children.length === 0 && e.textContent.trim() === 'Open',
      );
      open
        ?.closest('[role="button"],button,div')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    })
    .catch(() => {});
  await new Promise((r) => setTimeout(r, 400));

  await new Promise((r) => setTimeout(r, wait));
  await page.screenshot({
    path: resolve(renderPath),
    clip: { x: 0, y: 0, width, height },
  });
} finally {
  await browser.close();
}
if (!existsSync(renderPath)) {
  console.error('Chrome produced no screenshot — is the dev server up at ' + url + ' ?');
  process.exit(1);
}

// 2. Load both, compare the overlapping top-anchored region at common width.
const render = PNG.sync.read(readFileSync(renderPath));
const figma = PNG.sync.read(readFileSync(figmaPath));

if (render.width !== figma.width) {
  console.warn(
    `⚠ width mismatch: render ${render.width}px vs figma ${figma.width}px. ` +
      `Compare is still top-left anchored but columns won't align — ` +
      `re-export the frame at scale 1 (=${width}px) for a true diff.`,
  );
}
const W = Math.min(render.width, figma.width);
const H = Math.min(render.height, figma.height);

const px = (img, x, y) => {
  const i = (img.width * y + x) << 2;
  return [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]];
};

// Difference PNG: the render, dimmed, with changed pixels flagged magenta.
const diff = new PNG({ width: W, height: H });
const cell = Array.from({ length: rows }, () => new Array(cols).fill(0));
const cellTotal = Array.from({ length: rows }, () => new Array(cols).fill(0));
let changed = 0;
let counted = 0;

for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const [r1, g1, b1, a1] = px(render, x, y);
    const [r2, g2, b2, a2] = px(figma, x, y);
    // Treat a pixel transparent in BOTH as "no content" and skip it.
    const bothClear = a1 < 8 && a2 < 8;
    const delta = Math.max(
      Math.abs(r1 - r2),
      Math.abs(g1 - g2),
      Math.abs(b1 - b2),
      Math.abs(a1 - a2),
    );
    const isDiff = !bothClear && delta > tol;
    const o = (W * y + x) << 2;
    if (isDiff) {
      diff.data[o] = 255;
      diff.data[o + 1] = 0;
      diff.data[o + 2] = 200;
      diff.data[o + 3] = 255;
    } else {
      diff.data[o] = r1 >> 1;
      diff.data[o + 1] = g1 >> 1;
      diff.data[o + 2] = b1 >> 1;
      diff.data[o + 3] = 255;
    }
    if (!bothClear) {
      counted++;
      const cx = Math.min(cols - 1, ((x * cols) / W) | 0);
      const cy = Math.min(rows - 1, ((y * rows) / H) | 0);
      cellTotal[cy][cx]++;
      if (isDiff) {
        changed++;
        cell[cy][cx]++;
      }
    }
  }
}

const diffPath = `${out}.diff.png`;
writeFileSync(diffPath, PNG.sync.write(diff));

// 3. Report. The grid is the token-saver: a cheap model reads which cells drift,
//    not an image. `.` <1%, digits = tens of %, `#` ≥90%.
const pct = counted ? (100 * changed) / counted : 0;
function glyph(c, t) {
  if (!t) return ' ';
  const p = (100 * c) / t;
  if (p < 1) return '·';
  if (p >= 90) return '#';
  return String(Math.min(9, Math.floor(p / 10)));
}

console.log(`\ncompared ${W}×${H} · ${counted.toLocaleString()} content px`);
console.log(`overall change: ${pct.toFixed(2)}%  (tolerance ±${tol}/channel)\n`);
console.log('  heatmap (· <1%  1–9 = ×10%  # ≥90%), top-left origin:');
for (let r = 0; r < rows; r++) {
  console.log('    ' + cell[r].map((c, i) => glyph(c, cellTotal[r][i])).join(' '));
}
console.log(`\n  render → ${renderPath}`);
console.log(`  diff   → ${diffPath}  (magenta = changed)\n`);

// Exit code encodes severity so CI / a script can branch without parsing text.
//
// The threshold is 8, not the 2 this used to carry. A screen that matches its
// frame *exactly* still scores 2-3% here: Figma's text rasteriser and Chrome's
// disagree on glyph edges, and every 1px stroke antialiases differently. That
// floor is measured on the Account forms, whose cards, field tops and CTAs are
// each confirmed pixel-exact against their frames by DOM measurement — they
// score 1.74% (Forgot Password), 2.99% (Create Account) and 3.33% (Change
// Password, which also carries a known stale button label in its export).
//
// 8 leaves headroom above that floor for text-heavy screens. Read the heatmap,
// not just the number: real drift shows as a contiguous band of 2+ cells,
// whereas rasterisation noise spreads evenly as · and 0.
const fail = Number(arg('fail', 8));
process.exit(pct < fail ? 0 : 1);

void rmSync; // reserved for future --clean
