// Extends Expo's default Metro config so the launch animation's video exports
// are treated as assets — Metro's default assetExts carries neither .mov nor
// .webm.
//
// The animation ships twice because no single codec carries alpha across both
// engine families: HEVC-with-alpha (.mov) for AVFoundation and Safari,
// VP9-with-alpha (.webm) for Chrome and Android. See LaunchAnimation.
//
// `woff2` was registered here too until the fonts moved off the bundler. Web
// now serves the variable faces as CSS from public/fonts
// (src/lib/webFontFaces.web.ts) and native loads otf/ttf through expo-font, so
// no woff2 reaches Metro and the entry would be inert.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

for (const ext of ['mov', 'webm']) {
  if (!config.resolver.assetExts.includes(ext)) {
    config.resolver.assetExts.push(ext);
  }
}

// SVGs compile to react-native-svg components rather than being copied as
// image assets, so the provider brand marks (src/components/brand) can be
// sized and laid out like any other icon. This moves `svg` from assetExts to
// sourceExts — it has to leave assetExts or Metro keeps treating it as a file
// to bundle and the transformer never sees it.
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

module.exports = config;
