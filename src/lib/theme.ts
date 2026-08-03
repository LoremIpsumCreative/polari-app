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
  // The account forms draw two distinct hairlines, both read off the 393x852
  // exports as exact 1px runs rather than antialiased blends: the form card's
  // edge and, one step lighter, the notched pill fields inside it.
  cardBorder: '#A4ACB9', // neutral/300 — Create Account / Change Password card edge
  pillBorder: '#B0B7C2', // neutral/350 — notched pill field outline
  // Curated-bundle card edges: the blue one reuses `primary`, these two are
  // the teal/700 and green/700 stops the Button/Bundles variants use.
  tealEdge: '#227D9B', // teal/700
  green: '#1F845A', // green/700
  greenSoft: '#EEFFF8', // green/50
  label: '#758195', // neutral/500 — fieldset labels
  inactive: '#8590A2', // neutral/400 — inactive segmented options
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
  danger: '#ED3241',
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

// On web the app is capped to a smartphone-sized column; the tab bar has to
// know the same width so it lines up with it. Note the bar does NOT pin to the
// viewport — 37a1f83 moved it to the foot of the DESIGN_HEIGHT column, because
// pinning floated it over the middle of the design on a short window and hid
// whatever the frame puts near the bottom. A window under 852 scrolls to it.
export const PHONE_MAX_WIDTH = 430;
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
