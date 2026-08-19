import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import IconChevronLeft from '@tabler/icons-react-native/IconChevronLeft';
import { colors, fonts, radii } from '../../../src/lib/theme';
import { useDesignScale } from '../../../src/lib/designScale';
import { ScreenBackground } from '../../../src/components/ScreenBackground';
import { PrivacyPolicyBody } from '../../../src/components/PrivacyPolicyBody';
import { useTabBarInset } from '../../../src/components/AnimatedTabBar';

// Account/Privacy Policy (Figma 4209:4044). The same policy the onboarding gate
// shows, minus the gate: a back chip to Account and no I agree, because by the
// time it is reachable from here it has already been agreed to.
//
// The route is /profile/privacy — the slug the change request asked for.
const CARD = { left: 27, top: 145, width: 339, radius: 12 };

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const s = useDesignScale();
  const tabInset = useTabBarInset();

  return (
    <View style={styles.screen}>
      <ScreenBackground />

      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))}
        style={({ pressed }) => [
          styles.backChip,
          { left: 20 * s, top: 51 * s, height: 28 * s, paddingHorizontal: 12 * s, gap: 4 * s },
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Back to Account"
      >
        <IconChevronLeft size={10 * s} color={colors.text} />
        <Text style={[styles.backChipText, { fontSize: 10 * s }]}>Account</Text>
      </Pressable>

      <Text style={[styles.title, { top: 84 * s, fontSize: 28 * s, lineHeight: 30 * s }]}>
        Privacy Policy
      </Text>

      <View
        style={[
          styles.card,
          {
            left: CARD.left * s,
            top: CARD.top * s,
            width: CARD.width * s,
            borderRadius: CARD.radius * s,
            bottom: tabInset + 16 * s,
          },
        ]}
      >
        <PrivacyPolicyBody />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  backChip: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 999,
    zIndex: 1,
  },
  backChipText: { fontFamily: fonts.bold, color: colors.text },
  pressed: { opacity: 0.8 },
  title: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: fonts.display,
    color: colors.text,
  },
  card: {
    position: 'absolute',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.fieldBorder,
    overflow: 'hidden',
    borderCurve: 'continuous',
    ...({ borderRadius: radii.md } as object),
  },
});
