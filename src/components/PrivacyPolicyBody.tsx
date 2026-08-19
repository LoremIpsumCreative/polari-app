import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { PRIVACY_POLICY, PRIVACY_LAST_UPDATED, type PolicySpan } from '../content/privacyPolicy';
import { colors, fonts } from '../lib/theme';
import { useDesignScale } from '../lib/designScale';

// The policy itself, in the scrolling card both the onboarding gate and the
// Account screen draw. Neither owns the text; they differ only in what sits
// around it, so this component is the single place the policy is rendered.

// How close to the foot counts as "read it". A few pixels of slack, because a
// scroll view rarely lands exactly on its content height — momentum, rounding
// and the rubber band all leave it a fraction short, and a gate that never
// opens is worse than one that opens a line early.
const BOTTOM_SLACK = 24;

function Spans({ spans, style }: { spans: PolicySpan[]; style: object }) {
  return (
    <Text style={style}>
      {spans.map((span, i) => {
        if (span.href) {
          return (
            <Text
              key={i}
              style={styles.link}
              accessibilityRole="link"
              onPress={() => {
                // Bare addresses in the document are written without a scheme.
                const target = /^(https?:|tel:|mailto:)/.test(span.href!)
                  ? span.href!
                  : `mailto:${span.href}`;
                Linking.openURL(target);
              }}
            >
              {span.text}
            </Text>
          );
        }
        return (
          <Text key={i} style={span.bold ? styles.bold : undefined}>
            {span.text}
          </Text>
        );
      })}
    </Text>
  );
}

export function PrivacyPolicyBody({
  onReachedEnd,
  contentPadding = 0,
}: {
  /** Fires once the reader has scrolled to the foot of the policy. */
  onReachedEnd?: () => void;
  contentPadding?: number;
}) {
  const s = useDesignScale();

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    if (!onReachedEnd) return;
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - BOTTOM_SLACK) {
      onReachedEnd();
    }
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={{ padding: 16 * s, paddingBottom: 16 * s + contentPadding }}
      onScroll={handleScroll}
      // 16/s: often enough to catch the foot without a scroll listener firing
      // on every frame.
      scrollEventThrottle={16}
      // A policy short enough not to scroll is still a policy that has been
      // read, so the gate has to open on layout as well as on scroll.
      onContentSizeChange={(_w, h) => {
        if (onReachedEnd && h <= 0) onReachedEnd();
      }}
    >
      <Text style={[styles.updated, { fontSize: 11 * s }]}>
        Last updated: {PRIVACY_LAST_UPDATED}
      </Text>
      {PRIVACY_POLICY.map((block, i) => {
        if (block.kind === 'heading') {
          return (
            <Text
              key={i}
              accessibilityRole="header"
              style={[
                block.level === 2 ? styles.h2 : styles.h3,
                { fontSize: (block.level === 2 ? 14 : 13) * s, marginTop: 18 * s },
              ]}
            >
              {block.text}
            </Text>
          );
        }
        if (block.kind === 'bullet') {
          return (
            <View key={i} style={[styles.bulletRow, { marginTop: 6 * s }]}>
              <Text style={[styles.body, { fontSize: 13 * s, lineHeight: 19 * s }]}>{'• '}</Text>
              <Spans
                spans={block.spans}
                style={[styles.body, styles.bulletText, { fontSize: 13 * s, lineHeight: 19 * s }]}
              />
            </View>
          );
        }
        return (
          <Spans
            key={i}
            spans={block.spans}
            style={[styles.body, { fontSize: 13 * s, lineHeight: 19 * s, marginTop: 10 * s }]}
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  updated: {
    textAlign: 'right',
    fontFamily: fonts.bold,
    color: colors.text,
  },
  h2: { fontFamily: fonts.bold, color: colors.text },
  h3: { fontFamily: fonts.bold, color: colors.text },
  body: { fontFamily: fonts.regular, color: colors.text },
  bold: { fontFamily: fonts.bold },
  link: { fontFamily: fonts.semibold, color: colors.primary, textDecorationLine: 'underline' },
  bulletRow: { flexDirection: 'row' },
  bulletText: { flex: 1 },
});
