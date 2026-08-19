// Central design tokens — matches the Figma "Polari" token palette (frames
// 1042-205 / 1058-1546): cool neutral canvas (neutral/200), navy ink
// (neutral/900), brand blue blue/700, soft blue fills, labelled neutral/50
// fieldset rows with neutral/250 hairlines. Type is Digitale.
export const colors = {
  background: '#DCDFE4', // neutral/200
  // The base canvas every screen sits on, per the mockups. The quiz landing
  // and results screens are the only ones that paint their own base instead.
  canvas: '#E7E9EC',
  surface: '#FFFFFF', // neutral/0
  inset: '#F8F9FA', // neutral/50 — recessed fieldset rows
  primary: '#0C66E4', // blue/700
  primarySoft: '#F4F9FF', // blue/blue50
  accent: '#0C66E4',
  accentSoft: '#F4F9FF',
  // Not the related-word chips, despite the name: those are blue, built from
  // `primarySoft`/`primary` to match Pill/Related. These are the teal stops —
  // `related` tints the Gallery satellite on the Collections hub and
  // `relatedSoft` fills the teal Button/Bundles card (Background/Related Soft).
  related: '#2898BD', // teal/600
  relatedSoft: '#F4FCFF', // teal/50
  chipGrey: '#44546F', // neutral/700 — part-of-speech chip
  fieldBorder: '#C8CCD4', // neutral/250 — fieldset row + pill hairlines
  // Both were previously measured off the 393x852 exports (#A4ACB9 / #B0B7C2)
  // on the assumption they were flat 1px runs. They are not: the file binds
  // both to Neutral/600 and strokes them at 0.5px OUTSIDE, so what the export
  // shows is that one colour antialiased against white. Half-coverage of
  // #626F86 on white is #B0B7C2 — exactly the old `pillBorder` — which is the
  // arithmetic confirming the measurement was of the render, not the source.
  // Bound to a primitive, so single-mode: the same in both schemes.
  cardBorder: '#626F86', // Neutral/600 — form card edge, at hairline weight
  pillBorder: '#626F86', // Neutral/600 — notched pill field outline
  // Curated-bundle card edges: the blue one reuses `primary`, these two are
  // the teal/700 and green/700 stops the Button/Bundles variants use.
  tealEdge: '#227D9B', // teal/700
  green: '#1F845A', // green/700
  greenSoft: '#EEFFF8', // green/50
  label: '#758195', // neutral/500 — fieldset labels
  // Text/Inactive. Was #8590A2 (Neutral/400); the file binds every disabled
  // element — the Profile row's stroke, its label, its glyph — to Text/Inactive,
  // which resolves to Neutral/300.
  inactive: '#B3B9C4', // neutral/300 — disabled rows, inactive segmented options
  teal: '#27958A',
  tealSoft: '#DDEFEB',
  blush: '#E98F7F',
  blushSoft: '#FADFD8',
  text: '#172B4D', // neutral/900
  ink: '#0E1D31', // neutral/1000 — darkest ink (share stage)
  dark: '#1B1B1B', // dark stage backdrop (quiz intro)
  // Quiz dark stage: a #2B273F base with a #121212 gradient washing the lower
  // half to near-black (Figma "background" + "gradient overlay" vectors).
  stage: '#2B273F',
  stageDeep: '#121212',
  spotlight: '#FFF7D6', // cream spotlight ellipse on the quiz stage (Figma "spotlight")
  textMuted: '#44546F', // neutral/700
  textFaint: '#758195', // neutral/500
  border: 'rgba(23, 43, 77, 0.12)',
  danger: '#E2483D', // Status/Danger ← Red/600 (was a hand-picked #ED3241)
  heart: '#ED3241',
  onPrimary: '#FFFFFF',

  // Quiz redesign (Figma "Quiz" section, node 1114-106)
  correct: '#5B7F24', // answer tile border + text when right
  correctSoft: '#F7FFEC', // answer tile fill when right
  incorrect: '#C9372C', // answer tile border + text when wrong
  incorrectSoft: '#FFF6F5', // answer tile fill when wrong
  quizPurple: '#6E5DC6', // mode chip fill + active Quiz tab
  quizPurpleDark: '#493B8B', // mode chip border
  quizInk: '#3D2232', // mode chip label
  progressTrack: '#F1F2F4', // progress rail + stat pills
  progressFill: '#5E4DB2', // progress bar fill
  progressBorder: '#352C63', // progress rail hairline
  metaText: '#626F86', // "Question 3 of 10" / pill labels

  // Three surfaces that were hardcoded at their call sites until the dark
  // palette needed them to differ. Light values are byte-identical to what
  // those call sites used, so nothing moves in light mode.
  pattern: '#DBDDE4', // Background/Pattern — the sparkle tile ink
  navbar: '#FFFFFF', // Background/Navbar — the tab bar plate
  // The Account option row hairline. Shares light's #626F86 with `metaText`
  // but is a border, not a label: the two need different darks, and one hex
  // serving two roles is how a palette quietly goes wrong.
  optionBorder: '#626F86',
  // The badge circle on a disabled Account row. Same light value the quiz's
  // `progressTrack` happens to carry, kept separate for the same reason as
  // `optionBorder`: different role, different dark.
  disabledFill: '#F1F2F4',
};

// Each tab owns an accent colour, used for its icon + label when active.
// Taken from the Figma "Navbar 2.0" component variants (node 1766:3478); keys
// are expo-router route names.
export const tabAccents: Record<string, string> = {
  index: '#0C66E4', // Today
  dictionary: '#6A9A23', // Dictionary
  favourites: '#CD519D', // Collections
  quiz: '#6E5DC6', // Quiz
  profile: '#2898BD', // Account — Accent/Account (teal/600)
};

// Digitale is one variable family; each name below is an alias pinned to a
// point on its weight axis (see webFontFaces.web.ts).
export const fonts = {
  // Display face (Mouse Memoirs) — quiz headlines, mode chips, countdown titles.
  // Everything else is Digitale.
  display: 'MouseMemoirs-Regular',
  regular: 'Digitale-Regular',
  italic: 'Digitale-Italic',
  semibold: 'Digitale-Semibold',
  bold: 'Digitale-Bold',
  extrabold: 'Digitale-Extrabold',
  boldItalic: 'Digitale-BoldItalic',
  semiboldItalic: 'Digitale-SemiboldItalic',
};

// Shared navigator header styling (flat, canvas-coloured, Digitale)
export const headerOptions = {
  headerStyle: { backgroundColor: colors.canvas },
  headerShadowVisible: false,
  headerTintColor: colors.text,
  headerTitleStyle: { fontFamily: fonts.semibold, fontSize: 17, color: colors.text },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// Caps the design frame's width so a wide browser window gets a phone-sized
// column instead of a stretched one. 440 is the widest logical iPhone (16 Pro
// Max), so no handset is capped and every one of them fills its screen edge to
// edge; at 430 the Pro Max rendered with a 5px dead strip down each side.
//
// On a desktop window the frame's HEIGHT term binds long before this does — see
// designScale — so raising the cap costs nothing there either.
export const PHONE_MAX_WIDTH = 440;
// The mockups' frame. 393x852 is the logical resolution of iPhone 15/16 Pro,
// so the Figma template, the localhost preview and the device all agree — the
// old 394 matched no real device and was where the drift started.
export const DESIGN_WIDTH = 393;
// Screens never render shorter than this.
export const DESIGN_HEIGHT = 852;

export const radii = {
  sm: 8,
  md: 12,
  lg: 24,
  pill: 999,
};
