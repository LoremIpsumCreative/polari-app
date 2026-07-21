// Native (iOS/Android) font assets. expo-font on native loads the platform font
// engines, which expect otf/ttf — woff2 is a web-only format. Metro picks this
// file on native and fontAssets.web.ts on web, so each platform bundles only the
// font format it can actually use.
//
// These are the static cuts rather than the variable family: React Native has no
// way to drive a variation axis from a style, so a variable file would resolve
// to its default instance (Thin, wght 100) for every weight. Web pins the axis
// in CSS instead — see webFontFaces.web.ts — and the two render identically,
// the static cuts and the variable instances sharing the same metrics.
export const fontAssets = {
  'Digitale-Regular': require('../../assets/fonts/Digitale-Regular.otf'),
  'Digitale-Italic': require('../../assets/fonts/Digitale-Italic.otf'),
  'Digitale-Semibold': require('../../assets/fonts/Digitale-Semibold.otf'),
  'Digitale-SemiboldItalic': require('../../assets/fonts/Digitale-SemiboldItalic.otf'),
  'Digitale-Bold': require('../../assets/fonts/Digitale-Bold.otf'),
  'Digitale-BoldItalic': require('../../assets/fonts/Digitale-BoldItalic.otf'),
  'Digitale-Extrabold': require('../../assets/fonts/Digitale-Extrabold.otf'),
  // Display face for quiz headlines, mode chips and countdown titles.
  'MouseMemoirs-Regular': require('../../assets/fonts/MouseMemoirs-Regular.ttf'),
};
