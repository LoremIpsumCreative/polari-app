import { forwardRef } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { Word } from '../types/database';
import { fonts } from '../lib/theme';
import { useCharacterArt } from '../lib/remoteArt';

// The visual card that gets snapshotted and shared as an image — a pixel match
// of the Figma "Share Card" v4 (node 1058-1546): black story backdrop, the
// ornate baroque Polari frame, and content set directly on the frame's grey
// field — date pill, lede, the term in the word's character accent, its
// illustration, typographic sections (Definition / In Use / Origin / History)
// with navy labels, and a download CTA + QR footer.
//
// Built at the Figma stage's native 566x1007 so measurements transfer verbatim
// (frame art 545x968 at 10,20); colours sampled from the v4 export.
export const CARD_WIDTH = 566;
export const CARD_HEIGHT = 1007;

const frameArt = require('../../assets/share/frame.png');
const qrArt = require('../../assets/share/qr-polari.png');

const INK = '#121212';
const FIELD = '#EAEAEA';
const LABEL_NAVY = '#083C7C';

// Term colour keyed to each character's palette (sampled from the art); words
// without their own character fall back to ink, which matches the monochrome
// coming-soon easel.
const ACCENT_BY_SLUG: Record<string, string> = {
  abdabs: '#7A5C94',
  'antique-hp': '#27958A',
  aspro: '#B4574A',
  auntie: '#5F6E3E',
  'barkey-barkie-barky': '#27958A',
  beak: '#B4574A',
  'blaz-queen': '#B4574A',
  bull: '#143AD9',
  butch: '#B4574A',
  'charpering-omee': '#143AD9',
  'glossy-glossies': '#143AD9',
  queen: '#B4574A',
  trade: '#B4574A',
  'vada-varda': '#143AD9',
};

function stripEmphasis(text: string): string {
  return text.replace(/\*([^*]+)\*/g, '$1');
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function Section({ label, children }: { label: string; children: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <Text style={styles.sectionBody}>{stripEmphasis(children)}</Text>
    </View>
  );
}

type Props = { word: Word; date?: Date };

export const ShareWordCard = forwardRef<View, Props>(function ShareWordCard(
  { word, date = new Date() },
  ref
) {
  const { artFor } = useCharacterArt();
  const accent = ACCENT_BY_SLUG[word.slug] ?? INK;

  return (
    <View ref={ref} style={styles.stage} collapsable={false}>
      {/* Grey field under the frame art; the painted frame masks its edges */}
      <View style={styles.field} />

      <Text style={styles.lede}>Polari word of the day:</Text>
      <Text style={[styles.term, { color: accent }]}>{word.term}</Text>
      {word.pronunciation ? <Text style={styles.pron}>/{word.pronunciation}/</Text> : null}
      {word.part_of_speech ? (
        <View style={styles.posChip}>
          <Text style={styles.posText}>{word.part_of_speech}</Text>
        </View>
      ) : null}

      <Image
        source={artFor(word.slug)}
        style={styles.character}
        resizeMode="contain"
        accessibilityLabel={`Illustration for ${word.term}`}
      />

      <View style={styles.sections}>
        <Section label="Definition">{word.definition}</Section>
        {word.example ? <Section label="In Use">{word.example}</Section> : null}
        {word.origin ? <Section label="Origin">{word.origin}</Section> : null}
        {word.cultural_context ? <Section label="History">{word.cultural_context}</Section> : null}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerText}>
          <Text style={styles.footerTitle}>Learn the lingo! Download Polari</Text>
          <Text style={styles.footerSub}>
            Discover a word a day through queer history's secret coded language.
          </Text>
        </View>
        <Image source={qrArt} style={styles.qr} accessibilityLabel="Polari QR code" />
      </View>

      {/* Frame art last so its ornament overlaps the field and the date pill
          nestles into the arch */}
      <Image source={frameArt} style={styles.frame} resizeMode="stretch" pointerEvents="none" />
      <View style={styles.datePill}>
        <Text style={styles.dateText}>{formatDate(date)}</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  stage: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: INK,
  },
  frame: {
    position: 'absolute',
    left: 10,
    top: 20,
    width: 545,
    height: 968,
  },
  field: {
    position: 'absolute',
    left: 40,
    top: 65,
    width: 486,
    height: 878,
    borderRadius: 48,
    backgroundColor: FIELD,
  },
  datePill: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    backgroundColor: FIELD,
    borderWidth: 1,
    borderColor: INK,
    borderRadius: 999,
    paddingHorizontal: 26,
    paddingVertical: 9,
  },
  dateText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    lineHeight: 14,
    letterSpacing: 0.5,
    color: INK,
    textTransform: 'capitalize',
  },
  lede: {
    position: 'absolute',
    top: 172,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 20,
    lineHeight: 20,
    letterSpacing: 0.2,
    color: INK,
  },
  term: {
    position: 'absolute',
    top: 206,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontSize: 42,
    lineHeight: 44,
  },
  pron: {
    position: 'absolute',
    top: 256,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 17,
    letterSpacing: 0.3,
    color: INK,
  },
  posChip: {
    position: 'absolute',
    top: 282,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#7F7F7F',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  posText: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    lineHeight: 11,
    letterSpacing: 0.3,
    color: INK,
    textTransform: 'capitalize',
  },
  character: {
    position: 'absolute',
    top: 320,
    alignSelf: 'center',
    width: 236,
    height: 226,
  },
  sections: {
    position: 'absolute',
    top: 556,
    left: 94,
    right: 94,
    gap: 18,
  },
  section: {
    gap: 5,
  },
  sectionLabel: {
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 13,
    letterSpacing: 0.3,
    color: LABEL_NAVY,
    textTransform: 'capitalize',
  },
  sectionBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: 0.2,
    color: INK,
  },
  footer: {
    position: 'absolute',
    top: 826,
    left: 94,
    right: 94,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  footerText: {
    alignItems: 'center',
    gap: 5,
    maxWidth: 260,
  },
  footerTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 15,
    letterSpacing: 0.3,
    color: '#222222',
  },
  footerSub: {
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.3,
    color: '#000000',
    opacity: 0.7,
  },
  qr: {
    width: 42,
    height: 42,
  },
});
