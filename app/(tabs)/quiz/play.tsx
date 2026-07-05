import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useWords } from '../../../src/lib/words';
import { generateQuiz } from '../../../src/lib/quiz';
import { colors, radii, spacing, fonts } from '../../../src/lib/theme';

export default function QuizPlayScreen() {
  const router = useRouter();
  const { words } = useWords();
  // Generate once per mount; "Play again" remounts via router.replace
  const questions = useMemo(() => generateQuiz(words), [words]);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  if (questions.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.dimText}>Loading questions…</Text>
      </View>
    );
  }

  const question = questions[questionIndex];
  const answered = selectedIndex !== null;
  const isLast = questionIndex === questions.length - 1;

  function handleSelect(index: number) {
    if (answered) return;
    setSelectedIndex(index);
    if (index === question.correctIndex) {
      setScore((s) => s + 1);
    }
  }

  function handleContinue() {
    if (isLast) {
      router.replace({
        pathname: '/quiz/results',
        params: { score: String(score), total: String(questions.length) },
      });
    } else {
      setQuestionIndex((i) => i + 1);
      setSelectedIndex(null);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${((questionIndex + (answered ? 1 : 0)) / questions.length) * 100}%` },
          ]}
        />
      </View>
      <Text style={styles.counter}>
        Question {questionIndex + 1} of {questions.length}
      </Text>

      <Text style={styles.prompt}>
        What does <Text style={styles.promptTerm}>“{question.word.term}”</Text> mean?
      </Text>

      <ScrollView style={styles.options} contentContainerStyle={styles.optionsContent}>
        {question.options.map((option, index) => {
          const isCorrect = index === question.correctIndex;
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
        })}
      </ScrollView>

      {answered ? (
        <View style={styles.footer}>
          <Text style={styles.feedback}>
            {selectedIndex === question.correctIndex
              ? 'Bona! That’s right.'
              : `Not quite — it means “${question.word.definition}”.`}
          </Text>
          <Pressable
            style={({ pressed }) => [styles.continueButton, pressed && styles.continuePressed]}
            onPress={handleContinue}
          >
            <Text style={styles.continueText}>{isLast ? 'See results' : 'Continue'}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  dimText: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
  counter: {
    marginTop: spacing.sm,
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  prompt: {
    marginTop: spacing.md,
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.text,
    lineHeight: 30,
  },
  promptTerm: {
    color: colors.primary,
  },
  options: {
    marginTop: spacing.md,
    flex: 1,
  },
  optionsContent: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  option: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
  },
  optionPressed: {
    borderColor: colors.primary,
  },
  optionCorrect: {
    borderColor: colors.teal,
    backgroundColor: colors.tealSoft,
  },
  optionWrong: {
    borderColor: colors.danger,
    backgroundColor: colors.blushSoft,
  },
  optionText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
    lineHeight: 21,
  },
  optionTextCorrect: {
    color: colors.teal,
    fontFamily: fonts.semibold,
  },
  optionTextWrong: {
    color: colors.danger,
  },
  footer: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
    // Keep the Continue button clear of the tab bar's floating bubble,
    // which pokes ~40px above the bar over the Quiz tab
    paddingBottom: 44,
  },
  feedback: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm + 4,
    alignItems: 'center',
  },
  continuePressed: {
    opacity: 0.8,
  },
  continueText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: fonts.bold,
  },
});
