// Dark mode, read straight off the Figma "Semantic" variable collection's Dark
// mode (61 tokens, Light/Dark). Every entry below is quoted with the token it
// came from, so a token change in Figma has one obvious landing place here.
//
// This is an OVERRIDE map, not a second palette: only keys the Semantic
// collection actually defines a Dark value for appear. Anything absent keeps
// its light value on purpose — see UNTOKENISED at the bottom for the list and
// why each one is still outstanding.
import { colors, tabAccents } from './theme';

export type Palette = typeof colors;
export type Scheme = 'light' | 'dark';

export const lightColors: Palette = colors;

const darkOverrides: Partial<Palette> = {
  // Background/*
  canvas: '#1A1A1A', // Background/App Background
  background: '#0E1D31', // Background/Canvas ← Neutral/1000
  surface: '#242424', // Background/Surface
  inset: 'rgba(90, 90, 90, 0.4)', // Background/Inset — #5A5A5A @40%
  pattern: '#272727', // Background/Pattern ← Pattern/Dark
  navbar: '#151515', // Background/Navbar

  // Text/*
  text: '#F8F9FA', // Text/Default ← Neutral/50
  ink: '#F8F9FA', // Text/Inkish ← Neutral/50
  textMuted: '#B3B9C4', // Text/Muted ← Neutral/300
  textFaint: '#8590A2', // Text/Faint ← Neutral/400
  label: '#8590A2', // Text/Label ← Neutral/400
  inactive: '#626F86', // Text/Inactive ← Neutral/600
  chipGrey: '#B3B9C4', // part-of-speech chip rides Text/Muted
  onPrimary: '#FFFFFF', // Text/Persistent/White — same in both modes

  // Border/*
  fieldBorder: '#44546F', // Border/Field ← Neutral/700
  pillBorder: '#44546F', // Border/Field — the notched pill outline
  // Light is ink at 12%; dark inverts to paper at 12%.
  border: 'rgba(248, 249, 250, 0.12)',

  // Brand + accents
  primary: '#579DFF', // Brand/Primary ← Blue/400
  accent: '#579DFF', // Brand/Primary
  primarySoft: 'rgba(12, 102, 228, 0.2)', // Button/List/Fill/Variation 1
  accentSoft: 'rgba(12, 102, 228, 0.2)', // Button/List/Fill/Variation 1
  related: '#6CC3E0', // Accent/Account ← Teal/400
  relatedSoft: 'rgba(34, 125, 155, 0.2)', // Button/List/Fill/Variation 2
  tealEdge: '#6CC3E0', // Button/List/Stroke/Variation 2
  green: '#2ABB7F', // Button/List/Stroke/Variation 3 ← Green/500
  greenSoft: 'rgba(34, 160, 107, 0.2)', // Button/List/Fill/Variation 3

  // Status
  danger: '#F15B50', // Status/Danger ← Red/500
  heart: '#F15B50', // Status/Danger

  // Quiz feedback
  correct: '#B3DF72', // Feedback/Correct Stroke ← Lime/300
  correctSoft: '#425923', // Feedback/Correct Fill ← Lime/850
  incorrect: '#FD9891', // Feedback/Incorrect Stroke ← Red/300
  incorrectSoft: '#852620', // Feedback/Incorrect Fill ← Red/850
  quizPurple: '#9F8FEF', // Accent/Quiz ← Purple/400
};

export const darkColors: Palette = { ...colors, ...darkOverrides };

export const paletteFor = (scheme: Scheme): Palette =>
  scheme === 'dark' ? darkColors : lightColors;

// Accent/* Dark values, keyed by expo-router route name to match `tabAccents`.
const darkTabAccents: Record<string, string> = {
  index: '#579DFF', // Accent/Today → Brand/Primary ← Blue/400
  dictionary: '#94C748', // Accent/Dictionary ← Lime/400
  favourites: '#E774BB', // Accent/Collections ← Magenta/400
  quiz: '#9F8FEF', // Accent/Quiz ← Purple/400
  profile: '#6CC3E0', // Accent/Account ← Teal/400
};

export const tabAccentsFor = (scheme: Scheme): Record<string, string> =>
  scheme === 'dark' ? darkTabAccents : tabAccents;

// UNTOKENISED — deliberately unchanged in dark mode, each for a stated reason.
// Add a Semantic token in Figma and these become one-line entries above.
//
//   cardBorder / pillBorder                the form card edge and the notched
//                                          pill are bound to Neutral/600 too —
//                                          see optionBorder below, same story
//   optionBorder / disabledFill            the Account row hairline and the
//                                          disabled badge are bound in Figma
//                                          straight to primitives (Neutral/600,
//                                          Neutral/100), and primitives are
//                                          single-mode — so they are the same
//                                          in both schemes BY CONSTRUCTION, not
//                                          by omission. Worth confirming that
//                                          is deliberate rather than a missed
//                                          semantic binding.
//   stage / stageDeep / spotlight / dark   the quiz intro stage is already a
//                                          dark surface in both modes
//   progressTrack / progressFill /         quiz progress rail — no Semantic
//   progressBorder / metaText              token exists for it yet
//   quizPurpleDark / quizInk               mode-chip border + label, same
//   teal / tealSoft / blush / blushSoft    legacy stops, no current consumer
//                                          bound to a token
