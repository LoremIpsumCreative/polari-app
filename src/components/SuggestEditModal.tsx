import { useState, type ComponentType } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import IconBook2 from '@tabler/icons-react-native/IconBook2';
import IconChevronDown from '@tabler/icons-react-native/IconChevronDown';
import IconMail from '@tabler/icons-react-native/IconMail';
import IconNotes from '@tabler/icons-react-native/IconNotes';
import IconPencil from '@tabler/icons-react-native/IconPencil';
import IconQuote from '@tabler/icons-react-native/IconQuote';
import IconStack2 from '@tabler/icons-react-native/IconStack2';
import IconWorldSearch from '@tabler/icons-react-native/IconWorldSearch';
import type { IconProps } from '../lib/icons';
import type { Word } from '../types/database';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { colors, fonts } from '../lib/theme';
import { useDesignScale } from '../lib/designScale';

// Today/Suggest Edit — a reader proposing a correction to one row of the card
// they are looking at (frames: No Input, Input, Success).
//
// The veil is the same #121212 at 50% over a 3.5px backdrop blur the global
// loading states use; measured off all three exports it composites to #7D7E80,
// exactly as they do. Worth consolidating into one Scrim once the loading work
// lands — they are the same object, drawn twice.
const SCRIM = 'rgba(18, 18, 18, 0.5)';
const BLUR_RADIUS = 3.5;

// Geometry in the 393x852 design frame.
const CARD = { left: 22, top: 123, width: 349, height: 551, radius: 20 };
const TITLE_CAP_TOP = 164;
const FIELD_ROW = { left: 53, top: 247, width: 287, height: 50 };
const INPUT_BOX = { left: 53, top: 317, width: 287, height: 236 };
const SUBMIT = { left: 103, top: 592, width: 187, height: 50 };
// The sent state drops the form for a short confirmation and a way out.
const SENT_CARD = { left: 56, top: 298, width: 282, height: 79, radius: 14 };
const SENT_CLOSE = { left: 109, top: 460, width: 175, height: 50 };

// The rows a reader can correct, each carrying the icon its own row wears on
// the definition card — picking "Definition" in the dropdown should look like
// the DEFINITION row it will change. Values are the DB columns, so a suggestion
// names the field it applies to without a translation step.
const FIELDS: { value: string; label: string; Icon: ComponentType<IconProps> }[] = [
  { value: 'definition', label: 'Definition', Icon: IconBook2 },
  { value: 'example', label: 'In use', Icon: IconQuote },
  { value: 'origin', label: 'Origin', Icon: IconWorldSearch },
  { value: 'cultural_context', label: 'Culture', Icon: IconStack2 },
  { value: 'notes_variants', label: 'Notes', Icon: IconNotes },
];

export function SuggestEditModal({
  word,
  visible,
  onClose,
}: {
  word: Word;
  visible: boolean;
  onClose: () => void;
}) {
  const s = useDesignScale();
  const { session } = useAuth();
  const [field, setField] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chosen = FIELDS.find((f) => f.value === field) ?? null;
  // Both halves have to be there: a field with no words, or words against no
  // field, is not something anyone can act on.
  const ready = chosen !== null && text.trim().length > 0 && !busy;

  function reset() {
    setField(null);
    setPicking(false);
    setText('');
    setSent(false);
    setError(null);
  }

  function dismiss() {
    reset();
    onClose();
  }

  async function submit() {
    if (!ready) return;
    setBusy(true);
    setError(null);
    const { error: insertError } = await supabase.from('suggested_edits').insert({
      word_id: word.id,
      field: chosen.value,
      suggestion: text.trim(),
      // Claim yourself or nobody — the table's policy allows nothing else.
      user_id: session?.user.id ?? null,
    });
    setBusy(false);
    if (insertError) setError('That didn’t send. Please try again.');
    else setSent(true);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={dismiss}>
      {/* Tapping the veil is the expected way out of a sheet like this. */}
      <Pressable style={styles.scrim} onPress={dismiss} accessibilityLabel="Close">
        {sent ? (
          <>
            {/* Stop propagation: a tap on the card itself must not dismiss. */}
            <Pressable
              onPress={() => {}}
              style={[
                styles.card,
                {
                  left: SENT_CARD.left * s,
                  top: SENT_CARD.top * s,
                  width: SENT_CARD.width * s,
                  height: SENT_CARD.height * s,
                  borderRadius: SENT_CARD.radius * s,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10 * s,
                },
              ]}
            >
              <IconMail size={20 * s} color={colors.text} />
              <Text style={[styles.sentText, { fontSize: 20 * s }]}>Feedback sent!</Text>
            </Pressable>
            <Pressable
              onPress={dismiss}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.closeButton,
                {
                  left: SENT_CLOSE.left * s,
                  top: SENT_CLOSE.top * s,
                  width: SENT_CLOSE.width * s,
                  height: SENT_CLOSE.height * s,
                  borderRadius: 999 * s,
                  borderWidth: 2 * s,
                },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.closeLabel, { fontSize: 14 * s, letterSpacing: 0.3 * s }]}>
                Close
              </Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            onPress={() => setPicking(false)}
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
            <Text
              style={[
                styles.title,
                { top: (TITLE_CAP_TOP - CARD.top - 6.6) * s, fontSize: 60 * s, lineHeight: 54 * s },
              ]}
            >
              Suggest Edit
            </Text>

            {/* Which row is being corrected. Closed it shows the chosen field
                and its own icon; untouched it shows a pencil and a prompt. */}
            <Pressable
              onPress={() => setPicking((p) => !p)}
              accessibilityRole="button"
              accessibilityLabel={chosen ? `Field: ${chosen.label}` : 'Choose a field'}
              style={[
                styles.control,
                {
                  left: (FIELD_ROW.left - CARD.left) * s,
                  top: (FIELD_ROW.top - CARD.top) * s,
                  width: FIELD_ROW.width * s,
                  height: FIELD_ROW.height * s,
                  paddingHorizontal: 14 * s,
                  gap: 12 * s,
                },
              ]}
            >
              {chosen ? (
                <chosen.Icon size={16 * s} color={colors.text} />
              ) : (
                <IconPencil size={16 * s} color={colors.textFaint} />
              )}
              <Text
                style={[
                  styles.controlLabel,
                  { fontSize: 12 * s },
                  !chosen && { color: colors.textFaint },
                ]}
              >
                {chosen ? chosen.label : 'Field'}
              </Text>
              <IconChevronDown size={16 * s} color={colors.textFaint} />
            </Pressable>

            {picking ? (
              <ScrollView
                style={[
                  styles.menu,
                  {
                    left: (FIELD_ROW.left - CARD.left) * s,
                    top: (FIELD_ROW.top - CARD.top + FIELD_ROW.height + 4) * s,
                    width: FIELD_ROW.width * s,
                    maxHeight: 200 * s,
                    borderRadius: 8 * s,
                  },
                ]}
              >
                {FIELDS.map((f) => (
                  <Pressable
                    key={f.value}
                    onPress={() => {
                      setField(f.value);
                      setPicking(false);
                    }}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.menuRow,
                      { paddingHorizontal: 14 * s, paddingVertical: 12 * s, gap: 12 * s },
                      pressed && styles.menuRowPressed,
                    ]}
                  >
                    <f.Icon size={16 * s} color={colors.text} />
                    <Text style={[styles.controlLabel, { fontSize: 12 * s }]}>{f.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}

            {/* The suggestion itself, in the same labelled-fieldset dress the
                definition card's rows wear. */}
            <View
              style={{
                position: 'absolute',
                left: (INPUT_BOX.left - CARD.left) * s,
                top: (INPUT_BOX.top - CARD.top) * s,
                width: INPUT_BOX.width * s,
                height: INPUT_BOX.height * s,
              }}
            >
              <TextInput
                value={text}
                onChangeText={setText}
                multiline
                textAlignVertical="top"
                maxLength={2000}
                accessibilityLabel="Suggested edit"
                style={[
                  styles.input,
                  { borderRadius: 8 * s, padding: 14 * s, fontSize: 12 * s, lineHeight: 16 * s },
                ]}
              />
              <View style={[styles.labelPatch, { left: 8 * s, paddingHorizontal: 4 * s }]}>
                <Text style={[styles.label, { fontSize: 7 * s, letterSpacing: 0.4 * s }]}>
                  SUGGESTED EDIT
                </Text>
              </View>
            </View>

            {error ? (
              <Text style={[styles.error, { top: (560 - CARD.top) * s, fontSize: 11 * s }]}>
                {error}
              </Text>
            ) : null}

            <Pressable
              onPress={submit}
              disabled={!ready}
              accessibilityRole="button"
              accessibilityState={{ disabled: !ready }}
              style={({ pressed }) => [
                styles.submit,
                {
                  left: (SUBMIT.left - CARD.left) * s,
                  top: (SUBMIT.top - CARD.top) * s,
                  width: SUBMIT.width * s,
                  height: SUBMIT.height * s,
                  borderRadius: 999 * s,
                },
                // Disabled is the frame's pale blue rather than a dimmed
                // primary: the button is legible, it just isn't ready yet.
                !ready && styles.submitDisabled,
                pressed && ready && styles.pressed,
              ]}
            >
              <Text style={[styles.submitLabel, { fontSize: 14 * s, letterSpacing: 0.3 * s }]}>
                {busy ? 'Sending…' : 'Submit'}
              </Text>
            </Pressable>
          </Pressable>
        )}
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: SCRIM,
    // backdropFilter is web-only; native would need expo-blur, and the 50%
    // scrim already does the work the blur only softens. Same trade the tab
    // bar's blur pane and the global loading states make.
    ...Platform.select({
      web: { backdropFilter: `blur(${BLUR_RADIUS}px)` } as object,
      default: {},
    }),
  },
  card: { position: 'absolute', backgroundColor: colors.surface },
  title: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: fonts.display,
    color: colors.text,
  },
  control: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.fieldBorder,
    borderRadius: 8,
  },
  controlLabel: { flex: 1, fontFamily: fonts.semibold, color: colors.text, letterSpacing: 0.3 },
  menu: {
    position: 'absolute',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.fieldBorder,
    zIndex: 2,
  },
  menuRow: { flexDirection: 'row', alignItems: 'center' },
  menuRowPressed: { backgroundColor: colors.primarySoft },
  input: {
    flex: 1,
    backgroundColor: colors.inset,
    borderWidth: 1,
    borderColor: colors.fieldBorder,
    fontFamily: fonts.regular,
    color: colors.text,
    letterSpacing: 0.3,
  },
  labelPatch: { position: 'absolute', top: -5, backgroundColor: colors.surface },
  label: { color: colors.label, fontFamily: fonts.extrabold, textTransform: 'uppercase' },
  submit: {
    position: 'absolute',
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: { backgroundColor: '#A9C8F7' },
  submitLabel: { fontFamily: fonts.bold, color: colors.onPrimary },
  sentText: { fontFamily: fonts.display, color: colors.text },
  closeButton: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.primary,
  },
  closeLabel: { fontFamily: fonts.bold, color: colors.primary },
  error: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: fonts.semibold,
    color: colors.danger,
  },
  pressed: { opacity: 0.7 },
});
