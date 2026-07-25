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
//   --figma    path to the Figma export PNG (export at scale 1 → 394 wide)
//   --out      basename for outputs: writes <out>.render.png and <out>.diff.png
//   --width    viewport width (default 394 — the design space; app scale = 1)
//   --height   viewport height (default 900)
//   --wait     ms of virtual time to advance before capture (default 2500)
//   --tol      per-channel delta that counts as "changed" (default 32)
//   --cols/--rows  heatmap grid (default 8 × 12)
//
// No new dependencies: machine Chrome for the screenshot, pngjs (already a
// transitive dep) for the compare.
//
// Caveat: entrance animations and auto-advancing screens (quiz landing, the
// countdown) may not settle under virtual time — for those, screenshot a
// steady state or raise --wait. Static screens (Today, Dictionary, question,
// results) are the sweet spot.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { PNG } from 'pngjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

function arg(name, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

const route = arg('route', '/');
const url = arg('url', 'http://localhost:3000');
const figmaPath = arg('figma', null);
const out = arg('out', 'design/diffs/diff');
const width = Number(arg('width', 394));
const height = Number(arg('height', 900));
const wait = Number(arg('wait', 2500));
const tol = Number(arg('tol', 32));
const cols = Number(arg('cols', 8));
const rows = Number(arg('rows', 12));

if (!figmaPath || !existsSync(figmaPath)) {
  console.error(
    `Missing --figma export.\nExport the frame at scale 1 (via the design MCP download_assets)\n` +
      `to a PNG and pass it as --figma. Got: ${figmaPath}`
  );
  process.exit(2);
}
if (!existsSync(CHROME)) {
  console.error(`Chrome not found at ${CHROME}. Adjust CHROME in pixel-diff.mjs.`);
  process.exit(2);
}

mkdirSync(dirname(resolve(out)), { recursive: true });
const renderPath = `${out}.render.png`;

// 1. Screenshot the route with headless Chrome. --virtual-time-budget advances
//    timers/network by `wait` then captures, which keeps it deterministic.
const target = url.replace(/\/$/, '') + route;
console.log(`▶ rendering ${target} at ${width}×${height} …`);
execFileSync(
  CHROME,
  [
    '--headless=new',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    `--window-size=${width},${height}`,
    `--virtual-time-budget=${wait}`,
    `--screenshot=${resolve(renderPath)}`,
    target,
  ],
  { stdio: ['ignore', 'ignore', 'ignore'] }
);
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
      `re-export the frame at scale 1 (=${width}px) for a true diff.`
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
    const delta = Math.max(Math.abs(r1 - r2), Math.abs(g1 - g2), Math.abs(b1 - b2), Math.abs(a1 - a2));
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
      const cx = Math.min(cols - 1, (x * cols / W) | 0);
      const cy = Math.min(rows - 1, (y * rows / H) | 0);
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
process.exit(pct < 2 ? 0 : 1);

void rmSync; // reserved for future --clean
