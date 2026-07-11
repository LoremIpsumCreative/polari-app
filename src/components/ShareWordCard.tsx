import { forwardRef } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { IconBook2, IconQuote, IconStack2, IconWorldSearch } from '@tabler/icons-react-native';
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
// (frame art 545x968 at 10,20); colours are the design-token palette
// (neutral/1000 stage, neutral/200 field, neutral/900 body, neutral/250 lines).
export const CARD_WIDTH = 566;
export const CARD_HEIGHT = 1007;

const frameArt = require('../../assets/share/frame.png');
const qrArt = require('../../assets/share/qr-polari.png');

const STAGE = '#0E1D31'; // neutral/1000
const FIELD = '#DCDFE4'; // neutral/200
const BODY = '#172B4D'; // neutral/900
const META = '#2C3E5D'; // neutral/800
const MUTED = '#44546F'; // neutral/700
const LABEL = '#758195'; // neutral/500
const LINE = '#C8CCD4'; // neutral/250
const ROW = '#F8F9FA'; // neutral/50

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
        <Icon size={15} color={BODY} />
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
          <FieldRow label="origin" Icon={IconWorldSearch}>
            {word.origin}
          </FieldRow>
        ) : null}
        {word.cultural_context ? (
          <FieldRow label="culture" Icon={IconStack2}>
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
      {/* The frame art paints the arch cartouche; the date is bare text on it */}
      <Text style={styles.dateText}>{formatDate(date)}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  stage: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: STAGE,
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
    left: 53,
    top: 104,
    width: 460,
    height: 819,
    borderRadius: 30,
    backgroundColor: FIELD,
  },
  dateText: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontSize: 13,
    lineHeight: 14,
    letterSpacing: 0.5,
    color: STAGE,
    textTransform: 'capitalize',
  },
  lede: {
    position: 'absolute',
    top: 187,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 16,
    letterSpacing: 0.2,
    color: BODY,
  },
  term: {
    position: 'absolute',
    top: 233,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: fonts.semibold,
    fontSize: 40,
    lineHeight: 42,
    color: STAGE,
  },
  metaRow: {
    position: 'absolute',
    top: 278,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  metaDot: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: MUTED,
  },
  pron: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 13,
    letterSpacing: 0.3,
    color: META,
  },
  posChip: {
    borderWidth: 1,
    borderColor: META,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  posText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    lineHeight: 11,
    letterSpacing: 0.3,
    color: META,
    textTransform: 'capitalize',
  },
  character: {
    position: 'absolute',
    top: 327,
    alignSelf: 'center',
    width: 169,
    height: 226,
  },
  detailBox: {
    position: 'absolute',
    top: 570,
    alignSelf: 'center',
    width: 397,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 20,
    gap: 16,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 52,
    backgroundColor: ROW,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: LINE,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  fieldText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 15,
    letterSpacing: 0.3,
    color: BODY,
  },
  fieldTextItalic: {
    fontFamily: fonts.italic,
  },
  fieldLabelPatch: {
    position: 'absolute',
    top: -4,
    left: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  fieldLabel: {
    fontFamily: fonts.extrabold,
    fontSize: 7,
    lineHeight: 8,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: LABEL,
  },
  footer: {
    position: 'absolute',
    top: 836,
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
    color: MUTED,
  },
  footerSub: {
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.3,
    color: BODY,
    opacity: 0.7,
  },
  qr: {
    width: 47,
    height: 47,
  },
});
