// Naming for character artwork in the Supabase "characters" bucket.
//
// The object name carries the word slug — that is what maps a PNG to a
// dictionary entry — plus a "_polari" branding suffix, e.g. "bull_polari.png"
// for the word `bull`. The suffix is decoration, so it is stripped to recover
// the slug. Objects uploaded before the suffix landed ("bull.png") still
// resolve, which is what makes renaming the bucket safe to do at any time.
//
// Kept free of asset `require()` calls so Node scripts (scripts/check-art.ts)
// can import it; src/lib/characterArt.ts cannot be imported outside the app.

const ASSET_SUFFIX = '_polari';

// A few objects are named more loosely than the word slug they illustrate.
// Rather than rename the artwork, map the short name onto the real slug here.
// Keep this small: every entry is an exception someone has to remember.
const SLUG_ALIASES: Record<string, string> = {
  // "dilly_polari.png" illustrates the entry "Dilly, the" (slug `dilly-the`).
  // There is no bare `dilly` word, so without this the art never renders.
  dilly: 'dilly-the',
  // "antique-hq_polari.png" is a typo: the entry is "Antique HP", HP being
  // homie-palone. The artwork itself is fine, only its filename is wrong, so
  // it is mapped here rather than renamed in the bucket.
  'antique-hq': 'antique-hp',
};

/** Word slug for a bucket object name, with or without the suffix. */
export function slugFromAssetName(objectName: string): string {
  const base = objectName.replace(/\.png$/i, '').replace(/_polari$/i, '');
  return SLUG_ALIASES[base] ?? base;
}

/** Canonical bucket object name for a word slug. */
export function assetNameForSlug(slug: string): string {
  return `${slug}${ASSET_SUFFIX}.png`;
}
