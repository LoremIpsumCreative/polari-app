// Native (iOS/Android) font assets. expo-font on native loads the platform font
// engines, which expect otf/ttf — woff2 is a web-only format. Metro picks this
// file on native and fontAssets.web.ts on web, so each platform bundles only the
// font format it can actually use.
export const fontAssets = {
  'Digitale-Regular': require('../../assets/fonts/Digitale-Regular.otf'),
  'Digitale-Italic': require('../../assets/fonts/Digitale-Italic.otf'),
  'Digitale-Semibold': require('../../assets/fonts/Digitale-Semibold.otf'),
  'Digitale-Bold': require('../../assets/fonts/Digitale-Bold.otf'),
  'Digitale-Extrabold': require('../../assets/fonts/Digitale-Extrabold.otf'),
  // Display face for quiz headlines, mode chips and countdown titles.
  'MouseMemoirs-Regular': require('../../assets/fonts/MouseMemoirs-Regular.ttf'),
};
