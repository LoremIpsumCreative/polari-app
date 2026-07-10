import { forwardRef } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { IconBook2, IconQuote, IconWorld } from '@tabler/icons-react-native';
import type { Word } from '../types/database';
import { fonts } from '../lib/theme';
import { useCharacterArt } from '../lib/remoteArt';

// The visual card that gets snapshotted and shared as an image — a pixel match
// of the Figma "Share Card" (node 1058-1546): black story backdrop, the ornate
// baroque Polari frame, and on its grey field a date pill nestled in the arch,
// "The Polari word of the day is:", the term in ink, a part-of-speech chip •
// pronunciation row, the illustration, then the app's labelled fieldset rows
// (definition / in use / origin / culture) in a white box, and an underlined
// download CTA + QR footer.
//
// Built at the Figma stage's native 566x1007 so measurements transfer verbatim
// (frame art 545x968 at 10,20); colours sampled from the design exports.
export const CARD_WIDTH = 566;
export const CARD_HEIGHT = 1007;

const frameArt = require('../../assets/share/frame.png');
const qrArt = require('../../assets/share/qr-polari.png');

const INK = '#121212';
const FIELD = '#EAEAEA';

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

function FieldRow({
  label,
  Icon,
  children,
  italic = false,
}: {
  label: string;
  Icon: typeof IconBook2;
  children: string;
  italic?: boolean;
}) {
  return (
    <View>
      <View style={styles.fieldRow}>
        <Icon size={15} color={INK} />
        <Text style={[styles.fieldText, italic && styles.fieldTextItalic]}>
          {stripEmphasis(children)}
        </Text>
      </View>
      <View style={styles.fieldLabelPatch}>
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
    </View>
  );
}

type Props = { word: Word; date?: Date };

export const ShareWordCard = forwardRef<View, Props>(function ShareWordCard(
  { word, date = new Date() },
  ref
) {
  const { artFor } = useCharacterArt();

  return (
    <View ref={ref} style={styles.stage} collapsable={false}>
      {/* Grey field under the frame art; the painted frame masks its edges */}
      <View style={styles.field} />

      <Text style={styles.lede}>The Polari word of the day is:</Text>
      <Text style={styles.term}>{word.term}</Text>
      <View style={styles.metaRow}>
        {word.part_of_speech ? (
          <View style={styles.posChip}>
            <Text style={styles.posText}>{word.part_of_speech}</Text>
          </View>
        ) : null}
        {word.part_of_speech && word.pronunciation ? <Text style={styles.metaDot}>•</Text> : null}
        {word.pronunciation ? <Text style={styles.pron}>/{word.pronunciation}/</Text> : null}
      </View>

      <Image
        source={artFor(word.slug)}
        style={styles.character}
        resizeMode="contain"
        accessibilityLabel={`Illustration for ${word.term}`}
      />

      <View style={styles.detailBox}>
        <FieldRow label="definition" Icon={IconBook2}>
          {word.definition}
        </FieldRow>
        {word.example ? (
          <FieldRow label="in use" Icon={IconQuote} italic>
            {word.example}
          </FieldRow>
        ) : null}
        {word.origin ? (
          <FieldRow label="origin" Icon={IconWorld}>
            {word.origin}
          </FieldRow>
        ) : null}
        {word.cultural_context ? (
          <FieldRow label="culture" Icon={IconWorld}>
            {word.cultural_context}
          </FieldRow>
        ) : null}
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
    top: 176,
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
    color: INK,
  },
  metaRow: {
    position: 'absolute',
    top: 258,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  metaDot: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: INK,
  },
  pron: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 13,
    letterSpacing: 0.3,
    color: INK,
  },
  posChip: {
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
  detailBox: {
    position: 'absolute',
    top: 528,
    alignSelf: 'center',
    width: 387,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(170, 170, 170, 0.5)',
    borderRadius: 14,
    padding: 18,
    gap: 18,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 52,
    backgroundColor: '#FAFAFA',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#C9C9C9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  fieldText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 15,
    letterSpacing: 0.3,
    color: INK,
  },
  fieldTextItalic: {
    fontFamily: fonts.italic,
  },
  fieldLabelPatch: {
    position: 'absolute',
    top: -4,
    left: 7,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 2,
  },
  fieldLabel: {
    fontFamily: fonts.extrabold,
    fontSize: 7,
    lineHeight: 8,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: '#888888',
  },
  footer: {
    position: 'absolute',
    top: 838,
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
    color: '#143AD9',
    textDecorationLine: 'underline',
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
