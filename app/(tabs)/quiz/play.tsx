import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { IconChevronLeft, IconFlame, IconTrophy } from '@tabler/icons-react-native';
import { useWords } from '../../../src/lib/words';
import { useProgress } from '../../../src/lib/progress';
import { useQuizStats } from '../../../src/lib/quizScores';
import { useCharacterArt } from '../../../src/lib/remoteArt';
import { nextQuestion, QUIZ_LENGTH, type QuizQuestion } from '../../../src/lib/quiz';
import { QUIZ_MODES, isQuizModeId, type QuizModeId } from '../../../src/lib/quizModes';
import { colors, fonts } from '../../../src/lib/theme';

// All geometry lives in the Figma frames' 394-wide design space and is scaled
// by the device width, so the screens reproduce the mockups proportionally.
const DESIGN_WIDTH = 394;

// Match-pair palette in pairing order: yellow, blue, green, pink
// (Figma "Match Word to Definition", frame 1353:439).
const PAIR_STYLES = [
  { fill: '#FFFBEC', ink: '#B38600' },
  { fill: '#F4F9FF', ink: '#1D7AFC' },
  { fill: '#F7FFEC', ink: '#5B7F24' },
  { fill: '#FFF6FC', ink: '#CD519D' },
] as const;

export default function QuizPlayScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const s = Math.min(width, 430) / DESIGN_WIDTH;

  const params = useLocalSearchParams<{ mode?: string }>();
  const isReview = params.mode === 'review';
  const modeId: QuizModeId = isQuizModeId(params.mode) ? params.mode : 'ten';
  const mode = QUIZ_MODES[modeId];

  const { words } = useWords();
  const { dueWordIds, recordAnswer } = useProgress();
  const { stats, recordGame, bestFor } = useQuizStats();
  const { artFor } = useCharacterArt();

  const pickFrom = useMemo(
    () => (isReview ? words.filter((w) => new Set(dueWordIds).has(w.id)) : undefined),
    [isReview, words, dueWordIds]
  );

  // ── Game state ──
  const usedRef = useRef<Set<string>>(new Set());
  const [phase, setPhase] = useState<'countdown' | 'playing'>('countdown');
  const [count, setCount] = useState(3);
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  // Scoring accumulators, mirrored to a ref so the timer can read them fresh.
  const [sc, setSc] = useState({ correct: 0, run: 0, best: 0, answered: 0 });
  const scRef = useRef(sc);
  const applySc = (u: (p: typeof sc) => typeof sc) =>
    setSc((prev) => {
      const next = u(prev);
      scRef.current = next;
      return next;
    });
  const endedRef = useRef(false);

  // Per-question answer state
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [matchSel, setMatchSel] = useState<number | null>(null);
  const [matchPairs, setMatchPairs] = useState<(number | null)[]>([null, null, null, null]);
  // Pair colours are dealt in pairing order; a word keeps its colour until unpaired.
  const [pairColor, setPairColor] = useState<(number | null)[]>([null, null, null, null]);
  const [matchDone, setMatchDone] = useState(false);

  // Timers
  const [remaining, setRemaining] = useState(mode.countdownSeconds ?? 0);

  // 3 · 2 · 1 → start. If the word list hasn't arrived yet the countdown holds
  // at 1 and starts as soon as it lands (deep links race the fetch).
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (count <= 0) {
      if (words.length >= 4) startGame();
      return;
    }
    const t = setTimeout(() => setCount((c) => c - 1), 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, count, words.length]);

  function endGame(finalScore: number) {
    if (endedRef.current) return;
    endedRef.current = true;
    router.replace({
      pathname: '/quiz/results',
      params: {
        mode: isReview ? 'review' : modeId,
        score: String(finalScore),
        tenRun: String(scRef.current.run),
        correct: String(scRef.current.correct),
        answered: String(scRef.current.answered),
      },
    });
  }

  function startGame() {
    usedRef.current = new Set();
    endedRef.current = false;
    const startRun = modeId === 'ten' && !isReview ? stats.ten_run_current : 0;
    const init = { correct: 0, run: startRun, best: startRun, answered: 0 };
    scRef.current = init;
    setSc(init);
    setRemaining(mode.countdownSeconds ?? 0);
    setQuestion(nextQuestion(words, usedRef.current, pickFrom));
    setPhase('playing');
  }

  // Countdown clock for the timed mode. The tick only decrements; the game-over
  // navigation lives in its own effect because calling router.replace inside a
  // state updater is a side effect during render (React warns and may misfire).
  useEffect(() => {
    if (phase !== 'playing' || mode.timer !== 'countdown') return;
    const t = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [phase, mode.timer]);

  useEffect(() => {
    if (phase !== 'playing' || mode.timer !== 'countdown' || remaining > 0) return;
    endGame(scRef.current.correct);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, mode.timer, remaining]);

  // ── Countdown screen (dark stage, per-mode copy) ──
  if (phase === 'countdown') {
    return (
      <View style={styles.stage}>
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
          <Defs>
            <LinearGradient id="cdFade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.stageDeep} stopOpacity={0} />
              <Stop offset="1" stopColor={colors.stageDeep} stopOpacity={1} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="47.7%" width="100%" height="52.3%" fill="url(#cdFade)" />
        </Svg>

        <View style={[styles.cdIcon, { top: 80 * s, width: 43 * s, height: 43 * s, borderRadius: 22 * s }]}>
          <mode.Icon size={17 * s} color={colors.textMuted} />
        </View>
        <Text style={[styles.cdTitle, { top: 141 * s, fontSize: 80 * s }]}>{isReview ? 'Review' : mode.label}</Text>
        <View style={[styles.cdBlurb, { top: 280 * s, width: 295 * s, borderRadius: 10 * s, paddingVertical: 16 * s }]}>
          <Text style={[styles.cdBlurbText, { fontSize: 14 * s, width: 262 * s }]}>
            {isReview ? 'A quick pass over your due words.' : mode.blurb}
          </Text>
        </View>
        <Text style={[styles.cdStartsIn, { top: 538 * s, left: 69 * s, fontSize: 20 * s }]}>Quiz starts in:</Text>
        <Text style={[styles.cdNumber, { top: 445 * s, left: 217 * s, fontSize: 200 * s }]}>
          {Math.max(count, 1)}
        </Text>
      </View>
    );
  }

  if (!question) {
    return (
      <View style={styles.center}>
        <Text style={styles.dimText}>Out of questions — nice work!</Text>
      </View>
    );
  }

  const q = question;
  const isMatch = q.kind === 'match';
  const isMC = q.kind === 'meaning' || q.kind === 'reverse' || q.kind === 'character';
  const answered = isMatch ? matchDone : selectedIndex !== null;

  const matchCorrectCount = isMatch
    ? q.words.reduce(
        (n, w, i) => n + (matchPairs[i] !== null && q.defs[matchPairs[i] as number] === w.definition ? 1 : 0),
        0
      )
    : 0;
  const wasCorrect = isMatch
    ? matchCorrectCount === q.words.length
    : isMC && selectedIndex === q.correctIndex;

  function resolve(correct: boolean, wordIds: string[]) {
    wordIds.forEach((id) => recordAnswer(id, correct));
    applySc((p) => {
      const run = correct ? p.run + 1 : 0;
      return {
        correct: p.correct + (correct ? 1 : 0),
        run,
        best: Math.max(p.best, run),
        answered: p.answered + 1,
      };
    });
  }

  function handleSelect(index: number) {
    if (answered || !isMC) return;
    setSelectedIndex(index);
    resolve(index === q.correctIndex, [q.word.id]);
  }

  // The smallest pair colour not currently held by any word.
  function nextColor(colors_: (number | null)[]): number {
    for (let c = 0; c < PAIR_STYLES.length; c++) if (!colors_.includes(c)) return c;
    return 0;
  }

  function handleMatchWord(i: number) {
    if (matchDone) return;
    setMatchSel((cur) => (cur === i ? null : i));
  }

  function handleMatchDef(defIndex: number) {
    if (matchDone || matchSel === null || q.kind !== 'match') return;
    const nextPairs = matchPairs.map((v) => (v === defIndex ? null : v));
    const nextColors = pairColor.map((c, i) => (nextPairs[i] === null && i !== matchSel ? null : c));
    nextPairs[matchSel] = defIndex;
    if (nextColors[matchSel] === null) nextColors[matchSel] = nextColor(nextColors);
    setMatchSel(null);
    setMatchPairs(nextPairs);
    setPairColor(nextColors);
    if (nextPairs.every((v) => v !== null)) {
      setMatchDone(true);
      let allRight = true;
      q.words.forEach((w, i) => {
        const ok = q.defs[nextPairs[i] as number] === w.definition;
        if (!ok) allRight = false;
        recordAnswer(w.id, ok);
      });
      // A match board scores as one item — right only if all four pair up.
      applySc((p) => {
        const run = allRight ? p.run + 1 : 0;
        return {
          correct: p.correct + (allRight ? 1 : 0),
          run,
          best: Math.max(p.best, run),
          answered: p.answered + 1,
        };
      });
    }
  }

  const reachedLimit = modeId === 'ten' && sc.answered >= (mode.questionLimit ?? QUIZ_LENGTH);
  const lifeOver = modeId === 'life' && answered && !wasCorrect;
  const willEnd = reachedLimit || lifeOver;

  function finalScoreForMode(): number {
    if (mode.scoring === 'totalCorrect') return scRef.current.correct;
    if (mode.scoring === 'consecutive') return scRef.current.run;
    return scRef.current.best; // longestStreak
  }

  function handleContinue() {
    if (!answered) return;
    if (willEnd) {
      if (!isReview) recordGame(modeId, finalScoreForMode(), scRef.current.run);
      endGame(finalScoreForMode());
      return;
    }
    setQuestion(nextQuestion(words, usedRef.current, pickFrom));
    setSelectedIndex(null);
    setMatchSel(null);
    setMatchPairs([null, null, null, null]);
    setPairColor([null, null, null, null]);
    setMatchDone(false);
  }

  // ── Header (per-mode: progress + stat pills, Figma 1114:368 / 1353:578 / 1353:680) ──
  const questionNo = Math.min(sc.answered + (answered ? 0 : 1), mode.questionLimit ?? QUIZ_LENGTH);
  const progress =
    modeId === 'ten'
      ? Math.min(1, sc.answered / (mode.questionLimit ?? QUIZ_LENGTH))
      : modeId === 'timed'
        ? remaining / (mode.countdownSeconds ?? 60)
        : null;
  const progressLabel =
    modeId === 'ten'
      ? `Question ${questionNo} of ${mode.questionLimit ?? QUIZ_LENGTH}`
      : modeId === 'timed'
        ? `${remaining} seconds remaining`
        : null;
  const leftPill =
    modeId === 'ten'
      ? { label: 'current streak:', value: sc.run }
      : { label: 'current score:', value: modeId === 'timed' ? sc.correct : sc.run };
  const highScore = isReview ? null : bestFor(modeId);

  const prompt =
    q.kind === 'meaning' ? (
      <Text style={[styles.prompt, { left: 36 * s, top: 323 * s, width: 323 * s, fontSize: 22 * s }]}>
        What does the word <Text style={styles.promptTerm}>{q.word.term}</Text> mean?
      </Text>
    ) : q.kind === 'reverse' ? (
      <Text style={[styles.prompt, { left: 36 * s, top: 323 * s, width: 323 * s, fontSize: 22 * s }]}>
        What word also means <Text style={styles.promptTerm}>{q.word.definition}</Text>?
      </Text>
    ) : q.kind === 'character' ? (
      <Text style={[styles.prompt, { left: 36 * s, top: 240 * s, width: 323 * s, fontSize: 22 * s }]}>
        Which word does this character bring to life?
      </Text>
    ) : (
      <Text style={[styles.promptMatch, { top: 272 * s, fontSize: 16 * s }]}>
        Match each word to its meaning:
      </Text>
    );

  const tileBase = { width: 166 * s, minHeight: 60 * s, borderRadius: 8 * s, padding: 12 * s };

  return (
    <View style={styles.screen}>
      {/* Back to the quiz landing */}
      <Pressable
        style={[styles.backChip, { left: 17 * s, top: 23 * s, height: 28 * s }]}
        onPress={() => router.replace('/quiz')}
        accessibilityRole="button"
        accessibilityLabel="Back to quizzes"
      >
        <IconChevronLeft size={10 * s} color={colors.text} />
        <Text style={[styles.backText, { fontSize: 10 * s }]}>Quizzes</Text>
      </Pressable>

      {/* Mode chip */}
      <View style={[styles.modeChip, { left: 21 * s, top: 68 * s, height: 53 * s, borderRadius: 12 * s, paddingHorizontal: 14 * s }]}>
        <Text style={[styles.modeChipText, { fontSize: 34 * s }]}>{isReview ? 'Review' : mode.label}</Text>
      </View>

      {/* Progress rail (10 Q's and 1 Min only) */}
      {progress !== null ? (
        <>
          <Text style={[styles.progressLabel, { left: 141 * s, top: 78 * s, fontSize: 10 * s }]}>
            {progressLabel}
          </Text>
          <View
            style={[
              styles.progressTrack,
              { left: 137 * s, top: 91 * s, width: 237 * s, height: 20 * s, borderRadius: 999 },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                { width: Math.max(0, Math.min(1, progress)) * 229 * s, height: 12 * s, borderRadius: 999 },
              ]}
            />
          </View>
        </>
      ) : null}

      {/* Stat pills */}
      <View style={[styles.statPill, { left: 33 * s, top: 148 * s, height: 35 * s, borderRadius: 8 * s }]}>
        <IconFlame size={11 * s} color={colors.metaText} />
        <Text style={[styles.statLabel, { fontSize: 10 * s }]}>{leftPill.label}</Text>
        <Text style={[styles.statValue, { fontSize: 16 * s }]}>{String(leftPill.value).padStart(2, '0')}</Text>
      </View>
      {highScore !== null ? (
        <View style={[styles.statPill, { left: 221 * s, top: 148 * s, height: 35 * s, borderRadius: 8 * s }]}>
          <IconTrophy size={11 * s} color={colors.metaText} />
          <Text style={[styles.statLabel, { fontSize: 10 * s }]}>high score:</Text>
          <Text style={[styles.statValue, { fontSize: 16 * s }]}>{String(highScore).padStart(2, '0')}</Text>
        </View>
      ) : null}

      {prompt}

      {q.kind === 'character' ? (
        <Image
          source={artFor(q.word.slug)}
          style={{ position: 'absolute', left: 126 * s, top: 282 * s, width: 143 * s, height: 192 * s }}
          resizeMode="contain"
          accessibilityLabel="Mystery Polari character"
        />
      ) : null}

      {/* Answers — anchored to the bottom like the mockups (grid ends 124 above
          the bar), so tiles can grow upward without ever crowding the bubble. */}
      {isMatch ? (
        // Words run down the left column, meanings down the right (per Figma).
        <View style={[styles.grid, { left: 21 * s, bottom: 124 * s, width: 352 * s, columnGap: 17 * s, rowGap: 20 * s }]}>
          {q.words.map((w, i) => {
            const paired = matchPairs[i] !== null;
            const sel = matchSel === i;
            const wordPal = paired ? PAIR_STYLES[pairColor[i] ?? 0] : null;
            const j = i; // def shown in this row
            const owner = matchPairs.findIndex((p) => p === j);
            const defPal = owner !== -1 ? PAIR_STYLES[pairColor[owner] ?? 0] : null;
            return (
              <View key={w.id} style={{ flexDirection: 'row', columnGap: 17 * s }}>
                <Pressable
                  onPress={() => handleMatchWord(i)}
                  disabled={matchDone}
                  style={[
                    styles.tile,
                    tileBase,
                    wordPal
                      ? { backgroundColor: wordPal.fill, borderColor: wordPal.ink, borderWidth: 1 }
                      : sel
                        ? { borderColor: colors.primary, borderWidth: 1 }
                        : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.tileText,
                      { fontSize: 14 * s },
                      wordPal && { color: wordPal.ink, fontFamily: fonts.bold },
                    ]}
                  >
                    {w.term}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => handleMatchDef(j)}
                  disabled={matchDone || matchSel === null}
                  style={[
                    styles.tile,
                    tileBase,
                    defPal ? { backgroundColor: defPal.fill, borderColor: defPal.ink, borderWidth: 1 } : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.tileText,
                      { fontSize: 14 * s },
                      defPal && { color: defPal.ink, fontFamily: fonts.bold },
                    ]}
                  >
                    {q.defs[j]}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={[styles.grid, { left: 21 * s, bottom: 124 * s, width: 352 * s, columnGap: 20 * s, rowGap: 20 * s }]}>
          {q.options.map((option, index) => {
            const isCorrect = index === q.correctIndex;
            const isSelected = index === selectedIndex;
            const showCorrect = answered && isCorrect;
            const showWrong = answered && isSelected && !isCorrect;
            return (
              <Pressable
                key={index}
                onPress={() => handleSelect(index)}
                disabled={answered}
                style={({ pressed }) => [
                  styles.tile,
                  tileBase,
                  pressed && !answered && { borderColor: colors.primary },
                  showCorrect && styles.tileCorrect,
                  showWrong && styles.tileWrong,
                ]}
              >
                <Text
                  style={[
                    styles.tileText,
                    { fontSize: 14 * s },
                    showCorrect && styles.tileTextCorrect,
                    showWrong && styles.tileTextWrong,
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Continue — always present, enabled once answered; its bottom margin is
          the Figma gap to the bar (54), which also clears the bubble. */}
      <Pressable
        style={({ pressed }) => [
          styles.continueButton,
          { width: 235 * s, height: 38 * s, bottom: 54 * s },
          !answered && styles.continueDisabled,
          pressed && answered && { opacity: 0.85 },
        ]}
        onPress={handleContinue}
        disabled={!answered}
        accessibilityRole="button"
      >
        <Text style={[styles.continueText, { fontSize: 14 * s }]}>
          {willEnd ? 'See results' : 'Continue'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  dimText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 15 },

  // Countdown (dark stage)
  stage: { flex: 1, backgroundColor: colors.stage, alignItems: 'center' },
  cdIcon: { position: 'absolute', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  cdTitle: { position: 'absolute', fontFamily: fonts.display, color: '#FFFFFF' },
  cdBlurb: { position: 'absolute', backgroundColor: 'rgba(249, 247, 255, 0.2)', alignItems: 'center' },
  cdBlurbText: { fontFamily: fonts.regular, color: '#FFFFFF', textAlign: 'center', lineHeight: 16 },
  cdStartsIn: { position: 'absolute', fontFamily: fonts.semibold, color: '#FFFBEC' },
  cdNumber: { position: 'absolute', fontFamily: fonts.extrabold, color: '#FFFFFF', lineHeight: undefined },

  // Header
  backChip: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontFamily: fonts.bold, color: colors.text, letterSpacing: 0.3 },
  modeChip: {
    position: 'absolute',
    backgroundColor: 'rgba(110, 93, 198, 0.2)', // #6E5DC6 at 20%
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeChipText: { fontFamily: fonts.display, color: colors.quizInk },
  progressLabel: {
    position: 'absolute',
    fontFamily: fonts.semibold,
    color: colors.metaText,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  progressTrack: {
    position: 'absolute',
    backgroundColor: colors.progressTrack,
    borderWidth: 1,
    borderColor: colors.progressBorder,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  progressFill: { backgroundColor: colors.progressFill },
  statPill: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.progressTrack,
    paddingHorizontal: 14,
  },
  statLabel: { fontFamily: fonts.semibold, color: colors.metaText, letterSpacing: 0.3, textTransform: 'uppercase' },
  statValue: { fontFamily: fonts.bold, color: colors.textMuted },

  // Prompt
  prompt: { position: 'absolute', fontFamily: fonts.semibold, color: colors.text, lineHeight: 30 },
  promptTerm: { fontFamily: fonts.bold, color: colors.primary },
  promptMatch: { position: 'absolute', alignSelf: 'center', fontFamily: fonts.semibold, color: colors.text },

  // Answer tiles (2-column grid)
  grid: { position: 'absolute', flexDirection: 'row', flexWrap: 'wrap' },
  tile: {
    backgroundColor: colors.inset,
    borderWidth: 0.5,
    borderColor: colors.fieldBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileCorrect: { backgroundColor: colors.correctSoft, borderColor: colors.correct, borderWidth: 1 },
  tileWrong: { backgroundColor: colors.incorrectSoft, borderColor: colors.incorrect, borderWidth: 1 },
  tileText: { fontFamily: fonts.regular, color: colors.text, letterSpacing: 0.3, textAlign: 'center' },
  tileTextCorrect: { color: colors.correct, fontFamily: fonts.bold },
  tileTextWrong: { color: colors.incorrect, fontFamily: fonts.bold },

  continueButton: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: colors.primary,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueDisabled: { opacity: 0.4 },
  continueText: { fontFamily: fonts.bold, color: colors.onPrimary, letterSpacing: 0.3 },
});
