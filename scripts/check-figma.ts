// Validate the committed Figma screen snapshot and summarise it.
//
//   npm run figma:check    — assert every tracked screen still resolves; print
//                            a per-screen summary (exit 1 if any went stale)
//
// This is deliberately NOT a live design-vs-code comparator. The change report
// is `git diff scripts/figma-snapshot.json`: regenerate the snapshot from
// scripts/figma-snapshot.fig.js (run in Figma via the design MCP), overwrite the
// JSON, and git shows exactly which node moved, resized or recoloured — no
// expensive live re-dump needed to see what changed.
//
// What this script catches on its own: a screen whose node-id went stale after
// a redesign (recorded as `missing` by the snapshotter). That is a silent trap
// — the frame still exists in Figma under a new id, so nothing errors, you just
// stop tracking it. CI fails here instead.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_PATH = join(HERE, 'figma-snapshot.json');

type Node = { n: string; t: string; box?: number[]; fill?: string; text?: string };
type Screen = { id: string; missing?: true; size?: number[]; nodes?: Node[] };
type Snapshot = { generatedFrom: string; screens: Record<string, Screen> };

const snap = JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf8')) as Snapshot;

const rows: string[] = [];
const stale: string[] = [];

for (const [name, screen] of Object.entries(snap.screens)) {
  if (screen.missing) {
    stale.push(`${name} (${screen.id})`);
    rows.push(`  ✗ ${name.padEnd(22)} ${screen.id}  — STALE ID, re-capture`);
    continue;
  }
  const nodes = screen.nodes ?? [];
  const instances = nodes.filter((n) => n.t === 'INSTANCE').length;
  const texts = nodes.filter((n) => n.t === 'TEXT').length;
  const size = screen.size ? `${screen.size[0]}×${screen.size[1]}` : '?';
  rows.push(
    `  ✓ ${name.padEnd(22)} ${size.padEnd(9)} ${String(nodes.length).padStart(2)} nodes · ` +
      `${instances} instances · ${texts} text`
  );
}

console.log(`\nFigma snapshot · file ${snap.generatedFrom}\n`);
console.log(rows.join('\n'));

if (stale.length) {
  console.error(
    `\n${stale.length} screen(s) have stale node-ids: ${stale.join(', ')}\n` +
      `Re-discover their frames in Figma, update SCREENS in figma-snapshot.fig.js, ` +
      `regenerate the snapshot, and commit.\n`
  );
  process.exit(1);
}

console.log(`\nAll ${Object.keys(snap.screens).length} tracked screens resolve.\n`);
