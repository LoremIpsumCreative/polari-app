// Central design tokens — "atomic lounge": 1950s retro-modern illustration
// palette (cream paper, charcoal ink, mustard/teal/blush) with the clean,
// card-based layout language of the nobank reference. Type is Digitale.
export const colors = {
  background: '#FAF3E7', // cream paper
  surface: '#FFFFFF',
  primary: '#2B211E', // charcoal ink — buttons, active states (nobank-style pills)
  primarySoft: '#F1E6D4',
  accent: '#DE9A26', // mustard
  accentSoft: '#FAEDD2',
  teal: '#27958A',
  tealSoft: '#DDEfEB',
  blush: '#E98F7F', // dusty pink
  blushSoft: '#FADFD8',
  text: '#2B211E',
  textMuted: 'rgba(43, 33, 30, 0.62)',
  border: 'rgba(43, 33, 30, 0.14)',
  danger: '#C7402D', // retro poster red
};

export const fonts = {
  regular: 'Digitale-Regular',
  italic: 'Digitale-Italic',
  semibold: 'Digitale-Semibold',
  bold: 'Digitale-Bold',
  extrabold: 'Digitale-Extrabold',
};

// Shared navigator header styling (flat, paper-coloured, Digitale)
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
