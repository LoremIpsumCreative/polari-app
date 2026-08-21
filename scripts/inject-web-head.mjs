// Injects the PWA head tags into the exported dist/index.html.
//
// Why a post-export step rather than app/+html.tsx: that file is only consulted
// when web.output is "static". This app exports as "single" — one SPA shell
// with a catch-all rewrite (see vercel.json) — and in that mode Expo generates
// index.html from its own template and ignores +html.tsx entirely. Verified by
// building both with and without the file present: the head was identical.
//
// Switching to "static" would get us +html.tsx, but it changes the rendering
// model to per-route HTML and would want the catch-all rewrite revisited. Not a
// trade worth making to place four tags.
//
// What the tags are for:
//
//   apple-touch-icon  iOS Safari reads this and ignores the manifest entirely
//                     for "Add to Home Screen". Without it iOS screenshots the
//                     page and uses that as the icon.
//   manifest          Android Chrome reads this for install, name and icons.
//   apple-mobile-*    iOS reads standalone display and the home-screen title
//                     from meta tags, not from the manifest.
//
// Idempotent: re-running against an already-injected file is a no-op, so it is
// safe in a repeated or resumed build.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const INDEX = join(HERE, '../dist/index.html');

const TAGS = `    <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="Polari" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="theme-color" content="#0C66E4" />
`;

if (!existsSync(INDEX)) {
  console.error(`inject-web-head: ${INDEX} not found — run the export first.`);
  process.exit(1);
}

const html = readFileSync(INDEX, 'utf8');

if (html.includes('apple-touch-icon')) {
  console.log('inject-web-head: already present, nothing to do.');
  process.exit(0);
}

// viewport-fit=cover lets the frame reach under the notch and the home
// indicator once the app is installed to the home screen.
const withViewport = html.replace(
  '<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />',
  '<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />',
);

const marker = '</head>';
if (!withViewport.includes(marker)) {
  console.error('inject-web-head: no </head> in the exported shell — Expo changed its template.');
  process.exit(1);
}

writeFileSync(INDEX, withViewport.replace(marker, `${TAGS}  ${marker}`));
console.log('inject-web-head: added apple-touch-icon, manifest and standalone meta.');
