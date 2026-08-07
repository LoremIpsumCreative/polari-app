import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import IconArrowsMaximize from '@tabler/icons-react-native/IconArrowsMaximize';
import IconChevronLeft from '@tabler/icons-react-native/IconChevronLeft';
import IconChevronRight from '@tabler/icons-react-native/IconChevronRight';
import { useWords } from '../../src/lib/words';
import { daysSinceEpoch, wordOfTheDay } from '../../src/lib/wordOfTheDay';
import { useCharacterArt } from '../../src/lib/remoteArt';
import { CharacterFullScreen } from '../../src/components/CharacterFullScreen';
import { WordDetailCard } from '../../src/components/WordDetailCard';
import { ScreenBackground } from '../../src/components/ScreenBackground';
import { useTabBarInset } from '../../src/components/AnimatedTabBar';
import { useAuth } from '../../src/lib/auth';
import { useStreaks } from '../../src/lib/streaks';
import { getUnlockedDate, setUnlockedToday, todayKey } from '../../src/lib/dailyUnlock';
import { useReducedMotion } from '../../src/lib/reducedMotion';
import { colors, fonts, spacing } from '../../src/lib/theme';
import { useDesignScale } from '../../src/lib/designScale';

const presentArt = require('../../assets/present.png');

const SWIPE_THRESHOLD = 48;
// The present screen's geometry lives in the Figma frame's 394-wide space
// (node 1114:1124) and scales with the device width.

// Today/New Word (Figma 1837:762): the present bounces once, then rests, on a
// 3.0s loop. Figma bakes the easing into samples taken every 100ms and plays
// them linear, so interpolating these arrays reproduces the curve exactly
// rather than approximating it with a bezier.
//
// Only the wrapper moves. The export's summary also lists width/height/offset
// tracks on the inner `present_polari` rectangle, but the file's own tracks for
// it are flat (238->238, 250.526->250.526, 0->0), so there is no second,
// compounding deformation to apply.
const BOUNCE = {
  duration: 3004.586,
  stops: [
    0, 0.03328, 0.06656, 0.09985, 0.13313, 0.16641, 0.19969, 0.23298, 0.26626, 0.29954, 0.33282,
    0.36611, 1,
  ],
  y: [0, 18.697, -23.596, -35.813, -41.823, -45, -44.515, -40.495, 3.784, 9.604, -0.598, 0, 0],
  scaleX: [1, 1.196, 1.007, 0.944, 0.961, 0.971, 0.969, 0.957, 1.147, 1.101, 0.994, 1, 1],
  scaleY: [1, 0.843, 1.006, 1.059, 1.041, 1.03, 1.032, 1.045, 0.887, 0.919, 1.005, 1, 1],
};

export default function TodayScreen() {
  const { session } = useAuth();
  const { recordEngagement, celebration, dismissCelebration } = useStreaks();
  const { words, loading, error, refetch } = useWords();
  const { artFor } = useCharacterArt();
  const s = useDesignScale();
  // The bar floats over the screen, so the scroll has to end above it by hand.
  const tabInset = useTabBarInset();

  // 0 = today, 1 = yesterday, … capped at the app's epoch so "previous"
  // never wraps into future words nobody has seen yet.
  const [dayOffset, setDayOffset] = useState(0);
  const [artFullScreen, setArtFullScreen] = useState(false);
  const maxOffset = Math.max(0, daysSinceEpoch(new Date()));

  // Today's word arrives gift-wrapped: the first visit each day shows a
  // present to tap open. null = still reading the stored unlock date.
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const presentFade = useRef(new Animated.Value(1)).current;
  // Drives the whole 3s cycle; the keyframe tables above carry the shape.
  const bounce = useRef(new Animated.Value(0)).current;
  const bouncing = useRef<Animated.CompositeAnimation | null>(null);
  const reduceMotion = useReducedMotion();

  const stopBounce = useCallback(() => {
    bouncing.current?.stop();
    bouncing.current = null;
    bounce.setValue(0);
  }, [bounce]);

  const startBounce = useCallback(() => {
    // Reduce Motion: the present simply sits there. Looping movement is the
    // clearest case for honouring the setting, since it never stops on its own.
    if (reduceMotion.current) return;
    bounce.setValue(0);
    const loop = Animated.loop(
      Animated.timing(bounce, {
        toValue: 1,
        duration: BOUNCE.duration,
        // Linear on purpose: the easing already lives in the sampled values.
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    );
    bouncing.current = loop;
    loop.start();
  }, [bounce, reduceMotion]);
  useFocusEffect(
    // Re-checked on every focus so the gift comes back after midnight even if
    // the app never re-mounted.
    useCallback(() => {
      let live = true;
      getUnlockedDate().then((d) => {
        if (!live) return;
        const wrapped = d !== todayKey();
        setUnlocked(!wrapped);
        if (wrapped) startBounce();
      });
      return () => {
        live = false;
        stopBounce();
      };
    }, [startBounce, stopBounce]),
  );

  function openPresent() {
    // Tap interrupts the bounce and hands over to Today/Definition.
    stopBounce();
    setUnlockedToday();
    Animated.timing(presentFade, {
      toValue: 0,
      duration: 260,
      useNativeDriver: false,
    }).start(() => {
      setUnlocked(true);
      presentFade.setValue(1);
    });
  }

  const viewedDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - dayOffset);
    return d;
  }, [dayOffset]);

  const word = useMemo(() => wordOfTheDay(words, viewedDate), [words, viewedDate]);

  // Viewing the Today screen is what keeps a streak alive (any day's word)
  useEffect(() => {
    if (session && word) {
      recordEngagement();
    }
  }, [session, word, recordEngagement]);

  // Milestone banners linger briefly, then bow out
  useEffect(() => {
    if (celebration === null) return;
    const t = setTimeout(dismissCelebration, 6000);
    return () => clearTimeout(t);
  }, [celebration, dismissCelebration]);

  // Slide-and-fade whenever the displayed day changes
  const transition = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef(dayOffset);
  useEffect(() => {
    if (lastOffset.current === dayOffset) return;
    const towardPast = dayOffset > lastOffset.current;
    lastOffset.current = dayOffset;
    transition.setValue(towardPast ? -24 : 24);
    Animated.spring(transition, {
      toValue: 0,
      useNativeDriver: false,
      friction: 8,
      tension: 80,
    }).start();
  }, [dayOffset, transition]);

  const goBackADay = () => setDayOffset((o) => Math.min(maxOffset, o + 1));
  const goForwardADay = () => setDayOffset((o) => Math.max(0, o - 1));

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesture) =>
        Math.abs(gesture.dx) > 16 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
      onPanResponderRelease: (_evt, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) goBackADay();
        else if (gesture.dx < -SWIPE_THRESHOLD) goForwardADay();
      },
    }),
  ).current;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error || !word) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Nanti luck — today&apos;s word wouldn&apos;t load.</Text>
        <Pressable style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (unlocked === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  // First visit of the day: the word is wrapped (Figma "New Word", 1114:1124)
  if (!unlocked) {
    return (
      <Animated.View style={[styles.screen, { opacity: presentFade }]}>
        <ScreenBackground />
        <Pressable
          style={styles.presentScreen}
          onPress={openPresent}
          accessibilityRole="button"
          accessibilityLabel="Open today's word"
        >
          {/* A single vibrant blue blob behind the headline (Rectangle 52,
              #579DFF, path verbatim from Figma 1837:762). The dark diamond that
              used to sit behind the present was removed in the redesign. */}
          <Svg
            pointerEvents="none"
            style={styles.presentShapes}
            width={394 * s}
            height={853 * s}
            viewBox="0 0 394 853"
          >
            <Path
              d="M2.46633 14.0717 C1.17916 6.72769 6.83023 0 14.2862 0 L274.645 0 C282.124 0 287.781 6.76697 286.455 14.1274 L271.684 96.1274 C270.654 101.842 265.681 106 259.874 106 L28.6583 106 C22.8301 106 17.8446 101.812 16.8384 96.0717 L2.46633 14.0717 Z"
              transform="translate(53, 177)"
              // Flat, not #579DFF at 11% — that composites over the canvas to
              // #D7E0EE, a grey-lavender, where the frame is this pale blue.
              fill="#DCEAFE"
            />
          </Svg>

          {/* The bounce rides the wrapper so the art itself stays untouched.
              Scale is about the centre, which is what Figma applies, and the
              translate is in unscaled units — RN composes the transform array
              the same way CSS does, scaling first and then moving. */}
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 72 * s,
              top: 341 * s,
              width: 250 * s,
              height: 238 * s,
              transform: [
                {
                  translateY: bounce.interpolate({
                    inputRange: [...BOUNCE.stops],
                    outputRange: BOUNCE.y.map((v) => v * s),
                  }),
                },
                {
                  scaleX: bounce.interpolate({
                    inputRange: [...BOUNCE.stops],
                    outputRange: [...BOUNCE.scaleX],
                  }),
                },
                {
                  scaleY: bounce.interpolate({
                    inputRange: [...BOUNCE.stops],
                    outputRange: [...BOUNCE.scaleY],
                  }),
                },
              ],
            }}
          >
            <Image
              source={presentArt}
              resizeMode="contain"
              style={{ width: '100%', height: '100%' }}
              accessibilityIgnoresInvertColors
            />
          </Animated.View>

          <Text
            style={[styles.presentHeadline, { top: 198 * s, fontSize: 34 * s, lineHeight: 34 * s }]}
          >
            A <Text style={styles.presentHighlight}>new word</Text> is ready{'\n'}to be opened!
          </Text>
          <Text style={[styles.presentTap, { top: 613 * s, fontSize: 16 * s }]}>Tap to open</Text>
        </Pressable>
      </Animated.View>
    );
  }

  const dateLabel =
    dayOffset === 0
      ? 'Today'
      : viewedDate.toLocaleDateString(undefined, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        });

  const art = artFor(word.slug);

  return (
    <View style={styles.screen}>
      <ScreenBackground />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: tabInset + spacing.xl }]}
        {...panResponder.panHandlers}
      >
        <Animated.View style={{ transform: [{ translateX: transition }] }}>
          <Image
            source={art}
            style={styles.hero}
            resizeMode="contain"
            accessibilityLabel={`Illustration for ${word.term}`}
          />
          <Pressable
            onPress={() => setArtFullScreen(true)}
            style={({ pressed }) => [styles.fullScreenButton, pressed && styles.pagerPressed]}
            accessibilityRole="button"
            accessibilityLabel="View character full screen"
            hitSlop={10}
          >
            <IconArrowsMaximize size={22} color={colors.textFaint} />
          </Pressable>
          <WordDetailCard word={word} compact />

          {/* Day selector sits in flow under the card (Figma 1114:1023, y920) */}
          <View style={styles.pagerPill}>
            <Pressable
              onPress={goBackADay}
              disabled={dayOffset >= maxOffset}
              style={({ pressed }) => [styles.pagerButton, pressed && styles.pagerPressed]}
              accessibilityRole="button"
              accessibilityLabel="Previous word of the day"
              accessibilityState={{ disabled: dayOffset >= maxOffset }}
              hitSlop={12}
            >
              <IconChevronLeft size={20} color={dayOffset >= maxOffset ? '#D9D9D9' : colors.text} />
            </Pressable>
            <Text style={styles.dateLabel}>{dateLabel}</Text>
            <Pressable
              onPress={goForwardADay}
              disabled={dayOffset === 0}
              style={({ pressed }) => [styles.pagerButton, pressed && styles.pagerPressed]}
              accessibilityRole="button"
              accessibilityLabel="Next word of the day"
              accessibilityState={{ disabled: dayOffset === 0 }}
              hitSlop={12}
            >
              <IconChevronRight size={20} color={dayOffset === 0 ? '#D9D9D9' : colors.text} />
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>

      <CharacterFullScreen
        source={art}
        visible={artFullScreen}
        onClose={() => setArtFullScreen(false)}
        label={`Illustration for ${word.term}`}
      />

      {celebration !== null ? (
        <Pressable
          style={styles.milestoneBanner}
          onPress={dismissCelebration}
          accessibilityRole="alert"
          accessibilityLabel={`${celebration} day streak milestone`}
        >
          <Text style={styles.milestoneText}>
            🔥 {celebration}-day streak — fantabulosa, ducky!
          </Text>
          <Text style={styles.milestoneSub}>
            {celebration % 7 === 0
              ? 'A streak freeze just landed in the bank. ❄️'
              : 'Keep vada-ing, one word a day.'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    // The Today canvas is one step lighter than the app background (Figma 1114:1023)
    backgroundColor: colors.canvas,
  },
  presentScreen: {
    flex: 1,
    alignItems: 'center',
  },
  presentShapes: { position: 'absolute', top: 0, left: 0 },
  presentHeadline: {
    position: 'absolute',
    fontFamily: fonts.display,
    color: colors.text,
    textAlign: 'center',
  },
  presentHighlight: {
    color: colors.primary,
  },
  presentTap: {
    position: 'absolute',
    fontFamily: fonts.semibold,
    color: colors.inactive,
  },
  container: {
    flex: 1,
  },
  content: {
    // Matches Figma 1114:1023: 14px side margins, character at y87, card at
    // y350. The 87 also keeps content clear of the status bar on device.
    paddingHorizontal: 14,
    paddingTop: 87,
    // paddingBottom comes from useTabBarInset at the call site — it has to
    // clear the floating day-selector pill and the navbar, whose height varies
    // with the device's safe-area inset.
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  hero: {
    width: 190,
    height: 253,
    alignSelf: 'center',
    // Card follows 10px below the character (Figma: art ends 340, card at 350)
    marginBottom: 10,
  },
  milestoneBanner: {
    position: 'absolute',
    top: spacing.md,
    alignSelf: 'center',
    backgroundColor: colors.dark,
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md - 4,
    alignItems: 'center',
    gap: 2,
    maxWidth: '88%',
  },
  milestoneText: {
    color: '#FAF3E7',
    fontFamily: 'Digitale-Bold',
    fontSize: 14,
  },
  milestoneSub: {
    color: '#B7B0CE',
    fontFamily: 'Digitale-Regular',
    fontSize: 12,
  },
  pagerPill: {
    // In flow, 10 below the card (Figma 1114:1023: card ends 910, pill at 920)
    marginTop: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 232,
    height: 46,
    backgroundColor: colors.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.fieldBorder,
    paddingHorizontal: 16,
  },
  fullScreenButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    padding: spacing.xs,
  },
  pagerButton: {
    padding: spacing.xs,
  },
  pagerPressed: {
    opacity: 0.6,
  },
  dateLabel: {
    fontFamily: 'Digitale-Regular',
    fontSize: 10,
    textAlign: 'center',
    color: colors.text,
    letterSpacing: 0.3,
  },
  errorText: {
    fontFamily: 'Digitale-Regular',
    fontSize: 16,
    color: colors.danger,
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryText: {
    color: colors.onPrimary,
    fontFamily: 'Digitale-Semibold',
  },
});
