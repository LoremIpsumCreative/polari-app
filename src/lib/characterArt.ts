import type { ImageSourcePropType } from 'react-native';

// Hand-drawn character art, keyed by word slug. Words without their own
// character yet fall back to the "coming soon" easel character.
const CHARACTER_ART: Record<string, ImageSourcePropType> = {
  abdabs: require('../../assets/characters/abdabs.png'),
  'antique-hp': require('../../assets/characters/antique-hp.png'),
  aspro: require('../../assets/characters/aspro.png'),
  auntie: require('../../assets/characters/auntie.png'),
  barkey: require('../../assets/characters/barkey.png'),
  beak: require('../../assets/characters/beak.png'),
  // Slug follows the dictionary ('Blazé queen' -> blaze-queen); the bundled
  // file keeps its original name.
  'blaze-queen': require('../../assets/characters/blaz-queen.png'),
  glossy: require('../../assets/characters/glossy.png'),
  queen: require('../../assets/characters/queen.png'),
  trade: require('../../assets/characters/trade.png'),
  vada: require('../../assets/characters/vada.png'),
};

export const COMING_SOON_ART: ImageSourcePropType = require('../../assets/characters/coming-soon.png');

export function characterArtFor(slug: string): ImageSourcePropType {
  return CHARACTER_ART[slug] ?? COMING_SOON_ART;
}

export function hasCharacterArt(slug: string): boolean {
  return slug in CHARACTER_ART;
}

// Every word slug with its own finished character, for the Gallery grid.
export const CHARACTER_SLUGS: string[] = Object.keys(CHARACTER_ART);
