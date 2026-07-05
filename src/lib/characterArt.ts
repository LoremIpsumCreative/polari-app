import type { ImageSourcePropType } from 'react-native';

// Hand-drawn character art, keyed by word slug. Words without their own
// character yet fall back to the "coming soon" easel character.
const CHARACTER_ART: Record<string, ImageSourcePropType> = {
  abdabs: require('../../assets/characters/abdabs.png'),
  'antique-hp': require('../../assets/characters/antique-hp.png'),
  aspro: require('../../assets/characters/aspro.png'),
  auntie: require('../../assets/characters/auntie.png'),
  'barkey-barkie-barky': require('../../assets/characters/barkey-barkie-barky.png'),
  beak: require('../../assets/characters/beak.png'),
  'blaz-queen': require('../../assets/characters/blaz-queen.png'),
  'glossy-glossies': require('../../assets/characters/glossy-glossies.png'),
  queen: require('../../assets/characters/queen.png'),
  trade: require('../../assets/characters/trade.png'),
  'vada-varda': require('../../assets/characters/vada-varda.png'),
};

export const COMING_SOON_ART: ImageSourcePropType = require('../../assets/characters/coming-soon.png');

export function characterArtFor(slug: string): ImageSourcePropType {
  return CHARACTER_ART[slug] ?? COMING_SOON_ART;
}

export function hasCharacterArt(slug: string): boolean {
  return slug in CHARACTER_ART;
}
