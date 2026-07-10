// Central design tokens — matches the Figma "Polari" design (latest frame
// 1042-205): near-white canvas, brand blue --blue-polari (#143AD9) for the
// navbar/actions, soft blue chip fills, labelled grey fieldset rows on white
// cards. Type is Digitale.
export const colors = {
  background: '#EAEAEA',
  surface: '#FFFFFF',
  inset: '#FAFAFA', // recessed rows inside white cards (Figma definition/example rows)
  primary: '#143AD9',
  primarySoft: '#F0F1FF',
  accent: '#143AD9',
  accentSoft: '#F0F1FF',
  related: '#2898BD', // related-word chips (Figma 1042:186)
  relatedSoft: '#E7F9FF',
  chipGrey: '#888888', // part-of-speech chip + fieldset row borders/labels
  teal: '#27958A',
  tealSoft: '#DDEFEB',
  blush: '#E98F7F',
  blushSoft: '#FADFD8',
  text: '#1B1B1B',
  dark: '#1B1B1B', // dark stage backdrop (quiz intro, navbar)
  spotlight: '#F0ECE3', // cream spotlight ellipse on the quiz stage
  textMuted: '#646464',
  textFaint: '#7F7F7F',
  border: 'rgba(27, 27, 27, 0.12)',
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
