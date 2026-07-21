// Web font assets. Digitale is now a variable family whose weight axis has to
// be pinned per alias — something expo-font's web loader cannot express, since
// it injects @font-face rules with no weight descriptor and the axis defaults
// to 100 (Thin). The web faces are therefore declared as CSS in
// webFontFaces.web.ts and served from public/fonts, leaving nothing for
// expo-font to load here.
export const fontAssets = {};
