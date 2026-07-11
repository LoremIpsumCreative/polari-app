// Central design tokens — matches the Figma "Polari" token palette (frames
// 1042-205 / 1058-1546): cool neutral canvas (neutral/200), navy ink
// (neutral/900), brand blue blue/700, soft blue fills, labelled neutral/50
// fieldset rows with neutral/250 hairlines. Type is Digitale.
export const colors = {
  background: '#DCDFE4', // neutral/200
  surface: '#FFFFFF', // neutral/0
  inset: '#F8F9FA', // neutral/50 — recessed fieldset rows
  primary: '#0C66E4', // blue/700
  primarySoft: '#F4F9FF', // blue/blue50
  accent: '#0C66E4',
  accentSoft: '#F4F9FF',
  related: '#2898BD', // teal/600 — related-word chips
  relatedSoft: '#F4FCFF', // teal/50
  chipGrey: '#44546F', // neutral/700 — part-of-speech chip
  fieldBorder: '#C8CCD4', // neutral/250 — fieldset row + pill hairlines
  label: '#758195', // neutral/500 — fieldset labels
  inactive: '#8590A2', // neutral/400 — inactive segmented options
  teal: '#27958A',
  tealSoft: '#DDEFEB',
  blush: '#E98F7F',
  blushSoft: '#FADFD8',
  text: '#172B4D', // neutral/900
  ink: '#0E1D31', // neutral/1000 — darkest ink (share stage)
  dark: '#1B1B1B', // dark stage backdrop (quiz intro)
  spotlight: '#F0ECE3', // cream spotlight ellipse on the quiz stage
  textMuted: '#44546F', // neutral/700
  textFaint: '#758195', // neutral/500
  border: 'rgba(23, 43, 77, 0.12)',
  danger: '#ED3241',
  heart: '#ED3241',
  onPrimary: '#FFFFFF',
};

export const fonts = {
  regular: 'Digitale-Regular',
  italic: 'Digitale-Italic',
  semibold: 'Digitale-Semibold',
  bold: 'Digitale-Bold',
  extrabold: 'Digitale-Extrabold',
};

// Shared navigator header styling (flat, canvas-coloured, Digitale)
export const headerOptions = {
  headerStyle: { backgroundColor: colors.background },
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

export const radii = {
  sm: 8,
  md: 12,
  lg: 24,
  pill: 999,
};
