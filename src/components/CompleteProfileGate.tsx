import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../lib/auth';
import { useDisplayName } from '../lib/displayName';
import { DISPLAY_NAME_MAX } from '../lib/nameModeration';
import { colors, fonts } from '../lib/theme';
import { useDesignScale } from '../lib/designScale';
import { ScreenBackground } from './ScreenBackground';

// Onboarding/Display Name — "Complete Your Profile" (Figma 4215:4264). Follows
// the privacy agreement, and only for a signed-in reader with no display name
// yet: a signed-out reader has no profile to complete.
//
// There is no skip. The name is how the reader is addressed everywhere in the
// app ("Bonyo, {display_name}"), so the alternative to setting one is a blank
// greeting rather than a neutral default.
const CARD = { left: 27, top: 145, width: 339, height: 96, radius: 12 };
const FIELD = { left: 16, top: 30, width: 307, height: 44 };
const BUTTON = { width: 187, height: 50, top: 660 };

export function CompleteProfileGate({ onDone }: { onDone: () => void }) {
  const s = useDesignScale();
  const { session } = useAuth();
  const { displayName, ready, save } = useDisplayName();
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Signed out, still loading, or already named: nothing to ask for.
  if (!session || !ready || displayName) return null;

  async function confirm() {
    setSaving(true);
    setError(null);
    const message = await save(draft);
    setSaving(false);
    if (message) {
      setError(message);
      return;
    }
    onDone();
  }

  const canConfirm = draft.trim().length > 0 && !saving;

  return (
    <View style={styles.screen} accessibilityViewIsModal>
      <ScreenBackground />

      <Text style={[styles.title, { top: 84 * s, fontSize: 28 * s, lineHeight: 30 * s }]}>
        Complete Your Profile
      </Text>

      <View
        style={[
          styles.card,
          {
            left: CARD.left * s,
            top: CARD.top * s,
            width: CARD.width * s,
            height: CARD.height * s,
            borderRadius: CARD.radius * s,
          },
        ]}
      >
        {/* The label notches the field's top border, as the account forms do. */}
        <Text
          style={[
            styles.fieldLabel,
            { left: (FIELD.left + 14) * s, top: (FIELD.top - 6) * s, fontSize: 9 * s },
          ]}
        >
          DISPLAY NAME
        </Text>
        <TextInput
          style={[
            styles.field,
            {
              left: FIELD.left * s,
              top: FIELD.top * s,
              width: FIELD.width * s,
              height: FIELD.height * s,
              borderRadius: 999 * s,
              paddingHorizontal: 18 * s,
              fontSize: 13 * s,
            },
          ]}
          value={draft}
          onChangeText={(t) => {
            setDraft(t);
            if (error) setError(null);
          }}
          onSubmitEditing={canConfirm ? confirm : undefined}
          maxLength={DISPLAY_NAME_MAX}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          accessibilityLabel="Display name"
        />
      </View>

      {error ? (
        <Text
          style={[styles.error, { top: (CARD.top + CARD.height + 10) * s, fontSize: 11 * s }]}
          accessibilityRole="alert"
        >
          {error}
        </Text>
      ) : null}

      <Pressable
        onPress={confirm}
        disabled={!canConfirm}
        accessibilityRole="button"
        accessibilityLabel="Confirm"
        accessibilityState={{ disabled: !canConfirm }}
        style={({ pressed }) => [
          styles.button,
          {
            width: BUTTON.width * s,
            height: BUTTON.height * s,
            top: BUTTON.top * s,
            borderRadius: 999 * s,
          },
          !canConfirm && styles.buttonDisabled,
          pressed && canConfirm && styles.pressed,
        ]}
      >
        <Text style={[styles.buttonLabel, { fontSize: 14 * s, letterSpacing: 0.3 * s }]}>
          {saving ? 'Saving…' : 'Confirm'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    backgroundColor: colors.canvas,
    alignItems: 'center',
  },
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
  },
  fieldLabel: {
    position: 'absolute',
    zIndex: 1,
    paddingHorizontal: 4,
    backgroundColor: colors.surface,
    fontFamily: fonts.bold,
    letterSpacing: 0.3,
    color: colors.label,
  },
  field: {
    position: 'absolute',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.pillBorder,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  error: {
    position: 'absolute',
    left: 34,
    right: 34,
    textAlign: 'center',
    fontFamily: fonts.semibold,
    color: colors.incorrect,
  },
  button: {
    position: 'absolute',
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.4 },
  buttonLabel: { fontFamily: fonts.bold, color: colors.onPrimary },
  pressed: { opacity: 0.8 },
});
