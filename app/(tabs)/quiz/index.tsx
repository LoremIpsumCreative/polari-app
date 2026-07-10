import { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Svg, { Ellipse } from 'react-native-svg';
import { useWords } from '../../../src/lib/words';
import { useProgress } from '../../../src/lib/progress';
import { colors, radii, spacing, fonts } from '../../../src/lib/theme';

const quizmasterArt = require('../../../assets/quiz/quizmaster.png');
const shapeYellow = require('../../../assets/quiz/shape-yellow.png');
const shapeTeal = require('../../../assets/quiz/shape-teal.png');
const shapeRed = require('../../../assets/quiz/shape-red.png');

// "bona" gets a letter-by-letter pink→teal ramp, per the Figma heading
const BONA_COLORS = ['#F2789F', '#B77BE0', '#39C6C0', '#63D8A2'];

const SLIDE_MS = 700;
const SLIDE_STAGGER_MS = 200;
const EASE_OUT = Easing.out(Easing.cubic);

export default function QuizIntroScreen() {
  const router = useRouter();
  const { words, loading } = useWords();
  const { dueWordIds } = useProgress();
  const { width } = useWindowDimensions();

  // Stage geometry: spotlight ellipse sized to the screen like the Figma frame
  const stageWidth = Math.min(width, 430);
  const spotlightW = stageWidth * 0.92;
  const spotlightH = spotlightW * 1.22;

  const quizmasterOpacity = useRef(new Animated.Value(0)).current;
  const yellowSlide = useRef(new Animated.Value(1)).current; // 1 = off-screen, 0 = settled
  const tealSlide = useRef(new Animated.Value(1)).current;
  const redSlide = useRef(new Animated.Value(1)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const running = useRef<Animated.CompositeAnimation | null>(null);
  const [done, setDone] = useState(false);

  const playEntrance = useCallback(() => {
    setDone(false);
    quizmasterOpacity.setValue(0);
    yellowSlide.setValue(1);
    tealSlide.setValue(1);
    redSlide.setValue(1);
    textOpacity.setValue(0);

    // Spotlight is on stage from the first frame; then the quizmaster fades
    // in, the set pieces slide in one at a time, and the copy fades up last.
    const sequence = Animated.sequence([
      Animated.delay(100),
      Animated.timing(quizmasterOpacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.delay(100),
      Animated.stagger(SLIDE_STAGGER_MS, [
        Animated.timing(yellowSlide, {
          toValue: 0,
          duration: SLIDE_MS,
          easing: EASE_OUT,
          useNativeDriver: false,
        }),
        Animated.timing(tealSlide, {
          toValue: 0,
          duration: SLIDE_MS,
          easing: EASE_OUT,
          useNativeDriver: false,
        }),
        Animated.timing(redSlide, {
          toValue: 0,
          duration: SLIDE_MS,
          easing: EASE_OUT,
          useNativeDriver: false,
        }),
      ]),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]);

    running.current = sequence;
    sequence.start(({ finished }) => {
      if (finished) setDone(true);
    });
  }, [quizmasterOpacity, yellowSlide, tealSlide, redSlide, textOpacity]);

  function skipEntrance() {
    if (done) return;
    running.current?.stop();
    quizmasterOpacity.setValue(1);
    yellowSlide.setValue(0);
    tealSlide.setValue(0);
    redSlide.setValue(0);
    textOpacity.setValue(1);
    setDone(true);
  }

  // Replay the entrance every time the tab gains focus
  useFocusEffect(
    useCallback(() => {
      playEntrance();
      return () => running.current?.stop();
    }, [playEntrance])
  );

  return (
    <Pressable style={styles.stage} onPress={skipEntrance} accessibilityLabel="Quiz stage">
      <Animated.Text style={[styles.highScore, { opacity: textOpacity }]}>
        High score: 000
      </Animated.Text>

      <Animated.Text style={[styles.heading, { opacity: textOpacity }]}>
        How{' '}
        {BONA_COLORS.map((color, i) => (
          <Text key={i} style={{ color }}>
            {'bona'[i]}
          </Text>
        ))}{' '}
        is your Polari?
      </Animated.Text>

      <View style={[styles.spotlightWrap, { width: spotlightW, height: spotlightH }]}>
        <Svg width={spotlightW} height={spotlightH}>
          <Ellipse
            cx={spotlightW / 2}
            cy={spotlightH / 2}
            rx={spotlightW / 2}
            ry={spotlightH / 2}
            fill={colors.spotlight}
          />
        </Svg>

        <Animated.Image
          source={shapeYellow}
          resizeMode="contain"
          style={[
            styles.shapeYellow,
            {
              transform: [
                {
                  translateY: yellowSlide.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -720],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.Image
          source={shapeTeal}
          resizeMode="contain"
          style={[
            styles.shapeTeal,
            {
              transform: [
                {
                  translateX: tealSlide.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 520],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.Image
          source={shapeRed}
          resizeMode="contain"
          style={[
            styles.shapeRed,
            {
              transform: [
                {
                  translateX: redSlide.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -520],
                  }),
                },
              ],
            },
          ]}
        />

        <Animated.Image
          source={quizmasterArt}
          resizeMode="contain"
          style={[styles.quizmaster, { opacity: quizmasterOpacity }]}
        />
      </View>

      <Animated.View style={[styles.footer, { opacity: textOpacity }]}>
        <Pressable
          style={({ pressed }) => [styles.startButton, pressed && styles.startPressed]}
          onPress={() => router.push('/quiz/play')}
          disabled={loading || words.length < 4}
          accessibilityRole="button"
          accessibilityLabel="Start quiz"
        >
          <Text style={styles.startText}>{loading ? 'Loading…' : 'Start quiz'}</Text>
        </Pressable>
        {dueWordIds.length > 0 ? (
          <Pressable
            style={({ pressed }) => [styles.reviewButton, pressed && styles.startPressed]}
            onPress={() => router.push('/quiz/play?mode=review')}
            accessibilityRole="button"
            accessibilityLabel={`Review ${dueWordIds.length} words due for practice`}
          >
            <Text style={styles.reviewText}>
              Review {dueWordIds.length} due {dueWordIds.length === 1 ? 'word' : 'words'}
            </Text>
          </Pressable>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    backgroundColor: colors.dark,
    alignItems: 'center',
    overflow: 'hidden',
    paddingTop: spacing.xl + spacing.md,
  },
  highScore: {
    alignSelf: 'flex-end',
    marginRight: spacing.lg,
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 0.3,
    color: colors.onPrimary,
  },
  heading: {
    marginTop: spacing.md,
    fontFamily: fonts.semibold,
    fontSize: 22,
    color: colors.onPrimary,
    textAlign: 'center',
  },
  spotlightWrap: {
    marginTop: spacing.lg,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  shapeYellow: {
    position: 'absolute',
    width: '52%',
    height: '78%',
    left: '20%',
    top: '9%',
  },
  shapeTeal: {
    position: 'absolute',
    width: '62%',
    height: '38%',
    right: '4%',
    top: '10%',
  },
  shapeRed: {
    position: 'absolute',
    width: '40%',
    height: '38%',
    left: '4%',
    bottom: '10%',
  },
  quizmaster: {
    position: 'absolute',
    width: '68%',
    height: '78%',
    bottom: '7%',
  },
  footer: {
    marginTop: spacing.lg,
  },
  startButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xl * 2,
    paddingVertical: spacing.md - 2,
    minWidth: 200,
    alignItems: 'center',
  },
  reviewButton: {
    marginTop: 10,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(250, 243, 231, 0.5)",
    paddingHorizontal: 28,
    paddingVertical: 10,
    minWidth: 200,
    alignItems: "center",
  },
  reviewText: {
    color: "#FAF3E7",
    fontSize: 14,
    fontFamily: fonts.semibold,
  },
  startPressed: {
    opacity: 0.85,
  },
  startText: {
    color: colors.onPrimary,
    fontSize: 17,
    fontFamily: fonts.bold,
  },
});
