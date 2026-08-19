// Turn docs/legal/privacy-policy.md into the typed module the app renders and
// the static page the outside world reads.
//
//   npm run legal:build
//
// The Markdown is the source of truth — it is what gets reviewed, and what the
// published policy is written in. The app cannot render Markdown without a
// dependency, so this converts it once into a structure react-native can walk,
// and the result is committed. Re-run it whenever the policy changes; CI checks
// the two agree.
//
// The second output exists because the app's web build is a client-rendered
// SPA: /profile/privacy is an empty shell until JavaScript runs, so App Review
// crawlers at Meta, Apple and Google fetch it and see no policy at all. Expo
// copies public/ into dist/ verbatim and Vercel serves real files ahead of the
// catch-all rewrite, so public/privacy.html lands at /privacy.html with the
// text present in the HTTP response. Both outputs come from this one source,
// which is the point — a hand-copied policy on another domain would drift.
//
// Only the constructs the policy actually uses are supported: h2/h3, bullets,
// paragraphs, bold and links. Anything else would pass through as plain text,
// so the parser fails loudly rather than silently dropping formatting.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SOURCE = join(HERE, '../docs/legal/privacy-policy.md');
const OUT = join(HERE, '../src/content/privacyPolicy.ts');
const OUT_HTML = join(HERE, '../public/privacy.html');

type Span = { text: string; bold?: boolean; href?: string };
type Block =
  | { kind: 'heading'; level: 2 | 3; text: string }
  | { kind: 'paragraph'; spans: Span[] }
  | { kind: 'bullet'; spans: Span[] };

/** Split inline Markdown into spans. Handles `**bold**` and `[text](href)`. */
function parseSpans(line: string): Span[] {
  const spans: Span[] = [];
  // One pass, alternating between the two inline forms we support.
  const pattern = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(line))) {
    if (m.index > last) spans.push({ text: line.slice(last, m.index) });
    if (m[1] !== undefined) spans.push({ text: m[1], bold: true });
    else spans.push({ text: m[2], href: m[3] });
    last = m.index + m[0].length;
  }
  if (last < line.length) spans.push({ text: line.slice(last) });
  return spans.filter((s) => s.text.length > 0);
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** Stable anchor for a section, so the deletion clause can be linked directly. */
const slugify = (text: string) =>
  text
    .replace(/^\d+\.\s*/, '') // drop the section number; it may be renumbered
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const renderSpans = (spans: Span[]) =>
  spans
    .map((s) => {
      const text = escapeHtml(s.text);
      if (s.href) {
        // Bare addresses in the document are written without a scheme; the app
        // adds one at render time (see PrivacyPolicyBody), and a browser would
        // otherwise treat them as a relative path. Same rule, same result.
        const href = /^(https?:|tel:|mailto:)/.test(s.href) ? s.href : `mailto:${s.href}`;
        return `<a href="${escapeHtml(href)}">${text}</a>`;
      }
      return s.bold ? `<strong>${text}</strong>` : text;
    })
    .join('');

/** Walk the blocks once, gathering runs of bullets into a single list. */
function renderBody(blocks: Block[]): string {
  const out: string[] = [];
  let bullets: string[] = [];
  const flush = () => {
    if (!bullets.length) return;
    out.push(`<ul>\n${bullets.join('\n')}\n</ul>`);
    bullets = [];
  };

  for (const block of blocks) {
    if (block.kind === 'bullet') {
      bullets.push(`<li>${renderSpans(block.spans)}</li>`);
      continue;
    }
    flush();
    if (block.kind === 'heading') {
      const tag = `h${block.level}`;
      out.push(`<${tag} id="${slugify(block.text)}">${escapeHtml(block.text)}</${tag}>`);
    } else {
      out.push(`<p>${renderSpans(block.spans)}</p>`);
    }
  }
  flush();
  return out.join('\n');
}

const src = readFileSync(SOURCE, 'utf8');

// "Last updated" rides in as a raw HTML div at the top; pull the date out and
// drop the tag rather than teaching the renderer about HTML.
const updated = src.match(/Last updated:\s*([^<]+)</i);
if (!updated) throw new Error('Could not find the "Last updated" line.');
const lastUpdated = updated[1].trim();

const blocks: Block[] = [];
for (const raw of src.split('\n')) {
  const line = raw.trim();
  if (!line) continue;
  // The two stray HTML tags are layout, not content.
  if (line.startsWith('<')) continue;

  if (line.startsWith('### '))
    blocks.push({ kind: 'heading', level: 3, text: line.slice(4).trim() });
  else if (line.startsWith('## '))
    blocks.push({ kind: 'heading', level: 2, text: line.slice(3).trim() });
  else if (line.startsWith('# '))
    throw new Error(`Unexpected h1 — the screen draws the title: ${line}`);
  else if (line.startsWith('- '))
    blocks.push({ kind: 'bullet', spans: parseSpans(line.slice(2).trim()) });
  else blocks.push({ kind: 'paragraph', spans: parseSpans(line) });
}

const counts = blocks.reduce<Record<string, number>>((acc, b) => {
  acc[b.kind] = (acc[b.kind] ?? 0) + 1;
  return acc;
}, {});

const body = `// GENERATED by scripts/build-privacy-policy.ts — do not edit by hand.
// Source: docs/legal/privacy-policy.md. Run \`npm run legal:build\` after changing it.

export type PolicySpan = { text: string; bold?: boolean; href?: string };
export type PolicyBlock =
  | { kind: 'heading'; level: 2 | 3; text: string }
  | { kind: 'paragraph'; spans: PolicySpan[] }
  | { kind: 'bullet'; spans: PolicySpan[] };

/** Shown in the card's top-right corner, straight from the document. */
export const PRIVACY_LAST_UPDATED = ${JSON.stringify(lastUpdated)};

export const PRIVACY_POLICY: PolicyBlock[] = ${JSON.stringify(blocks, null, 2)};
`;

// Type is loaded from public/fonts, which ships in the same static export, so
// the page renders correctly with no external requests and no tracking.
const html = `<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Privacy Policy · Polari</title>
<meta name="description" content="How Polari collects, uses, stores and shares personal information. Last updated ${escapeHtml(lastUpdated)}.">
<link rel="icon" href="/favicon.ico">
<style>
@font-face { font-family: Digitale; src: url("/fonts/Digitale-Variable.woff2") format("woff2"); font-weight: 100 900; font-style: normal; font-display: swap; }
@font-face { font-family: Digitale; src: url("/fonts/Digitale-VariableItalic.woff2") format("woff2"); font-weight: 100 900; font-style: italic; font-display: swap; }
@font-face { font-family: "Mouse Memoirs"; src: url("/fonts/MouseMemoirs-Regular.woff2") format("woff2"); font-weight: 400; font-display: swap; }

:root {
  --bg: #E7E9EC;
  --surface: #FFFFFF;
  --border: #C8CCD4;
  --text: #172B4D;
  --muted: #44546F;
  --link: #0C66E4;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #121212;
    --surface: #1D1B26;
    --border: #38344A;
    --text: #ECEDEE;
    --muted: #A9AEBB;
    --link: #7FB2FF;
  }
}

* { box-sizing: border-box; }
body {
  margin: 0;
  padding: 2rem 1.25rem 5rem;
  background: var(--bg);
  color: var(--text);
  font-family: Digitale, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  font-size: 17px;
  line-height: 1.65;
  -webkit-text-size-adjust: 100%;
}
main {
  max-width: 46rem;
  margin: 0 auto;
  padding: clamp(1.5rem, 5vw, 3rem);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
}
h1 {
  font-family: "Mouse Memoirs", Digitale, sans-serif;
  font-size: clamp(2.5rem, 9vw, 3.5rem);
  font-weight: 400;
  line-height: 1.1;
  margin: 0;
  letter-spacing: 0.01em;
}
.updated { color: var(--muted); font-size: 0.9rem; margin: 0.5rem 0 2rem; }
h2 { font-size: 1.3rem; font-weight: 700; margin: 2.5rem 0 0.75rem; line-height: 1.3; }
h3 { font-size: 1.05rem; font-weight: 600; margin: 1.75rem 0 0.5rem; }
h2:target, h3:target { scroll-margin-top: 1rem; }
p { margin: 0 0 1rem; }
ul { margin: 0 0 1.25rem; padding-left: 1.25rem; }
li { margin-bottom: 0.4rem; }
a { color: var(--link); text-decoration: underline; text-underline-offset: 2px; }
strong { font-weight: 700; }
hr { border: 0; border-top: 1px solid var(--border); margin: 2.5rem 0 1.5rem; }
footer { color: var(--muted); font-size: 0.9rem; }
</style>
</head>
<body>
<main>
<h1>Privacy Policy</h1>
<p class="updated">Last updated: ${escapeHtml(lastUpdated)}</p>
${renderBody(blocks)}
<hr>
<footer><a href="/">Return to Polari</a></footer>
</main>
</body>
</html>
`;

writeFileSync(OUT, body);
writeFileSync(OUT_HTML, html);
console.log(`  wrote ${OUT.split('/').slice(-3).join('/')}`);
console.log(`  wrote ${OUT_HTML.split('/').slice(-2).join('/')}`);
console.log(`  last updated: ${lastUpdated}`);
console.log(
  `  blocks: ${Object.entries(counts)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ')}`,
);
