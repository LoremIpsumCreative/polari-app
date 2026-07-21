// Native (iOS/Android) font assets. expo-font on native loads the platform font
// engines, which expect otf/ttf — woff2 is a web-only format. Metro picks this
// file on native and fontAssets.web.ts on web, so each platform bundles only the
// font format it can actually use.
//
// Digitale is a variable family, and React Native offers no way to drive a
// variation axis from a style, so each weight alias registers the same variable
// file. The platform resolves an alias to that file's default instance, which
// for this family is Thin (wght 100) — native therefore needs static instances
// cut from the variable font before it will render the intended weights. Web
// pins the axis properly in CSS (see webFontFaces.web.ts).
const upright = require('../../assets/fonts/Digitale-Variable.ttf');
const italic = require('../../assets/fonts/Digitale-VariableItalic.ttf');

export const fontAssets = {
  'Digitale-Regular': upright,
  'Digitale-Semibold': upright,
  'Digitale-Bold': upright,
  'Digitale-Extrabold': upright,
  'Digitale-Italic': italic,
  'Digitale-BoldItalic': italic,
  // Display face for quiz headlines, mode chips and countdown titles.
  'MouseMemoirs-Regular': require('../../assets/fonts/MouseMemoirs-Regular.ttf'),
};
