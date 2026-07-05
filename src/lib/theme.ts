// Central design tokens — matches the Figma "Polari" design (node 572-276):
// near-white canvas, vivid blue brand (#2253DA) for the navbar/actions,
// soft blue chip fills, inset grey rows on white cards. Type is Digitale.
export const colors = {
  background: '#EAEAEA',
  surface: '#FFFFFF',
  inset: '#FAFAFA', // recessed rows inside white cards (Figma definition/example rows)
  primary: '#2253DA',
  primarySoft: '#F0F1FF',
  accent: '#2253DA',
  accentSoft: '#F0F1FF',
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
