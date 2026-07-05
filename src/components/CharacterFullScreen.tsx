import { Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import { IconX } from '@tabler/icons-react-native';
import type { ImageSourcePropType } from 'react-native';
import { colors, spacing } from '../lib/theme';

// Full-screen viewer for a word's character art. Tap anywhere (or the X)
// to dismiss.
export function CharacterFullScreen({
  source,
  visible,
  onClose,
  label,
}: {
  source: ImageSourcePropType;
  visible: boolean;
  onClose: () => void;
  label: string;
}) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close full screen view">
        <Image source={source} style={styles.art} resizeMode="contain" accessibilityLabel={label} />
        <View style={styles.closeButton}>
          <IconX size={26} color={colors.text} />
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  art: {
    width: '92%',
    height: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.xl + spacing.sm,
    right: spacing.lg,
    padding: spacing.xs,
  },
});
