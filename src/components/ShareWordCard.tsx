import { forwardRef } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { IconBook2, IconQuote } from '@tabler/icons-react-native';
import type { Word } from '../types/database';
import { fonts } from '../lib/theme';
import { useCharacterArt } from '../lib/remoteArt';

// The visual card that gets snapshotted and shared as an image, rebuilt to match
// the Figma "Polari · Word of the day" share design (nodes 678-66 / 685-92 / 685-168):
// a duotone character bursting out of an accent-tinted hero band, the app's grey
// canvas below, a date pill, the term in the word's accent colour, a white detail
// card (badge + meta, definition and example rows), and a download CTA footer.
//
// 9:16 portrait — the story/reel format the Figma cards use (481×855 ≈ 0.563).
export const CARD_WIDTH = 340;
export const CARD_HEIGHT = 648;

// ── Per-word accent palette ────────────────────────────────────────────────
// The Figma cards give each word its own duotone accent (Abdabs = indigo, others
// blush / sage in the file). We rotate a small on-brand palette deterministically
// by sort_order so every word gets a stable colourway. Its own palette (not
// theme.ts) because the card is a branded artefact independent of in-app theming.
type Accent = {
  accent: string; // term + badge colour
  heroLight: string; // top of the hero band (duotone light)
  heroDeep: string; // bottom of the hero band (duotone shadow)
  tilt: string; // the tilted panel behind the character
};

const ACCENTS: Accent[] = [
  { accent: '#6A5A8C', heroLight: '#A79AB0', heroDeep: '#6E6088', tilt: '#B9ADC2' }, // indigo (ex.1)
  { accent: '#B4574A', heroLight: '#D3A79D', heroDeep: '#A55A4C', tilt: '#E2BDB4' }, // blush
  { accent: '#5F6E3E', heroLight: '#A7AF82', heroDeep: '#6E7A48', tilt: '#C2C79E' }, // sage
  { accent: '#27958A', heroLight: '#8FC1BA', heroDeep: '#3E8F86', tilt: '#B6D8D2' }, // teal
  { accent: '#2253DA', heroLight: '#9DB0E6', heroDeep: '#3E5FBE', tilt: '#BDC9EE' }, // brand blue
];

// Words with their own character art get an accent that harmonises with the
// illustration's dominant hue (derived by sampling each PNG), so the duotone hero
// and term colour sit with the character — exactly as the Figma cards pair them.
// Words still on the "coming soon" art fall back to a stable sort_order rotation.
const CHARACTER_ACCENT: Record<string, number> = {
  abdabs: 0, // indigo
  'antique-hp': 3, // teal
  aspro: 1, // blush
  auntie: 2, // sage
  'barkey-barkie-barky': 3, // teal
  beak: 1, // blush
  'blaz-queen': 1, // blush
  'glossy-glossies': 4, // blue
  queen: 1, // blush
  trade: 1, // blush
  'vada-varda': 4, // blue
};

export function accentForWord(word: Word): Accent {
  const mapped = CHARACTER_ACCENT[word.slug];
  const i =
    mapped ?? ((word.sort_order % ACCENTS.length) + ACCENTS.length) % ACCENTS.length;
  return ACCENTS[i];
}

const canvas = '#EAEAEA';
const cream = '#FAF3E7';

function stripEmphasis(text: string): string {
  return text.replace(/\*([^*]+)\*/g, '$1');
}

function formatDate(date: Date): string {
  // e.g. "Monday, 6 July 2026" — matches the Figma date pill.
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

type Props = { word: Word; date?: Date };

export const ShareWordCard = forwardRef<View, Props>(function ShareWordCard(
  { word, date = new Date() },
  ref
) {
  const c = accentForWord(word);
  const { artFor } = useCharacterArt();
  const art = artFor(word.slug);

  return (
    <View ref={ref} style={styles.card} collapsable={false}>
      {/* Hero band (duotone accent). The character sits in a sibling layer above
          so it can burst past the band onto the canvas, like the Figma. */}
      <View style={[styles.hero, { backgroundColor: c.heroLight }]}>
        <View style={[styles.heroShadow, { backgroundColor: c.heroDeep }]} />
      </View>

      {/* Soft echo of the character behind, for depth (full-colour + faded so it
          captures reliably on web, where tint/blend effects don't). */}
      <Image source={art} style={styles.ghost} resizeMode="contain" />
      {/* Tilted panel behind the character, as in the design. */}
      <View style={[styles.tilt, { backgroundColor: c.tilt }]} />
      <Image source={art} style={styles.character} resizeMode="contain" />

      {/* Stacked cream wordmark banner, top-left. */}
      <View style={styles.banner} pointerEvents="none">
        {['POLARI', 'WORD', 'OF THE', 'DAY'].map((line) => (
          <Text key={line} style={styles.bannerLine}>
            {line}
          </Text>
        ))}
      </View>

      {/* Content stack on the canvas, clearing the hero/character zone. */}
      <View style={styles.content}>
        <View style={styles.datePill}>
          <Text style={styles.dateText}>{formatDate(date)}</Text>
        </View>

        {/* No numberOfLines/adjustsFontSizeToFit here: both trigger react-native-web
            truncation CSS that collapses the line box to ~2px. An explicit lineHeight
            renders reliably and lets long phrases wrap to a second line. */}
        <Text style={[styles.term, { color: c.accent }]}>{word.term}</Text>

        <View style={styles.detailCard}>
          <View style={styles.metaRow}>
            <View style={[styles.badge, { borderColor: c.accent }]}>
              <Text style={[styles.badgeText, { color: c.accent }]}>
                {word.entry_type === 'phrase' ? 'Phrase' : 'Word'}
              </Text>
            </View>
            {word.part_of_speech ? (
              <Text style={styles.metaText}>{`·  ${word.part_of_speech}`}</Text>
            ) : null}
            {word.pronunciation ? (
              <Text style={styles.metaText}>{`·  /${word.pronunciation}/`}</Text>
            ) : null}
          </View>

          <View style={styles.insetRow}>
            <IconBook2 size={16} color={c.accent} />
            <Text style={styles.insetText} numberOfLines={3}>
              {stripEmphasis(word.definition)}
            </Text>
          </View>

          {word.example ? (
            <View style={styles.insetRow}>
              <IconQuote size={16} color={c.accent} />
              <Text style={[styles.insetText, styles.insetItalic]} numberOfLines={3}>
                {stripEmphasis(word.example)}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerTitle}>Learn the lingo! Download Polari</Text>
          <Text style={styles.footerSub}>
            Discover a word a day through queer history's secret coded language.
          </Text>
        </View>
      </View>
    </View>
  );
});

const HERO_H = 176;
const CHAR_TOP = 8;
const CHAR_H = 286;

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: canvas,
    borderRadius: 28,
    overflow: 'hidden',
  },
  hero: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HERO_H,
    justifyContent: 'flex-end',
  },
  heroShadow: {
    height: HERO_H * 0.34,
    opacity: 0.28,
  },
  ghost: {
    position: 'absolute',
    top: CHAR_TOP - 20,
    right: -60,
    width: 320,
    height: CHAR_H + 40,
    opacity: 0.16,
  },
  tilt: {
    position: 'absolute',
    top: 34,
    alignSelf: 'center',
    left: 96,
    width: 150,
    height: 200,
    borderRadius: 14,
    opacity: 0.85,
    transform: [{ rotate: '-9deg' }],
  },
  character: {
    position: 'absolute',
    top: CHAR_TOP,
    alignSelf: 'center',
    left: 40,
    width: 260,
    height: CHAR_H,
  },
  banner: {
    position: 'absolute',
    top: 18,
    left: 20,
  },
  bannerLine: {
    color: cream,
    fontFamily: fonts.extrabold,
    fontSize: 30,
    lineHeight: 31,
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    marginTop: CHAR_TOP + CHAR_H - 6, // sit below the character
    paddingHorizontal: 22,
    alignItems: 'center',
  },
  datePill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  dateText: {
    color: '#202020',
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  term: {
    fontFamily: fonts.extrabold,
    fontSize: 40,
    lineHeight: 44,
    marginTop: 12,
    marginBottom: 10,
    textAlign: 'center',
  },
  detailCard: {
    alignSelf: 'stretch',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  badge: {
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    letterSpacing: 0.3,
  },
  metaText: {
    color: '#7F7F7F',
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  insetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  insetText: {
    flex: 1,
    color: '#4A4A4A',
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  insetItalic: {
    fontFamily: fonts.italic,
    color: '#6A6A6A',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 10,
    paddingBottom: 16,
    alignItems: 'center',
  },
  footerTitle: {
    color: '#3A3A3A',
    fontFamily: fonts.bold,
    fontSize: 14,
    marginBottom: 4,
  },
  footerSub: {
    color: '#8A8A8A',
    fontFamily: fonts.regular,
    fontSize: 11.5,
    textAlign: 'center',
    lineHeight: 16,
  },
});
