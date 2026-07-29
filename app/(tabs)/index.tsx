import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import {
  IconArrowsMaximize,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react-native';
import { useWords } from '../../src/lib/words';
import { daysSinceEpoch, wordOfTheDay } from '../../src/lib/wordOfTheDay';
import { useCharacterArt } from '../../src/lib/remoteArt';
import { CharacterFullScreen } from '../../src/components/CharacterFullScreen';
import { WordDetailCard } from '../../src/components/WordDetailCard';
import { ScreenBackground } from '../../src/components/ScreenBackground';
import { useAuth } from '../../src/lib/auth';
import { useStreaks } from '../../src/lib/streaks';
import { getUnlockedDate, setUnlockedToday, todayKey } from '../../src/lib/dailyUnlock';
import { colors, fonts, spacing, DESIGN_WIDTH } from '../../src/lib/theme';

const presentArt = require('../../assets/present.png');

const SWIPE_THRESHOLD = 48;
// The present screen's geometry lives in the Figma frame's 394-wide space
// (node 1114:1124) and scales with the device width.

export default function TodayScreen() {
  const { session } = useAuth();
  const { recordEngagement, celebration, dismissCelebration } = useStreaks();
  const { words, loading, error, refetch } = useWords();
  const { artFor } = useCharacterArt();
  const { width } = useWindowDimensions();
  const s = Math.min(width, 430) / DESIGN_WIDTH;

  // 0 = today, 1 = yesterday, … capped at the app's epoch so "previous"
  // never wraps into future words nobody has seen yet.
  const [dayOffset, setDayOffset] = useState(0);
  const [artFullScreen, setArtFullScreen] = useState(false);
  const maxOffset = Math.max(0, daysSinceEpoch(new Date()));

  // Today's word arrives gift-wrapped: the first visit each day shows a
  // present to tap open. null = still reading the stored unlock date.
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const presentFade = useRef(new Animated.Value(1)).current;
  useFocusEffect(
    // Re-checked on every focus so the gift comes back after midnight even if
    // the app never re-mounted.
    useCallback(() => {
      let live = true;
      getUnlockedDate().then((d) => {
        if (live) setUnlocked(d === todayKey());
      });
      return () => {
        live = false;
      };
    }, [])
  );

  function openPresent() {
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
    })
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
        <Text style={styles.errorText}>Nanti luck — today's word wouldn't load.</Text>
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
              fill="#579DFF"
              fillOpacity={0.11}
            />
          </Svg>

          <Image
            source={presentArt}
            resizeMode="contain"
            style={{ position: 'absolute', left: 72 * s, top: 341 * s, width: 250 * s, height: 238 * s }}
            accessibilityIgnoresInvertColors
          />

          <Text style={[styles.presentHeadline, { top: 198 * s, fontSize: 34 * s, lineHeight: 34 * s }]}>
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
        contentContainerStyle={styles.content}
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
              <IconChevronLeft
                size={20}
                color={dayOffset >= maxOffset ? '#D9D9D9' : colors.text}
              />
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
    backgroundColor: '#E7E9EC',
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
    // Clear the floating day-selector pill and the navbar bubble
    paddingBottom: spacing.xl + 96,
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
