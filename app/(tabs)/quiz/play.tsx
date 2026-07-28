import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { IconChevronLeft, IconFlame, IconTrophy } from '@tabler/icons-react-native';
import { useWords } from '../../../src/lib/words';
import { useProgress } from '../../../src/lib/progress';
import { useQuizStats } from '../../../src/lib/quizScores';
import { useCharacterArt } from '../../../src/lib/remoteArt';
import { nextQuestion, QUIZ_LENGTH, type QuizQuestion } from '../../../src/lib/quiz';
import { QUIZ_MODES, isQuizModeId, type QuizModeId } from '../../../src/lib/quizModes';
import { colors, fonts } from '../../../src/lib/theme';
import { ScreenBackground } from '../../../src/components/ScreenBackground';

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

// Countdown screen, rebuilt to the current frames (Quiz/*_Countdown panes in
// section 1353:769). It is a LIGHT screen now — the dark stage, spotlight wash
// and blurb panel are gone. What remains: the mode title, a hand-drawn grey
// card, and the count inside it under a navy "Quiz starts in:" pill.
//
// Tops are cap lines solved back through the fonts' metrics (Digitale: asc
// 0.97em, desc 0.27em, cap 0.71em; Mouse Memoirs: 0.9375 / 0.2125 / 0.71925).
const CD = {
  backChip: { x: 17, y: 51.5, w: 80, h: 31 },
  titleTop: 107, // matches the question screen's Mode Text
  titleSize: 60,
  titleLine: 52.8,
  card: {
    x: 80,
    y: 312,
    w: 235,
    h: 200.5,
    fill: '#DCDFE4',
    // "Vector 9" — a tapered, hand-drawn card, not a plain rounded rect.
    d: 'M210.228 0.896026 L23.3402 7.65578 C10.8703 8.10682 1.54222 19.2675 3.31138 31.6195 L24.9186 182.477 C26.3999 192.82 35.2587 200.5 45.7065 200.5 L190.547 200.5 C201.101 200.5 210.016 192.667 211.373 182.201 L231.812 24.5829 C233.481 11.7142 223.195 0.426974 210.228 0.896026 Z',
  },
  pill: { x: 138.5, y: 357.5, w: 118, h: 30, fill: '#44546F' },
  numberTop: 397.5, // cap line 405.5
  numberSize: 100,
  numberLine: 88,
};

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

  // ── Countdown screen (light, per the current frames) ──
  if (phase === 'countdown') {
    return (
      <View style={styles.screen}>
        <ScreenBackground />
        <Pressable
          style={[
            styles.cdBackChip,
            { left: CD.backChip.x * s, top: CD.backChip.y * s, width: CD.backChip.w * s, height: CD.backChip.h * s },
          ]}
          onPress={() => router.replace('/quiz')}
          accessibilityRole="button"
          accessibilityLabel="Back to quizzes"
        >
          <IconChevronLeft size={10 * s} color={colors.text} />
          <Text style={[styles.cdBackText, { fontSize: 10 * s }]}>Quizzes</Text>
        </Pressable>

        <Text
          style={[
            styles.cdTitle,
            { top: CD.titleTop * s, fontSize: CD.titleSize * s, lineHeight: CD.titleLine * s },
          ]}
        >
          {isReview ? 'Review' : mode.label}
        </Text>

        <View style={[styles.headerStats, { top: 210.5 * s, gap: 57 * s }]}>
          <View style={styles.statGroup}>
            <IconFlame size={10 * s} color={colors.textFaint} />
            <Text style={[styles.statLabel, { fontSize: 10 * s }]}>
              STREAK:
            </Text>
            <Text style={[styles.statValue, { fontSize: 14 * s }]}>
              {String(modeId === 'ten' && !isReview ? stats.ten_run_current : 0).padStart(2, '0')}
            </Text>
          </View>
          {!isReview ? (
            <View style={styles.statGroup}>
              <IconTrophy size={10 * s} color={colors.textFaint} />
              <Text style={[styles.statLabel, { fontSize: 10 * s }]}>HIGH SCORE:</Text>
              <Text style={[styles.statValue, { fontSize: 14 * s }]}>
                {String(bestFor(modeId)).padStart(2, '0')}
              </Text>
            </View>
          ) : null}
        </View>

        {/* The count sits in a hand-drawn card, under its label pill */}
        <Svg
          style={{ position: 'absolute', left: CD.card.x * s, top: CD.card.y * s }}
          width={CD.card.w * s}
          height={CD.card.h * s}
          viewBox={`0 0 ${CD.card.w} ${CD.card.h}`}
          pointerEvents="none"
        >
          <Path d={CD.card.d} fill={CD.card.fill} />
        </Svg>

        <View
          style={[
            styles.cdPill,
            {
              left: CD.pill.x * s,
              top: CD.pill.y * s,
              width: CD.pill.w * s,
              height: CD.pill.h * s,
              borderRadius: (CD.pill.h * s) / 2,
            },
          ]}
        >
          <Text style={[styles.cdPillText, { fontSize: 14 * s }]}>Quiz starts in:</Text>
        </View>

        <Text
          style={[
            styles.cdNumber,
            {
              top: CD.numberTop * s,
              left: CD.pill.x * s,
              width: CD.pill.w * s,
              fontSize: CD.numberSize * s,
              lineHeight: CD.numberLine * s,
            },
          ]}
        >
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
  // STREAK is the longest continuous run of right answers, so it reads the
  // best-run accumulator rather than the live run or the total correct. For
  // 10 Q's the run is seeded from the stored cross-game streak, which the mode
  // is explicitly built to carry.
  const leftPill = { label: 'STREAK:', value: sc.best };
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
      <Text style={[styles.prompt, { left: 36 * s, top: 244 * s, width: 323 * s, fontSize: 22 * s }]}>
        Which word does this character bring to life?
      </Text>
    ) : (
      <Text style={[styles.promptMatch, { top: 246 * s, fontSize: 16 * s }]}>
        Match each word to its meaning:
      </Text>
    );

  const tileBase = { width: 168 * s, minHeight: 62 * s, borderRadius: 8 * s, padding: 12 * s };
  // The match variant's own tile: taller, narrower, absolutely placed.
  const matchTile = {
    position: 'absolute' as const,
    width: 155 * s,
    height: 82 * s,
    borderRadius: 8 * s,
    padding: 12 * s,
  };

  return (
    <View style={styles.screen}>
      <ScreenBackground />
      {/* Header Info (frame 2075:3321): back chip y51.5, the mode title
          centred at y107, a full-width progress rail at y180.5, and the
          streak / high-score pair inline beneath it at y210.5. This replaces
          the old lilac mode chip, "QUESTION n OF m" label and boxed stat
          pills. */}
      <Pressable
        style={[styles.backChip, { left: 17 * s, top: 51.5 * s, height: 31 * s, paddingHorizontal: 14 * s }]}
        onPress={() => router.replace('/quiz')}
        accessibilityRole="button"
        accessibilityLabel="Back to quizzes"
      >
        <IconChevronLeft size={10 * s} color={colors.text} />
        <Text style={[styles.backText, { fontSize: 10 * s }]}>Quizzes</Text>
      </Pressable>

      <Text style={[styles.modeTitle, { top: 107 * s, fontSize: 60 * s, lineHeight: 53 * s }]}>
        {isReview ? 'Review' : mode.label}
      </Text>

      {progress !== null ? (
        <View
          style={[
            styles.progressTrack,
            { left: 34 * s, top: 180.5 * s, width: 327 * s, height: 20 * s, borderRadius: 999 },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: Math.max(0, Math.min(1, progress)) * 319 * s,
                height: 12 * s,
                borderRadius: 999,
              },
            ]}
          />
        </View>
      ) : null}

      <View style={[styles.headerStats, { top: 210.5 * s, gap: 57 * s }]}>
        <View style={styles.statGroup}>
          <IconFlame size={10 * s} color={colors.textFaint} />
          <Text style={[styles.statLabel, { fontSize: 10 * s }]}>{leftPill.label}</Text>
          <Text style={[styles.statValue, { fontSize: 14 * s }]}>
            {String(leftPill.value).padStart(2, '0')}
          </Text>
        </View>
        {highScore !== null ? (
          <View style={styles.statGroup}>
            <IconTrophy size={10 * s} color={colors.textFaint} />
            <Text style={[styles.statLabel, { fontSize: 10 * s }]}>HIGH SCORE:</Text>
            <Text style={[styles.statValue, { fontSize: 14 * s }]}>
              {String(highScore).padStart(2, '0')}
            </Text>
          </View>
        ) : null}
      </View>

      {prompt}

      {q.kind === 'character' ? (
        <Image
          source={artFor(q.word.slug)}
          style={{ position: 'absolute', left: 132 * s, top: 299 * s, width: 131 * s, height: 175 * s }}
          resizeMode="contain"
          accessibilityLabel="Mystery Polari character"
        />
      ) : null}

      {/* Answers — the frames place the grid at y490 (168x62 tiles, 18 apart)
          and Continue at y662, so both are top-anchored like the header. */}
      {isMatch ? (
        // Words run down the left column, meanings down the right (per Figma).
        // Frame 1353:439: 155x82 tiles in two fixed columns (x22 / x217) on a
        // 90px pitch from y280 — not the 168x62 grid the other variants use.
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {q.words.map((w, i) => {
            const paired = matchPairs[i] !== null;
            const sel = matchSel === i;
            const wordPal = paired ? PAIR_STYLES[pairColor[i] ?? 0] : null;
            const j = i; // def shown in this row
            const owner = matchPairs.findIndex((p) => p === j);
            const defPal = owner !== -1 ? PAIR_STYLES[pairColor[owner] ?? 0] : null;
            return (
              <View key={w.id} pointerEvents="box-none">
                <Pressable
                  onPress={() => handleMatchWord(i)}
                  disabled={matchDone}
                  style={[
                    styles.tile,
                    matchTile,
                    { left: 22 * s, top: (280 + i * 90) * s },
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
                    matchTile,
                    { left: 217 * s, top: (280 + j * 90) * s },
                    defPal ? { backgroundColor: defPal.fill, borderColor: defPal.ink, borderWidth: 1 } : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.tileText,
                      { fontSize: 14 * s },
                      defPal && { color: defPal.ink, fontFamily: fonts.bold },
                    ]}
                    // The frame's tile is a fixed 82 tall, so a long entry has
                    // to clamp rather than spill past its own edges.
                    numberOfLines={4}
                  >
                    {q.defs[j]}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={[styles.grid, { left: 21 * s, top: 490 * s, width: 354 * s, columnGap: 18 * s, rowGap: 18 * s }]}>
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

      {/* Continue — always present, enabled once answered. Frame 1351:1875 puts
          it at x80, 199×50, its foot 45 above the bar (which also clears the
          bubble). */}
      <Pressable
        style={({ pressed }) => [
          styles.continueButton,
          { left: (isMatch ? 98 : 80) * s, width: 199 * s, height: 50 * s, top: 662 * s },
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
  // The question frames use a lighter canvas than the app default.
  screen: { flex: 1, backgroundColor: '#E7E9EC' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  dimText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 15 },

  // Countdown (light screen, per the current frames)
  cdBackChip: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.inset,
    borderRadius: 999,
  },
  cdBackText: { fontFamily: fonts.bold, color: colors.text },
  cdTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: fonts.display,
    color: colors.text,
  },
  cdPill: {
    position: 'absolute',
    backgroundColor: '#44546F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cdPillText: { fontFamily: fonts.bold, color: '#FFFFFF' },
  cdNumber: {
    position: 'absolute',
    textAlign: 'center',
    fontFamily: fonts.extrabold,
    color: '#44546F',
  },

  // Header
  backChip: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 999,
    backgroundColor: colors.inset,
  },
  modeTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    fontFamily: fonts.display,
    color: colors.text,
    textAlign: 'center',
  },
  headerStats: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statGroup: { flexDirection: 'row', alignItems: 'center', gap: 4 },
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
  statLabel: { fontFamily: fonts.semibold, color: colors.textFaint, letterSpacing: 0.3 },
  statValue: { fontFamily: fonts.bold, color: colors.textFaint, letterSpacing: 0.3 },

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
    backgroundColor: colors.primary,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueDisabled: { opacity: 0.4 },
  continueText: { fontFamily: fonts.bold, color: colors.onPrimary, letterSpacing: 0.3 },
});
