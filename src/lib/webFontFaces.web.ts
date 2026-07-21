// Digitale is now a variable family whose `wght` axis runs 100-800 and,
// crucially, *defaults to 100* — so a face registered without a weight renders
// hairline thin. expo-font's web loader injects @font-face rules with no weight
// descriptor, which is exactly that failure case, so the faces are declared
// here instead.
//
// Each alias gets a single-value `font-weight`, which pins the axis: for a
// variable font the used weight is the computed weight clamped into the face's
// declared range, and a range of one value can only resolve to itself. That
// keeps every existing `fontFamily: fonts.bold` style working untouched.
//
// The files are served from public/ rather than required, so no bundler asset
// resolution (and no expo-asset dependency) is involved.
const FACES: { family: string; file: string; weight: number; italic?: boolean }[] = [
  { family: 'Digitale-Regular', file: 'Digitale-Variable', weight: 400 },
  { family: 'Digitale-Semibold', file: 'Digitale-Variable', weight: 600 },
  { family: 'Digitale-Bold', file: 'Digitale-Variable', weight: 700 },
  { family: 'Digitale-Extrabold', file: 'Digitale-Variable', weight: 800 },
  { family: 'Digitale-Italic', file: 'Digitale-VariableItalic', weight: 400, italic: true },
  // The results bubbles want heavier italics than the regular cut.
  { family: 'Digitale-SemiboldItalic', file: 'Digitale-VariableItalic', weight: 600, italic: true },
  { family: 'Digitale-BoldItalic', file: 'Digitale-VariableItalic', weight: 700, italic: true },
];

const STYLE_ID = 'polari-font-faces';

export function installWebFonts() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;

  const rules = FACES.map(
    ({ family, file, weight, italic }) => `@font-face{
  font-family:'${family}';
  src:url('/fonts/${file}.woff2') format('woff2');
  font-weight:${weight};
  font-style:${italic ? 'italic' : 'normal'};
  font-variation-settings:'wght' ${weight};
  font-display:swap;
}`
  );

  rules.push(`@font-face{
  font-family:'MouseMemoirs-Regular';
  src:url('/fonts/MouseMemoirs-Regular.woff2') format('woff2');
  font-weight:400;
  font-style:normal;
  font-display:swap;
}`);

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = rules.join('\n');
  document.head.appendChild(style);
}

// The faces are plain CSS, so there is nothing to await — the browser fetches
// them on first use and `font-display:swap` keeps text visible meanwhile.
export const webFontsReady = true;
