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

module.exports = config;
