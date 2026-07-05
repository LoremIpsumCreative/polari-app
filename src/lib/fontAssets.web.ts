// Web font assets. Browsers render woff2 (smaller and faster than otf), so the
// web build uses these while native uses the otf files in fontAssets.ts. Metro
// resolves this ".web" file automatically when bundling for web.
export const fontAssets = {
  'Digitale-Regular': require('../../assets/fonts/Digitale-Regular.woff2'),
  'Digitale-Italic': require('../../assets/fonts/Digitale-Italic.woff2'),
  'Digitale-Semibold': require('../../assets/fonts/Digitale-Semibold.woff2'),
  'Digitale-Bold': require('../../assets/fonts/Digitale-Bold.woff2'),
  'Digitale-Extrabold': require('../../assets/fonts/Digitale-Extrabold.woff2'),
};
