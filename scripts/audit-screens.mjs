// Run pixel-diff across every exported frame that maps to a reachable route,
// and print one table. The export set lives outside the repo (it is a Figma
// dump, not source), so the folder is a flag:
//
//   node scripts/audit-screens.mjs --screens="/path/to/Screens/2026-08-03"
//
// Routes that need a session or live game state are listed but skipped — they
// cannot be reached cold, and a diff against the signed-out fallback would be
// noise. Drive those by hand, or sign in first and re-run with --auth.

import { execFileSync } from 'node:child_process';
import { existsSync, openSync, readSync, closeSync } from 'node:fs';
import { join } from 'node:path';

// Not every frame is 852 tall — About is 1749, Today/Definition 1121, and four
// others run long, because they are scroll screens the design deliberately
// drew at full height. Rendering those in an 852 viewport and comparing the
// top 852 is not the same picture: the app's floating tab bar sits over the
// fold, where the frame puts it at the foot of the long column. So the
// viewport is taken from the export itself. Reads the IHDR box rather than
// decoding the whole PNG.
function pngSize(path) {
  const fd = openSync(path, 'r');
  const buf = Buffer.alloc(24);
  readSync(fd, buf, 0, 24, 0);
  closeSync(fd);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function arg(name, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

const SCREENS = arg('screens', '/Users/brentondoherty/Projects/Polari/Screens/2026-08-03');
const url = arg('url', 'http://localhost:3000');
const only = arg('only', null);
const withAuth = process.argv.includes('--auth');

// [export path, route, needs session/state]
const MAP = [
  ['Today/New Word.png', '/', false],
  ['Today/Definition.png', '/', 'today must be unwrapped first'],
  ['Today/Share Card.png', '/', 'share modal'],

  ['Dictionary/Dictionary Main.png', '/dictionary', false],
  ['Dictionary/Definition.png', '/dictionary/bona', false],
  ['Dictionary/Curated List.png', '/dictionary/collection/polari-for-beginners', false],
  ['Dictionary/No Search Results.png', '/dictionary', 'needs a search term typed'],
  ['Dictionary/Filter Modal/Filters Inactive.png', '/dictionary', 'modal'],
  ['Dictionary/Filter Modal/Filters Active.png', '/dictionary', 'modal'],

  ['Collections/Hub - Signed Out.png', '/favourites', false],
  ['Collections/Hub - Signed In.png', '/favourites', 'session'],
  ['Collections/Favourites - Without Entries.png', '/favourites/list', 'session'],
  ['Collections/Favourites - With Entries.png', '/favourites/list', 'session'],
  ['Collections/Achievements.png', '/favourites/achievements', 'session'],
  ['Collections/Gallery.png', '/favourites/gallery', 'session'],

  ['Quiz/Landing Screen/Main.png', '/quiz', false],
  ['Quiz/Landing Screen/10 Qs.png', '/quiz', 'mode selected'],
  ['Quiz/Landing Screen/1 Min.png', '/quiz', 'mode selected'],
  ['Quiz/Landing Screen/1 Life.png', '/quiz', 'mode selected'],
  ['Quiz/Quiz Type-Specific Screens/10 Qs - Countdown.png', '/quiz/play', 'live game'],
  ['Quiz/Quiz Type-Specific Screens/1 Min - Countdown.png', '/quiz/play', 'live game'],
  ['Quiz/Quiz Type-Specific Screens/1 Life - Countdown.png', '/quiz/play', 'live game'],
  ['Quiz/Quiz Type-Specific Screens/10 Qs - Question.png', '/quiz/play', 'live game'],
  ['Quiz/Quiz Type-Specific Screens/1 Min - Question.png', '/quiz/play', 'live game'],
  ['Quiz/Quiz Type-Specific Screens/1 Life - Question.png', '/quiz/play', 'live game'],
  ['Quiz/Question Variations/Definition from Word.png', '/quiz/play', 'live game'],
  ['Quiz/Question Variations/Definition from Character.png', '/quiz/play', 'live game'],
  ['Quiz/Question Variations/Match Word to Definition - Selections.png', '/quiz/play', 'live game'],
  ['Quiz/Question Variations/Match Word to Definition - Answers.png', '/quiz/play', 'live game'],
  ['Quiz/Results/10 Qs and 1 Life.png', '/quiz/results', 'finished game'],
  ['Quiz/Results/1 Min.png', '/quiz/results', 'finished game'],
  ['Quiz/Results/High Score (All Quiz Modes).png', '/quiz/results', 'finished game'],

  ['Account/Create Account.png', '/profile/create-account', false],
  ['Account/Create Account Success.png', '/profile/create-account', 'post-submit state'],
  ['Account/Forgot Password.png', '/profile/forgot-password', false],
  ['Account/Change Password/Main.png', '/profile/change-password', false],
  ['Account/About.png', '/profile/about', false],
  ['Account/Main/Signed In.png', '/profile', 'session'],
  ['Account/Main/Signed In - Expanded.png', '/profile', 'session'],
  ['Account/Main/Deletion Confirmation.png', '/profile', 'session + modal'],
];

const runnable = MAP.filter(([, , blocked]) => !blocked || withAuth);
const results = [];
const skipped = [];

for (const [png, route, blocked] of MAP) {
  const figma = join(SCREENS, png);
  const name = png.replace(/\.png$/, '');
  if (only && !name.toLowerCase().includes(only.toLowerCase())) continue;
  if (!existsSync(figma)) {
    skipped.push([name, route, 'export missing']);
    continue;
  }
  if (blocked && !withAuth) {
    skipped.push([name, route, blocked]);
    continue;
  }
  const out = 'design/diffs/' + name.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  const { width: fw, height: fh } = pngSize(figma);
  if (fw !== 393) {
    // The Share Card is 566 wide — an export asset, not a screen.
    skipped.push([name, route, `export is ${fw}x${fh}, not a 393-wide screen`]);
    continue;
  }
  let pct = null;
  let heat = '';
  try {
    const stdout = execFileSync(
      process.execPath,
      ['scripts/pixel-diff.mjs', `--route=${route}`, `--figma=${figma}`, `--out=${out}`,
       `--url=${url}`, `--width=${fw}`, `--height=${fh}`],
      { encoding: 'utf8' }
    );
    pct = stdout.match(/overall change: ([\d.]+)%/)?.[1] ?? '?';
    heat = stdout;
  } catch (e) {
    const stdout = e.stdout ?? '';
    pct = stdout.match(/overall change: ([\d.]+)%/)?.[1] ?? 'ERR';
    heat = stdout;
  }
  // Densest heatmap cell — a contiguous hot band means real drift, not text noise.
  const grid = heat.split('\n').filter((l) => /^ {4}[·\d# ]+$/.test(l));
  const hot = grid.join('').split(/\s+/).filter((c) => /^[2-9#]$/.test(c)).length;
  results.push([name, route, pct, hot]);
  console.log(`  ${String(pct).padStart(6)}%  hot=${String(hot).padStart(2)}  ${name}`);
}

console.log(`\n${'='.repeat(72)}\nAUDIT — ${results.length} screens diffed at 393×852\n${'='.repeat(72)}`);
console.log('  A screen that matches exactly scores 2-3% (Figma vs Chrome text raster).');
console.log('  "hot" = heatmap cells at ≥20% change; a cluster means real drift.\n');
for (const [name, route, pct, hot] of [...results].sort((a, b) => Number(b[2]) - Number(a[2]))) {
  const flag = Number(pct) >= 8 || hot >= 4 ? '  ← LOOK' : '';
  console.log(`  ${String(pct).padStart(6)}%  hot=${String(hot).padStart(2)}  ${name.padEnd(46)} ${route}${flag}`);
}
if (skipped.length) {
  console.log(`\n  Not reachable cold (${skipped.length}):`);
  for (const [name, route, why] of skipped) console.log(`    ${name.padEnd(48)} ${route}  — ${why}`);
}
console.log();
