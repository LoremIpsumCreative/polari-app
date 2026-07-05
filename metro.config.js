// Extends Expo's default Metro config so `.woff2` files are treated as assets
// (Metro's default assetExts does not include woff2). The Digitale fonts ship as
// woff2, required from app/_layout.tsx.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

if (!config.resolver.assetExts.includes('woff2')) {
  config.resolver.assetExts.push('woff2');
}

module.exports = config;
