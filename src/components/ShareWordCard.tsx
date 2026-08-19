import { forwardRef } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import IconBook2 from '@tabler/icons-react-native/IconBook2';
import IconQuote from '@tabler/icons-react-native/IconQuote';
import IconWorldSearch from '@tabler/icons-react-native/IconWorldSearch';
import type { Word } from '../types/database';
import { colors, fonts } from '../lib/theme';
import { useCharacterArt } from '../lib/remoteArt';

// The visual card snapshotted and shared as an image — a pixel match of the
// revised Figma "Share Card" (node 1114:1089): a dark stage, the blue baroque
// frame with a date pill in its top arch, and on the grey field the lede, the
// term in Mouse Memoirs, a POS·pronunciation row, the illustration, three
// labelled fieldset rows (definition / in use / origin) in a white box, and a
// download CTA + QR footer.
//
// Built at the Figma stage's native 566x1007 so measurements transfer verbatim.
//
// DELIBERATELY NOT THEMED. This surface is snapshotted to an image and sent to
// someone else, so it must not vary with the sharer's appearance setting — two
// readers sharing the same word should produce the same card. It therefore
// keeps the static `colors` import while every other surface has moved to
// useColors(); that is a decision, not an oversight.
export const CARD_WIDTH = 566;
export const CARD_HEIGHT = 1007;

// The grey field the content sits on, in stage coordinates.
const FIELD = { x: 52, y: 104, w: 460, h: 819 };

const frameArt = require('../../assets/share/frame.png');
const qrArt = require('../../assets/share/qr-polari.png');

const STAGE = colors.ink;
const FIELD_BG = colors.canvas;
const BODY = colors.text;
const SLATE = colors.metaText; // POS/pronunciation + row meta
const MUTED = colors.chipGrey; // footer CTA
const LABEL = colors.label;
const LINE = colors.fieldBorder;
const BOX = colors.inset;
const ROW_ICON = '#B3B9C4';

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

// Fieldset row: white pill with a leading grey icon and a tiny uppercase label
// sitting on its top border.
function FieldRow({
  label,
  Icon,
  children,
  italic = false,
  minHeight,
}: {
  label: string;
  Icon: typeof IconBook2;
  children: string;
  italic?: boolean;
  minHeight: number;
}) {
  return (
    <View>
      <View style={[styles.fieldRow, { minHeight }]}>
        <Icon size={12} color={ROW_ICON} />
        <Text style={[styles.fieldText, italic && styles.fieldTextItalic]} numberOfLines={2}>
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
  ref,
) {
  const { artFor } = useCharacterArt();

  return (
    <View ref={ref} style={styles.stage} collapsable={false}>
      {/* Stage is a vertical gradient (Figma 1114:1089: #44546F → #0E1D31). */}
      <Svg style={StyleSheet.absoluteFill} width={CARD_WIDTH} height={CARD_HEIGHT}>
        <Defs>
          <LinearGradient id="shareStage" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.chipGrey} />
            <Stop offset="1" stopColor={STAGE} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={CARD_WIDTH} height={CARD_HEIGHT} fill="url(#shareStage)" />
      </Svg>

      {/* The frame sits BEHIND the field: the opaque grey field covers the
          frame's centre, so only its painted blue border shows around it. */}
      <Image source={frameArt} style={styles.frame} resizeMode="stretch" />

      <View style={styles.field}>
        <View style={styles.datePill}>
          <Text style={styles.date}>{formatDate(date)}</Text>
        </View>
        <Text style={styles.lede}>The Polari word of the day is:</Text>

        <Text style={styles.term} numberOfLines={1} adjustsFontSizeToFit>
          {word.term}
        </Text>

        {/* One meta row: type badge · part-of-speech badge · pronunciation
            (Figma 1114:1089 — the badge moved inline out of the top-left). */}
        <View style={styles.metaRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{word.entry_type === 'phrase' ? 'Phrase' : 'Word'}</Text>
          </View>
          {word.part_of_speech ? <Text style={styles.metaDot}>•</Text> : null}
          {word.part_of_speech ? (
            <View style={styles.posChip}>
              <Text style={styles.posText}>{word.part_of_speech}</Text>
            </View>
          ) : null}
          {word.pronunciation ? <Text style={styles.metaDot}>•</Text> : null}
          {word.pronunciation ? <Text style={styles.pron}>/{word.pronunciation}/</Text> : null}
        </View>

        <Image
          source={artFor(word.slug)}
          style={styles.character}
          resizeMode="contain"
          accessibilityLabel={`Illustration for ${word.term}`}
        />

        <View style={styles.detailBox}>
          <FieldRow label="definition" Icon={IconBook2} minHeight={53}>
            {word.definition}
          </FieldRow>
          {word.example ? (
            <FieldRow label="in use" Icon={IconQuote} italic minHeight={49}>
              {word.example}
            </FieldRow>
          ) : null}
          {word.origin ? (
            <FieldRow label="origin" Icon={IconWorldSearch} minHeight={60}>
              {word.origin}
            </FieldRow>
          ) : null}
        </View>

        <View style={styles.footer}>
          <View style={styles.footerText}>
            <Text style={styles.footerTitle}>Learn the lingo! Download Polari</Text>
            <Text style={styles.footerSub}>
              Discover a word a day through queer history’s secret coded language.
            </Text>
          </View>
          <Image source={qrArt} style={styles.qr} resizeMode="contain" />
        </View>
      </View>
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
    // Bleed 2px past the measured field so no grey ring of the frame's centre
    // peeks between the field and the border's inner edge.
    left: FIELD.x - 2,
    top: FIELD.y - 2,
    width: FIELD.w + 4,
    height: FIELD.h + 4,
    backgroundColor: FIELD_BG,
    borderRadius: 26,
  },
  datePill: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  date: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: STAGE,
    letterSpacing: 0.2,
  },
  lede: {
    position: 'absolute',
    top: 74,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: fonts.semibold,
    fontSize: 22,
    color: BODY,
  },
  badge: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 10,
    fontFamily: fonts.bold,
    letterSpacing: 0.3,
  },
  term: {
    position: 'absolute',
    top: 118,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontFamily: fonts.display,
    fontSize: 60,
    lineHeight: 56,
    color: BODY,
  },
  metaRow: {
    position: 'absolute',
    top: 182,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  posChip: {
    borderWidth: 1,
    borderColor: SLATE,
    borderRadius: 116,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  posText: { color: SLATE, fontSize: 10, fontFamily: fonts.bold, letterSpacing: 0.3 },
  metaDot: { color: SLATE, fontSize: 12, fontFamily: fonts.semibold },
  pron: { color: SLATE, fontSize: 12, fontFamily: fonts.semibold, letterSpacing: 0.3 },
  character: {
    position: 'absolute',
    top: 229,
    left: 146,
    width: 169,
    height: 226,
  },
  detailBox: {
    position: 'absolute',
    top: 466,
    left: 47,
    width: 367,
    backgroundColor: BOX,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 16,
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 18,
    gap: 12,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: LINE,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  fieldText: {
    flex: 1,
    color: BODY,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 15,
    letterSpacing: 0.2,
  },
  fieldTextItalic: { fontFamily: fonts.italic },
  fieldLabelPatch: {
    position: 'absolute',
    top: -5,
    left: 10,
    backgroundColor: colors.surface,
    paddingHorizontal: 4,
  },
  fieldLabel: {
    color: LABEL,
    fontFamily: fonts.extrabold,
    fontSize: 7,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    lineHeight: 8,
  },
  footer: {
    position: 'absolute',
    top: 732,
    left: 90,
    right: 90,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerText: { flex: 1 },
  footerTitle: { color: MUTED, fontFamily: fonts.bold, fontSize: 14 },
  footerSub: { color: BODY, fontFamily: fonts.bold, fontSize: 10, marginTop: 4, opacity: 0.7 },
  qr: { width: 47, height: 47 },
});
