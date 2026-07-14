import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { IconClockHour4, IconHeart } from '@tabler/icons-react-native';
import { useWords } from '../../../src/lib/words';
import { useProgress } from '../../../src/lib/progress';
import { useQuizStats } from '../../../src/lib/quizScores';
import { useCharacterArt } from '../../../src/lib/remoteArt';
import { nextQuestion, isTypedAnswerCorrect, QUIZ_LENGTH, type QuizQuestion } from '../../../src/lib/quiz';
import { QUIZ_MODES, isQuizModeId, type QuizModeId } from '../../../src/lib/quizModes';
import { colors, radii, spacing, fonts } from '../../../src/lib/theme';

const PAIR_COLORS = ['#0C66E4', '#27958A', '#DE9A26', '#B4574A'];

function mmss(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// 3 · 2 · 1 · Go! start countdown, shown before every game.
function Countdown({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(3);
  useEffect(() => {
    if (n < 0) {
      onDone();
      return;
    }
    const t = setTimeout(() => setN((v) => v - 1), n === 0 ? 550 : 700);
    return () => clearTimeout(t);
  }, [n, onDone]);
  return (
    <View style={styles.countdown}>
      <Text style={styles.countdownReady}>{n > 0 ? (n === 3 ? 'Ready…' : n === 2 ? 'Set…' : 'Go!') : 'Go!'}</Text>
      <Text style={styles.countdownNum}>{n > 0 ? n : '✨'}</Text>
    </View>
  );
}

export default function QuizPlayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const isReview = params.mode === 'review';
  const modeId: QuizModeId = isQuizModeId(params.mode) ? params.mode : 'ten';
  const mode = QUIZ_MODES[modeId];

  const { words } = useWords();
  const { dueWordIds, recordAnswer } = useProgress();
  const { stats, recordGame } = useQuizStats();
  const { artFor } = useCharacterArt();

  const pickFrom = useMemo(
    () => (isReview ? words.filter((w) => new Set(dueWordIds).has(w.id)) : undefined),
    [isReview, words, dueWordIds]
  );

  // ── Game state ──
  const usedRef = useRef<Set<string>>(new Set());
  const [phase, setPhase] = useState<'countdown' | 'playing'>('countdown');
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
  const [typedAnswer, setTypedAnswer] = useState('');
  const [typedResult, setTypedResult] = useState<'correct' | 'wrong' | null>(null);
  const [matchSel, setMatchSel] = useState<number | null>(null);
  const [matchPairs, setMatchPairs] = useState<(number | null)[]>([null, null, null, null]);
  const [matchDone, setMatchDone] = useState(false);

  // Timers
  const [remaining, setRemaining] = useState(mode.countdownSeconds ?? 0); // countdown (timed)
  const [elapsed, setElapsed] = useState(0); // count-up (life)

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

  // Start the game once the countdown finishes and words are loaded.
  function startGame() {
    usedRef.current = new Set();
    endedRef.current = false;
    const startRun = modeId === 'ten' && !isReview ? stats.ten_run_current : 0;
    const init = { correct: 0, run: startRun, best: startRun, answered: 0 };
    scRef.current = init;
    setSc(init);
    setRemaining(mode.countdownSeconds ?? 0);
    setElapsed(0);
    setQuestion(nextQuestion(words, usedRef.current, pickFrom));
    setPhase('playing');
  }

  // Countdown clock for the timed mode; count-up for the life mode.
  useEffect(() => {
    if (phase !== 'playing') return;
    if (mode.timer === 'countdown') {
      const t = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            clearInterval(t);
            endGame(scRef.current.correct);
            return 0;
          }
          return r - 1;
        });
      }, 1000);
      return () => clearInterval(t);
    }
    if (mode.timer === 'elapsed') {
      const t = setInterval(() => setElapsed((e) => e + 1), 1000);
      return () => clearInterval(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, mode.timer]);

  if (phase === 'countdown') {
    return (
      <View style={styles.container}>
        <Countdown onDone={startGame} />
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
  const isTyped = q.kind === 'typed';
  const isMatch = q.kind === 'match';
  const isMC = q.kind === 'meaning' || q.kind === 'reverse' || q.kind === 'blank' || q.kind === 'character';
  const answered = isMatch ? matchDone : isTyped ? typedResult !== null : selectedIndex !== null;
  const termAnswer = q.kind === 'reverse' || q.kind === 'blank' || q.kind === 'character' || q.kind === 'typed';

  const matchCorrectCount = isMatch
    ? q.words.reduce(
        (n, w, i) => n + (matchPairs[i] !== null && q.defs[matchPairs[i] as number] === w.definition ? 1 : 0),
        0
      )
    : 0;
  const wasCorrect = isMatch
    ? matchCorrectCount === q.words.length
    : isTyped
      ? typedResult === 'correct'
      : isMC && selectedIndex === q.correctIndex;

  // Register a resolved answer: update scoring, feed the SRS, handle life death.
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

  function handleTypedSubmit() {
    if (answered || q.kind !== 'typed' || !typedAnswer.trim()) return;
    const correct = isTypedAnswerCorrect(q.word, typedAnswer);
    setTypedResult(correct ? 'correct' : 'wrong');
    resolve(correct, [q.word.id]);
  }

  function handleMatchDef(defIndex: number) {
    if (matchDone || matchSel === null || q.kind !== 'match') return;
    const next = matchPairs.map((v) => (v === defIndex ? null : v));
    next[matchSel] = defIndex;
    setMatchSel(null);
    setMatchPairs(next);
    if (next.every((v) => v !== null)) {
      setMatchDone(true);
      let allRight = true;
      q.words.forEach((w, i) => {
        const ok = q.defs[next[i] as number] === w.definition;
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

  // End conditions after this answer
  const reachedLimit = modeId === 'ten' && sc.answered >= (mode.questionLimit ?? QUIZ_LENGTH);
  const lifeOver = modeId === 'life' && answered && !wasCorrect;
  const willEnd = reachedLimit || lifeOver;

  function finalScoreForMode(): number {
    if (mode.scoring === 'totalCorrect') return scRef.current.correct;
    if (mode.scoring === 'consecutive') return scRef.current.run;
    return scRef.current.best; // longestStreak
  }

  function handleContinue() {
    if (willEnd) {
      if (!isReview) recordGame(modeId, finalScoreForMode(), scRef.current.run);
      endGame(finalScoreForMode());
      return;
    }
    setQuestion(nextQuestion(words, usedRef.current, pickFrom));
    setSelectedIndex(null);
    setTypedAnswer('');
    setTypedResult(null);
    setMatchSel(null);
    setMatchPairs([null, null, null, null]);
    setMatchDone(false);
  }

  // ── Header: progress + live status chips ──
  const header =
    modeId === 'ten' ? (
      <>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(1, (sc.answered + (answered ? 0 : 0)) / (mode.questionLimit ?? 10)) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.counter}>
          Question {answered ? sc.answered : Math.min(sc.answered + 1, mode.questionLimit ?? 10)} of{' '}
          {mode.questionLimit ?? 10}
          {isReview ? '  ·  review' : `  ·  streak ${sc.run}`}
        </Text>
      </>
    ) : (
      <View style={styles.statusRow}>
        <View style={[styles.statusChip, modeId === 'timed' && remaining <= 10 && styles.statusUrgent]}>
          {modeId === 'timed' ? (
            <IconClockHour4 size={16} color={remaining <= 10 ? colors.danger : colors.primary} />
          ) : (
            <IconHeart size={16} color={colors.primary} />
          )}
          <Text style={[styles.statusText, modeId === 'timed' && remaining <= 10 && styles.statusTextUrgent]}>
            {modeId === 'timed' ? mmss(remaining) : mmss(elapsed)}
          </Text>
        </View>
        <View style={styles.statusChip}>
          <Text style={styles.statusText}>
            {modeId === 'timed' ? `${sc.correct} correct` : `${sc.run} in a row`}
          </Text>
        </View>
      </View>
    );

  const prompt =
    q.kind === 'meaning' ? (
      <Text style={styles.prompt}>
        What does <Text style={styles.promptTerm}>“{q.word.term}”</Text> mean?
      </Text>
    ) : q.kind === 'reverse' ? (
      <Text style={styles.prompt}>
        Which word means <Text style={styles.promptTerm}>“{q.word.definition}”</Text>?
      </Text>
    ) : q.kind === 'blank' ? (
      <Text style={styles.prompt}>{q.sentence.replace(/______/, '⬚⬚⬚')}</Text>
    ) : q.kind === 'character' ? (
      <Text style={styles.prompt}>Which word does this character bring to life?</Text>
    ) : q.kind === 'match' ? (
      <Text style={styles.promptSmall}>Match each word to its meaning.</Text>
    ) : (
      <Text style={styles.prompt}>
        Type the Polari for <Text style={styles.promptTerm}>“{q.word.definition}”</Text>
      </Text>
    );

  return (
    <View style={styles.container}>
      {header}
      {prompt}

      {q.kind === 'character' ? (
        <Image
          source={artFor(q.word.slug)}
          style={styles.characterImage}
          resizeMode="contain"
          accessibilityLabel="Mystery Polari character"
        />
      ) : null}

      {/* Answer area fills the space between header and footer — no scroll */}
      <View style={styles.answerArea}>
        {isTyped ? (
          <View style={styles.typedWrap}>
            <TextInput
              style={[
                styles.typedInput,
                typedResult === 'correct' && styles.typedInputCorrect,
                typedResult === 'wrong' && styles.typedInputWrong,
              ]}
              placeholder="Your answer…"
              placeholderTextColor={colors.textMuted}
              value={typedAnswer}
              onChangeText={setTypedAnswer}
              editable={!answered}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={handleTypedSubmit}
              returnKeyType="done"
            />
            {!answered ? (
              <Pressable
                style={({ pressed }) => [
                  styles.submitButton,
                  !typedAnswer.trim() && styles.submitDisabled,
                  pressed && styles.continuePressed,
                ]}
                onPress={handleTypedSubmit}
                disabled={!typedAnswer.trim()}
              >
                <Text style={styles.continueText}>Check</Text>
              </Pressable>
            ) : null}
          </View>
        ) : isMatch ? (
          <>
            {q.words.map((w, i) => {
              const assigned = matchPairs[i];
              const ok = matchDone && assigned !== null && q.defs[assigned] === w.definition;
              const bad = matchDone && !ok;
              return (
                <Pressable
                  key={w.id}
                  onPress={() => !matchDone && setMatchSel(i)}
                  disabled={matchDone}
                  style={({ pressed }) => [
                    styles.matchChip,
                    matchSel === i && styles.matchChipSel,
                    assigned !== null && !matchDone && { borderColor: PAIR_COLORS[i] },
                    ok && styles.optionCorrect,
                    bad && styles.optionWrong,
                    pressed && !matchDone && styles.optionPressed,
                  ]}
                >
                  <View style={[styles.matchDot, { backgroundColor: assigned !== null ? PAIR_COLORS[i] : colors.fieldBorder }]} />
                  <Text style={styles.matchTerm} numberOfLines={1}>
                    {w.term}
                  </Text>
                </Pressable>
              );
            })}
            <View style={styles.matchDivider} />
            {q.defs.map((def, j) => {
              const owner = matchPairs.findIndex((p) => p === j);
              const paired = owner !== -1;
              const ok = matchDone && paired && q.defs[j] === q.words[owner].definition;
              const bad = matchDone && paired && !ok;
              return (
                <Pressable
                  key={j}
                  onPress={() => handleMatchDef(j)}
                  disabled={matchDone || matchSel === null}
                  style={({ pressed }) => [
                    styles.matchChip,
                    paired && !matchDone && { borderColor: PAIR_COLORS[owner] },
                    ok && styles.optionCorrect,
                    bad && styles.optionWrong,
                    pressed && !matchDone && matchSel !== null && styles.optionPressed,
                  ]}
                >
                  <View style={[styles.matchDot, { backgroundColor: paired ? PAIR_COLORS[owner] : colors.fieldBorder }]} />
                  <Text style={styles.matchDef} numberOfLines={2}>
                    {def}
                  </Text>
                </Pressable>
              );
            })}
          </>
        ) : (
          q.options.map((option, index) => {
            const isCorrect = index === q.correctIndex;
            const isSelected = index === selectedIndex;
            return (
              <Pressable
                key={index}
                onPress={() => handleSelect(index)}
                disabled={answered}
                style={({ pressed }) => [
                  styles.option,
                  pressed && !answered && styles.optionPressed,
                  answered && isCorrect && styles.optionCorrect,
                  answered && isSelected && !isCorrect && styles.optionWrong,
                ]}
              >
                <Text
                  numberOfLines={3}
                  style={[
                    styles.optionText,
                    answered && isCorrect && styles.optionTextCorrect,
                    answered && isSelected && !isCorrect && styles.optionTextWrong,
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })
        )}
      </View>

      {/* Footer space is always reserved so the answer area never resizes */}
      <View style={styles.footer}>
        {answered ? (
          <>
            <Text style={styles.feedback} numberOfLines={2}>
              {isMatch
                ? wasCorrect
                  ? 'Fantabulosa! All four matched.'
                  : `${matchCorrectCount} of ${q.words.length} matched — greens are right.`
                : wasCorrect
                  ? 'Bona! That’s right.'
                  : termAnswer
                    ? `Not quite — it’s “${q.word.term}”.`
                    : `Not quite — it means “${q.word.definition}”.`}
            </Text>
            <Pressable
              style={({ pressed }) => [styles.continueButton, pressed && styles.continuePressed]}
              onPress={handleContinue}
            >
              <Text style={styles.continueText}>{willEnd ? 'See results' : 'Continue'}</Text>
            </Pressable>
          </>
        ) : null}
      </View>
    </View>
  );
}

const FOOTER_HEIGHT = 108;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  dimText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 15 },
  countdown: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  countdownReady: { fontFamily: fonts.semibold, fontSize: 22, color: colors.textMuted, letterSpacing: 0.5 },
  countdownNum: { fontFamily: fonts.extrabold, fontSize: 96, color: colors.primary },
  progressTrack: { height: 10, borderRadius: 5, backgroundColor: colors.border, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5, backgroundColor: colors.accent },
  counter: {
    marginTop: spacing.sm,
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statusRow: { flexDirection: 'row', gap: spacing.sm },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.fieldBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  statusUrgent: { borderColor: colors.danger, backgroundColor: colors.blushSoft },
  statusText: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  statusTextUrgent: { color: colors.danger },
  prompt: { marginTop: spacing.md, fontSize: 21, fontFamily: fonts.bold, color: colors.text, lineHeight: 28 },
  promptSmall: { marginTop: spacing.md, fontSize: 17, fontFamily: fonts.bold, color: colors.text },
  promptTerm: { color: colors.primary },
  characterImage: { width: '100%', height: 150, marginTop: spacing.sm },
  answerArea: { flex: 1, marginTop: spacing.md, gap: spacing.sm, justifyContent: 'center' },
  typedWrap: { gap: spacing.sm },
  typedInput: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontFamily: fonts.regular,
    fontSize: 17,
    color: colors.text,
  },
  typedInputCorrect: { borderColor: colors.teal, backgroundColor: colors.tealSoft },
  typedInputWrong: { borderColor: colors.danger, backgroundColor: colors.blushSoft },
  submitButton: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.sm + 4, alignItems: 'center' },
  submitDisabled: { opacity: 0.4 },
  option: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  optionPressed: { borderColor: colors.primary },
  optionCorrect: { borderColor: colors.teal, backgroundColor: colors.tealSoft },
  optionWrong: { borderColor: colors.danger, backgroundColor: colors.blushSoft },
  optionText: { fontFamily: fonts.regular, fontSize: 15, color: colors.text, lineHeight: 20 },
  optionTextCorrect: { color: colors.teal, fontFamily: fonts.semibold },
  optionTextWrong: { color: colors.danger },
  matchChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  matchChipSel: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  matchDot: { width: 12, height: 12, borderRadius: 6 },
  matchTerm: { flex: 1, fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  matchDef: { flex: 1, fontFamily: fonts.regular, fontSize: 13, color: colors.text, lineHeight: 17 },
  matchDivider: { height: 1, backgroundColor: colors.border },
  footer: { height: FOOTER_HEIGHT, justifyContent: 'flex-end', gap: spacing.sm, paddingBottom: 44 },
  feedback: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  continueButton: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.sm + 4, alignItems: 'center' },
  continuePressed: { opacity: 0.8 },
  continueText: { color: '#fff', fontSize: 16, fontFamily: fonts.bold },
});
