import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { Word } from '../types/database';
import { ShareWordCard, CARD_WIDTH, CARD_HEIGHT } from './ShareWordCard';
import { shareWordCard } from '../lib/share';
import type { Palette } from '../lib/palette';
import { useThemedStyles } from '../lib/appearance';
import { radii, spacing, fonts } from '../lib/theme';

type Props = {
  word: Word;
  visible: boolean;
  onClose: () => void;
};

export function ShareWordModal({ word, visible, onClose }: Props) {
  const styles = useThemedStyles(makeStyles);
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);
  const { width: winW, height: winH } = useWindowDimensions();
  // Fit the full card between the top inset and the action buttons, and within
  // the screen width (the card is built at the Figma frame's native 566px).
  // The captured PNG is unaffected — view-shot snapshots the card's own
  // 566×1007 layout, not this scaled-down preview.
  const scale = Math.min(1, (winH - 260) / CARD_HEIGHT, (winW - 48) / CARD_WIDTH);

  async function handleShare() {
    setSharing(true);
    try {
      await shareWordCard(cardRef, word);
    } finally {
      setSharing(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={{ width: CARD_WIDTH * scale, height: CARD_HEIGHT * scale }}>
            <View style={{ transform: [{ scale }], transformOrigin: 'top left' }}>
              <ShareWordCard ref={cardRef} word={word} />
            </View>
          </View>
          <View style={styles.buttons}>
            <Pressable
              style={({ pressed }) => [styles.shareButton, pressed && styles.pressed]}
              onPress={handleShare}
              disabled={sharing}
            >
              <Text style={styles.shareText}>{sharing ? 'Sharing…' : 'Share card'}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
              onPress={onClose}
            >
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    sheet: {
      alignItems: 'center',
      gap: spacing.md,
    },
    buttons: {
      alignSelf: 'stretch',
      gap: spacing.sm,
    },
    shareButton: {
      backgroundColor: colors.primary,
      borderRadius: radii.md,
      paddingVertical: spacing.sm + 4,
      alignItems: 'center',
    },
    shareText: {
      color: '#fff',
      fontSize: 16,
      fontFamily: fonts.bold,
    },
    closeButton: {
      borderRadius: radii.md,
      backgroundColor: colors.surface,
      paddingVertical: spacing.sm + 4,
      alignItems: 'center',
    },
    closeText: {
      color: colors.text,
      fontSize: 15,
      fontFamily: fonts.semibold,
    },
    pressed: {
      opacity: 0.8,
    },
  });
