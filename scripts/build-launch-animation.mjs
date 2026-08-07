// Build the launch animation's native assets from the designer's animated SVG.
//
//   node scripts/build-launch-animation.mjs
//
// WHY THIS EXISTS. The launch sequence is authored as one animated SVG —
// "Startup Animation with Button.svg", a Figma motion export whose motion lives
// in CSS @keyframes. On web that file plays as-is: it is vector, so it is sharp
// at every density, and it IS the design rather than a copy of it.
//
// Native cannot play it. react-native-svg renders SVG geometry but has no CSS
// animation engine, so the file would freeze on its first frame (everything at
// scale 0 — a blank screen). So native gets a video rendered FROM that same
// SVG, which keeps one source of truth: re-export the SVG, re-run this, and
// both platforms move together.
//
// The transparent background has to survive, and no single codec carries alpha
// across both engine families, so this emits two:
//
//   startup.mov   HEVC + alpha, hvc1   → iOS/macOS, AVFoundation, Safari
//   startup.webm  VP9 + alpha          → Android, Chrome, Firefox
//
// It also emits startup-final.png: the settled last frame. A video player is
// not required to hold its final frame after playback ends, so native swaps to
// this still on completion. Rendering it from the same SVG at the same size is
// what makes that swap invisible.
//
// Frames are stepped deterministically through the Web Animations API
// (pause, then set currentTime) rather than captured in real time — a wall
// clock capture drops and duplicates frames unpredictably.

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const SRC = arg(
  'svg',
  '/Users/brentondoherty/Projects/Polari/Screens/2026-08-07/App Launch/Startup Animation with Button.svg'
);
const OUT_DIR = resolve(ROOT, arg('out', 'assets/launch'));
const FPS = Number(arg('fps', 30));
// 3x covers the densest iPhone. The old hand-cut clip was 1x and visibly soft
// once upscaled; rendering from vector costs nothing but pixels.
const SCALE = Number(arg('scale', 3));

if (!existsSync(SRC)) {
  console.error(`SVG not found: ${SRC}`);
  process.exit(2);
}
if (!existsSync(CHROME)) {
  console.error(`Chrome not found at ${CHROME}`);
  process.exit(2);
}

const svg = readFileSync(SRC, 'utf8');
const w = Number(/\bwidth="(\d+(?:\.\d+)?)"/.exec(svg)?.[1]);
const h = Number(/\bheight="(\d+(?:\.\d+)?)"/.exec(svg)?.[1]);
if (!w || !h) {
  console.error('Could not read width/height off the SVG root.');
  process.exit(2);
}

const tmp = resolve(ROOT, 'node_modules/.cache/launch-anim');
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });
mkdirSync(OUT_DIR, { recursive: true });

// A transparent host page: omitBackground on the screenshot only yields real
// alpha if nothing behind the SVG paints.
writeFileSync(
  `${tmp}/host.html`,
  `<!doctype html><meta charset="utf-8"><style>
     html,body{margin:0;padding:0;background:transparent}
     #wrap{position:absolute;left:0;top:0;width:${w}px;height:${h}px}
     svg{display:block}
   </style><div id="wrap">${svg}</div>`
);

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--allow-file-access-from-files', '--hide-scrollbars', '--force-color-profile=srgb'],
});
const page = await browser.newPage();
await page.setViewport({ width: w, height: h, deviceScaleFactor: SCALE });
await page.goto(`file://${tmp}/host.html`, { waitUntil: 'load' });

const duration = await page.evaluate(() => {
  const all = document.getAnimations();
  for (const a of all) a.pause();
  return Math.max(...all.map((a) => Number(a.effect.getTiming().duration)));
});
if (!Number.isFinite(duration)) {
  console.error('No CSS animations found in the SVG — nothing to render.');
  process.exit(2);
}

const frames = Math.round((duration / 1000) * FPS);
console.log(`SVG ${w}x${h} · ${(duration / 1000).toFixed(3)}s · ${frames} frames @ ${FPS}fps · ${SCALE}x`);

for (let i = 0; i < frames; i++) {
  // The last frame samples just inside the end: at exactly `duration` an
  // infinite animation has already wrapped to the start of the next iteration.
  const t = Math.min((i / FPS) * 1000, duration - 0.5);
  await page.evaluate((t) => {
    for (const a of document.getAnimations()) a.currentTime = t;
  }, t);
  await page.screenshot({
    path: `${tmp}/f${String(i).padStart(5, '0')}.png`,
    omitBackground: true,
  });
  if (i % 30 === 0) process.stdout.write(`  frame ${i}/${frames}\r`);
}
console.log(`  frame ${frames}/${frames} — captured    `);

// The settled frame, kept as a still for native to hold after playback.
await page.evaluate((t) => {
  for (const a of document.getAnimations()) a.currentTime = t;
}, duration - 0.5);
await page.screenshot({ path: `${OUT_DIR}/startup-final.png`, omitBackground: true });
await browser.close();

const ff = (args) => execFileSync('ffmpeg', ['-hide_banner', '-v', 'error', '-y', ...args], { stdio: 'inherit' });
const input = ['-framerate', String(FPS), '-i', `${tmp}/f%05d.png`];

// HEVC with alpha. -pix_fmt bgra is what makes videotoolbox emit the alpha
// layer; -tag:v hvc1 is what makes Safari and QuickTime accept the result.
console.log('encoding startup.mov (HEVC + alpha) …');
ff([
  ...input,
  '-c:v', 'hevc_videotoolbox', '-alpha_quality', '0.9', '-q:v', '65',
  '-pix_fmt', 'bgra', '-tag:v', 'hvc1', '-allow_sw', '1',
  '-movflags', '+faststart', `${OUT_DIR}/startup.mov`,
]);

console.log('encoding startup.webm (VP9 + alpha) …');
ff([
  ...input,
  '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-crf', '32', '-b:v', '0',
  '-row-mt', '1', `${OUT_DIR}/startup.webm`,
]);

// ── Web: the SVG itself, as a module ────────────────────────────────────────
// Web plays the real vector file, so it stays sharp at any density and the
// motion is the designer's own rather than a re-render of it. It ships as a TS
// module rather than an asset because it has to be on screen in the first
// frame — a fetch would show an empty canvas while it loaded.
//
// Two edits are applied. The export loops forever (Figma's preview default); a
// launch sequence plays once and holds its last frame, which is `1 forwards`.
// And the ids are namespaced, because these are global in a document and the
// export uses generic ones (#Union, #Hero, #the, #of) that would collide with
// anything else on the page.
const NS = 'plaunch-';
// `infinite` is only ever an animation-iteration-count in this file, and a
// single declaration can carry several comma-separated animations — so this
// replaces every occurrence rather than one per declaration.
let webSvg = svg
  .replace(/\binfinite\b/g, '1 forwards')
  .replace(/id="([^"]+)"/g, (_, id) => `id="${NS}${id}"`)
  .replace(/#([A-Za-z_][\w-]*)\s*\{/g, (m, id) => `#${NS}${id} {`)
  .replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${NS}${id})`)
  .replace(/xlink:href="#([^"]+)"/g, (_, id) => `xlink:href="#${NS}${id}"`);

// The @keyframes rules must NOT be namespaced by the #id pass above — guard by
// restoring any keyframe name that picked up the prefix.
webSvg = webSvg.replace(new RegExp(`(@keyframes\\s+)${NS}`, 'g'), '$1');

// The export hard-codes its intrinsic size on the root, which would pin it to
// 395x525 whatever box it is given. The viewBox carries the coordinate system,
// so swapping the attributes for 100% lets it scale with the design frame.
webSvg = webSvg.replace(
  /^<svg\b[^>]*>/,
  (tag) =>
    tag
      .replace(/\swidth="[^"]*"/, ' width="100%"')
      .replace(/\sheight="[^"]*"/, ' height="100%"')
      .replace(/\spreserveAspectRatio="[^"]*"/, '') + ''
);

writeFileSync(
  resolve(ROOT, 'src/components/launchAnimationSvg.ts'),
  `// GENERATED by scripts/build-launch-animation.mjs — do not edit by hand.\n` +
    `// Source: ${SRC.split('/').pop()}\n` +
    `// Re-run the script after any re-export of that file.\n\n` +
    `/** The animation's own length, in ms. Drives the handoff to phase 2. */\n` +
    `export const LAUNCH_ANIM_MS = ${duration};\n\n` +
    `/** The animation's frame in design units: ${w}x${h}. */\n` +
    `export const LAUNCH_ANIM_SIZE = { w: ${w}, h: ${h} } as const;\n\n` +
    `export const LAUNCH_ANIM_SVG = ${JSON.stringify(webSvg)};\n`
);

rmSync(tmp, { recursive: true, force: true });
console.log(
  `\nwrote ${OUT_DIR}/startup.mov, startup.webm, startup-final.png\n` +
    `      src/components/launchAnimationSvg.ts`
);
