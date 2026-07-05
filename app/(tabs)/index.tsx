import { useEffect, useMemo, useRef, useState } from 'react';
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
} from 'react-native';
import {
  IconArrowsMaximize,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react-native';
import { useWords } from '../../src/lib/words';
import { daysSinceEpoch, wordOfTheDay } from '../../src/lib/wordOfTheDay';
import { characterArtFor } from '../../src/lib/characterArt';
import { CharacterFullScreen } from '../../src/components/CharacterFullScreen';
import { WordDetailCard } from '../../src/components/WordDetailCard';
import { useAuth } from '../../src/lib/auth';
import { useStreaks } from '../../src/lib/streaks';
import { colors, spacing } from '../../src/lib/theme';

const SWIPE_THRESHOLD = 48;

export default function TodayScreen() {
  const { session } = useAuth();
  const { recordEngagement } = useStreaks();
  const { words, loading, error, refetch } = useWords();

  // 0 = today, 1 = yesterday, … capped at the app's epoch so "previous"
  // never wraps into future words nobody has seen yet.
  const [dayOffset, setDayOffset] = useState(0);
  const [artFullScreen, setArtFullScreen] = useState(false);
  const maxOffset = Math.max(0, daysSinceEpoch(new Date()));

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
        <Text style={styles.errorText}>Couldn't load today's word.</Text>
        <Pressable style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
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

  const art = characterArtFor(word.slug);

  return (
    <View style={styles.screen}>
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
          <WordDetailCard word={word} compact style={styles.card} />
        </Animated.View>
      </ScrollView>

      <Pressable
        onPress={() => setArtFullScreen(true)}
        style={({ pressed }) => [styles.fullScreenButton, pressed && styles.pagerPressed]}
        accessibilityRole="button"
        accessibilityLabel="View character full screen"
        hitSlop={10}
      >
        <IconArrowsMaximize size={22} color={colors.textFaint} />
      </Pressable>
      <CharacterFullScreen
        source={art}
        visible={artFullScreen}
        onClose={() => setArtFullScreen(false)}
        label={`Illustration for ${word.term}`}
      />

      {/* Floating day selector: pinned above the navbar so long cards
          scroll beneath it instead of pushing it off screen */}
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
            size={26}
            color={dayOffset >= maxOffset ? colors.border : colors.text}
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
          <IconChevronRight size={26} color={dayOffset === 0 ? colors.border : colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
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
    width: '100%',
    height: 280,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  card: {
    marginHorizontal: spacing.xs,
  },
  pagerPill: {
    position: 'absolute',
    bottom: spacing.md,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minWidth: 240,
    backgroundColor: colors.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  fullScreenButton: {
    position: 'absolute',
    top: spacing.md + spacing.xs,
    right: spacing.md + spacing.xs,
    padding: spacing.xs,
  },
  pagerButton: {
    padding: spacing.xs,
  },
  pagerPressed: {
    opacity: 0.6,
  },
  dateLabel: {
    fontFamily: 'Digitale-Semibold',
    fontSize: 13,
    color: colors.textFaint,
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
