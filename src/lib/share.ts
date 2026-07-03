import { Platform, type View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import type { Word } from '../types/database';

function shareText(word: Word): string {
  const pron = word.pronunciation ? ` (${word.pronunciation})` : '';
  return `Polari word of the day: ${word.term}${pron} — ${word.definition}`;
}

// Captures the card view as a PNG and hands it to the platform share sheet.
// Web: tries the Web Share API with the image file, then falls back to a
// download, then to text-only sharing. Never throws for a user-cancelled share.
export async function shareWordCard(cardRef: React.RefObject<View | null>, word: Word) {
  if (Platform.OS !== 'web') {
    const uri = await captureRef(cardRef, {
      format: 'png',
      quality: 1,
      // Upscale the 340pt-wide card to social-friendly 1080px output
      width: 1080,
      height: 1350,
    });
    await Sharing.shareAsync(uri, {
      mimeType: 'image/png',
      dialogTitle: `Share “${word.term}”`,
    });
    return;
  }

  // Web path
  try {
    const dataUri = await captureRef(cardRef, {
      format: 'png',
      quality: 1,
      result: 'data-uri',
      width: 1080,
      height: 1350,
    });

    const blob = await (await fetch(dataUri)).blob();
    const file = new File([blob], `polari-${word.slug}.png`, { type: 'image/png' });

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text: shareText(word) });
      return;
    }

    // No file sharing available (desktop browsers) — download instead
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = `polari-${word.slug}.png`;
    link.click();
  } catch (err) {
    // AbortError = user closed the share sheet; not a failure
    if (err instanceof Error && err.name === 'AbortError') return;

    // Image capture unsupported — degrade to text share / clipboard
    if (navigator.share) {
      await navigator.share({ text: shareText(word) }).catch(() => {});
    } else {
      await navigator.clipboard?.writeText(shareText(word));
    }
  }
}
