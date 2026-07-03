// Central design tokens — palette and type mirror the Finito app's design
// language (vivid #6600ff primary, Apple-style neutrals, Digitale type).
export const colors = {
  background: '#f5f5f7',
  surface: '#ffffff',
  primary: '#6600ff',
  primarySoft: '#efe6ff',
  accent: '#ff9500',
  accentSoft: '#fff3e0',
  text: '#1d1d1f',
  textMuted: 'rgba(29, 29, 31, 0.6)',
  border: 'rgba(29, 29, 31, 0.13)',
  danger: '#ff3b30',
};

export const fonts = {
  regular: 'Digitale-Regular',
  italic: 'Digitale-Italic',
  semibold: 'Digitale-Semibold',
  bold: 'Digitale-Bold',
  extrabold: 'Digitale-Extrabold',
};

// Subtle pride accent — the classic six-stripe flag, used as hairline gradients
export const prideStripes = ['#e40303', '#ff8c00', '#ffed00', '#008026', '#24408e', '#732982'] as const;

// Shared navigator header styling (Finito look: flat, background-coloured, Digitale)
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
  lg: 20,
};
