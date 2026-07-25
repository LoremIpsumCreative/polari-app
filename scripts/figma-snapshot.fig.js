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
const SCREENS = [
  ['landing', '1114:158'],
  ['results-highscore', '1114:482'],
  ['results-timesup', '1114:520'],
  ['results-normal', '1365:1425'],
  ['question', '1351:1875'],
  // Countdown IDs went stale after the last redesign — re-discover and re-add:
  // ['countdown-ten', '____'],
  // ['countdown-timed', '____'],
  // ['countdown-life', '____'],
];

const hex = (c) =>
  '#' + [c.r, c.g, c.b].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('');

function paint(node, key) {
  try {
    const a = node[key];
    if (!a || a === figma.mixed || !a.length) return undefined;
    const p = a.filter((x) => x.visible !== false)[0];
    if (!p) return undefined;
    if (p.type === 'SOLID') return hex(p.color);
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
