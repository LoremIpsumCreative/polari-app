// ─────────────────────────────────────────────────────────────────────────────
// Figma screen snapshotter — REFERENCE SOURCE.
//
// This does NOT run in Node. It runs inside Figma via the design MCP
// (`use_figma`), because only that context can read the document. The flow is:
//
//   1. Paste this body into a `use_figma` call (fileKey = the Polari file).
//   2. It ends by `throw new Error('DATA:' + json)` — the executor rolls back on
//      any throw, so this stays 100% read-only and the JSON rides out on the
//      error message. (The MCP transport caps that message at ~20kB, which is
//      why the extractor is deliberately lean; if a batch is still too big,
//      shrink SCREENS and run twice.)
//   3. Write the captured JSON to scripts/figma-snapshot.json and commit it.
//
// Why bother: once the snapshot is committed, regenerating it after a Figma
// change makes `git diff scripts/figma-snapshot.json` the change report — no
// live re-dump needed to see what moved. And every future fidelity task reads
// this local file (cheap, greppable) instead of a fresh, expensive MCP dump.
//
// Rules that keep it lean AND meaningful now that screens are built from
// components:
//   • Record each INSTANCE's placement, never its internals — a screen is an
//     arrangement of components, and the component's own guts live in the
//     design-system sections.
//   • Skip invisible hotspot/* click targets.
//   • Boxes are frame-relative and rounded to 0.1; fills collapse to a hex,
//     'img', or 'grad:<a>/<b>'.
// ─────────────────────────────────────────────────────────────────────────────

// Edit this list to choose what to capture. Names are the snapshot keys.
//
// Every top-level frame on the Mockups page, verified 2026-08-02. All 44 are
// 393 wide; heights are 852 except the deliberately tall scroll screens and
// the Share Card, which is an export asset rather than a screen.
//
// The previous list had drifted: `dictionary` pointed at 1886:1572, a 2614px
// container rather than a screen, and `account` at 1125:2037, a two-node
// legacy frame. Both still resolved, so figma:check stayed green while the
// snapshot quietly tracked the wrong nodes — the exact silent trap that script
// exists to catch. Prefer one entry per real screen over container ids.
//
// NOTE: 44 screens overflow the ~20kB MCP message cap in a single pass. Run in
// batches by commenting out groups, then merge the JSON.
const SCREENS = [
  // App launch + onboarding
  ['app-launch-begin', '1753:2754'],
  ['app-launch-end', '1753:2755'],
  ['onboarding-new-word', '2452:2772'],

  // Today
  ['today-new-word', '1837:762'],
  ['today-definition', '1114:1023'],
  ['today-share-card', '1114:1089'],

  // Dictionary
  ['dictionary-main', '1871:1178'],
  ['dictionary-curated-list', '1885:1496'],
  ['dictionary-definition', '1885:2061'],
  ['dictionary-no-results', '1900:3458'],
  ['dictionary-filters-inactive', '1886:1573'],
  ['dictionary-filters-active', '1889:1832'],

  // Collections
  ['collections-hub-out', '1117:1578'],
  ['collections-hub-in', '1351:1709'],
  ['collections-favourites-empty', '1858:1479'],
  ['collections-favourites', '1858:1480'],
  ['collections-achievements', '1859:933'],
  ['collections-gallery', '1859:1566'],

  // Quiz — landing, countdowns, questions, results
  ['quiz-landing', '1114:158'],
  ['quiz-landing-ten', '1904:3022'],
  ['quiz-landing-timed', '1904:3360'],
  ['quiz-landing-life', '1904:3437'],
  ['countdown-ten', '1905:3174'],
  ['countdown-timed', '1905:3256'],
  ['countdown-life', '1905:3382'],
  ['question-ten', '1905:3173'],
  ['question-timed', '1905:3263'],
  ['question-life', '1905:3389'],
  ['question-definition', '1351:1875'], // "Definition from Word" (the MC screen)
  ['question-character', '1353:306'], // "Definition from Character"
  ['question-match', '1353:439'], // match board, before grading
  ['question-match-answers', '2068:2584'], // match board, graded — ticks/crosses + connectors
  ['results-highscore', '1114:482'],
  ['results-timesup', '1114:520'],
  ['results-normal', '1365:1425'],

  // Account
  ['account-signed-out', '2130:3264'],
  ['account-signed-in', '2154:3235'],
  ['account-signed-in-expanded', '2132:3432'],
  ['account-forgot-password', '2149:3060'],
  ['account-change-password', '2444:2636'],
  ['account-create', '2444:2697'],
  ['account-create-success', '2444:2758'],
  ['account-about', '2172:3625'],
  ['account-delete-confirm', '2144:3536'],
];

const hex = (c) =>
  '#' + [c.r, c.g, c.b].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('');

function paint(node, key) {
  try {
    const a = node[key];
    if (!a || a === figma.mixed || !a.length) return undefined;
    const p = a.filter((x) => x.visible !== false)[0];
    if (!p) return undefined;
    if (p.type === 'SOLID') {
      // Capture fill-opacity: a solid at <1 renders far paler than its hex
      // suggests (the New Word blob is #579DFF@0.11, a near-white blue).
      const o = p.opacity === undefined ? 1 : p.opacity;
      return o < 1 ? hex(p.color) + '@' + Math.round(o * 100) / 100 : hex(p.color);
    }
    if (p.type === 'IMAGE') return 'img';
    if (p.type.startsWith('GRADIENT')) return 'grad:' + p.gradientStops.map((s) => hex(s.color)).join('/');
    return p.type;
  } catch (e) {
    return undefined;
  }
}

const round = (v) => Math.round(v * 10) / 10;

const out = { generatedFrom: figma.fileKey || 'unknown', screens: {} };

for (const [name, id] of SCREENS) {
  const f = await figma.getNodeByIdAsync(id);
  if (!f || !f.absoluteBoundingBox) {
    out.screens[name] = { id, missing: true };
    continue;
  }
  const ox = f.absoluteBoundingBox.x;
  const oy = f.absoluteBoundingBox.y;
  const nodes = [];

  function walk(node, depth) {
    if (typeof node.name === 'string' && node.name.startsWith('hotspot/')) return;
    const b = node.absoluteBoundingBox;
    const rec = { n: node.name, t: node.type };
    if (b) rec.box = [round(b.x - ox), round(b.y - oy), round(b.width), round(b.height)];
    if (node.opacity !== undefined && node.opacity < 1) rec.op = round(node.opacity);
    const fl = paint(node, 'fills');
    if (fl) rec.fill = fl;
    const st = paint(node, 'strokes');
    if (st) {
      rec.stroke = st;
      try {
        rec.sw = node.strokeWeight;
      } catch (e) {}
    }
    if (node.type === 'TEXT') {
      rec.text = node.characters.slice(0, 48);
      rec.fs = node.fontSize;
      try {
        rec.font = node.fontName.family + ' ' + node.fontName.style;
      } catch (e) {}
    }
    nodes.push(rec);
    // Recurse into layout containers only. Instances are recorded as a single
    // placement; their internals belong to the component, not the screen.
    const container = node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'SECTION';
    if (container && node.children && depth < 2) node.children.forEach((c) => walk(c, depth + 1));
  }

  f.children.forEach((c) => walk(c, 0));
  out.screens[name] = { id, size: [round(f.width), round(f.height)], nodes };
}

throw new Error('DATA:' + JSON.stringify(out));
