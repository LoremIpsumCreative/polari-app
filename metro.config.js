// Extends Expo's default Metro config so `.woff2` files are treated as assets
// (Metro's default assetExts does not include woff2). The Digitale fonts ship as
// woff2, required from app/_layout.tsx.
//
// `.mov` and `.webm` join them for the launch animation: native plays it as a
// transparent video, and that has to ship twice because no single codec carries
// alpha across both engine families — HEVC-with-alpha for Apple, VP9-with-alpha
// for the rest. See LaunchAnimation.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

for (const ext of ['woff2', 'mov', 'webm']) {
  if (!config.resolver.assetExts.includes(ext)) {
    config.resolver.assetExts.push(ext);
  }
}

module.exports = config;
