import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '../../../src/lib/supabase';
import { useAuth } from '../../../src/lib/auth';
import { FormError, PrimaryButton } from '../../../src/components/form';
import type { Palette } from '../../../src/lib/palette';
import { useColors, useThemedStyles } from '../../../src/lib/appearance';
import { radii, spacing, fonts } from '../../../src/lib/theme';
import { ScreenBackground } from '../../../src/components/ScreenBackground';
import { useTabBarInset } from '../../../src/components/AnimatedTabBar';

const CATEGORIES = [
  { value: 'bug', label: '🐛 Bug' },
  { value: 'word', label: '📖 Word suggestion' },
  { value: 'general', label: '💬 General' },
] as const;

type Category = (typeof CATEGORIES)[number]['value'];

export default function FeedbackScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const { session } = useAuth();
  const [category, setCategory] = useState<Category>('general');
  const [message, setMessage] = useState('');
  const [contactEmail, setContactEmail] = useState(session?.user.email ?? '');
  const [error, setError] = useState<string | null>(null);
  // The bar floats over the screen, so the scroll has to end above it by hand.
  const tabInset = useTabBarInset();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    const { error: insertError } = await supabase.from('feedback').insert({
      user_id: session?.user.id ?? null,
      category,
      message: message.trim(),
      contact_email: contactEmail.trim() || null,
      app_version: Constants.expoConfig?.version ?? null,
    });
    setLoading(false);
    if (insertError) {
      setError(insertError.message);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <View style={styles.center}>
        <Text style={styles.sentEmoji}>💌</Text>
        <Text style={styles.sentTitle}>Thanks, ducky!</Text>
        <Text style={styles.sentBody}>Your feedback is on its way to us.</Text>
        <Pressable
          style={styles.againButton}
          onPress={() => {
            setMessage('');
            setSent(false);
          }}
        >
          <Text style={styles.againText}>Send another</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screenBg}>
      <ScreenBackground />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: tabInset + spacing.md }]}
      >
        <Text style={styles.label}>What&apos;s it about?</Text>
        <View style={styles.chips}>
          {CATEGORIES.map((c) => (
            <Pressable
              key={c.value}
              style={[styles.chip, category === c.value && styles.chipActive]}
              onPress={() => setCategory(c.value)}
            >
              <Text style={[styles.chipText, category === c.value && styles.chipTextActive]}>
                {c.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Your feedback</Text>
        <TextInput
          style={styles.messageInput}
          value={message}
          onChangeText={setMessage}
          placeholder="Tell us what's bona and what's naff…"
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />

        <Text style={styles.label}>Contact email (optional)</Text>
        <TextInput
          style={styles.emailInput}
          value={contactEmail}
          onChangeText={setContactEmail}
          placeholder="you@example.com"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <FormError message={error} />
        <PrimaryButton
          title="Send feedback"
          onPress={handleSubmit}
          loading={loading}
          disabled={!message.trim()}
        />
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    // Wrapper so the sparkle pattern stays fixed behind the scrolling content.
    screenBg: { flex: 1 },
    container: {
      flex: 1,
      // Transparent: this scrolls directly over <ScreenBackground />, so an
      // opaque fill here hides the sparkle pattern behind it.
      backgroundColor: 'transparent',
    },
    content: {
      padding: spacing.md,
      gap: spacing.sm,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      padding: spacing.xl,
      backgroundColor: colors.canvas,
    },
    label: {
      fontSize: 13,
      fontFamily: fonts.semibold,
      color: colors.textMuted,
      marginTop: spacing.sm,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: radii.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: {
      fontSize: 13,
      fontFamily: fonts.semibold,
      color: colors.textMuted,
    },
    chipTextActive: {
      color: '#fff',
    },
    messageInput: {
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      fontFamily: fonts.regular,
      fontSize: 15,
      color: colors.text,
      minHeight: 120,
    },
    emailInput: {
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      fontFamily: fonts.regular,
      fontSize: 15,
      color: colors.text,
    },
    sentEmoji: {
      fontFamily: fonts.regular,
      fontSize: 48,
    },
    sentTitle: {
      fontSize: 22,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    sentBody: {
      fontFamily: fonts.regular,
      fontSize: 15,
      color: colors.textMuted,
    },
    againButton: {
      marginTop: spacing.md,
    },
    againText: {
      color: colors.primary,
      fontFamily: fonts.semibold,
      fontSize: 15,
    },
  });
