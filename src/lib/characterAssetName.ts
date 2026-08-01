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

/** Word slug for a bucket object name, with or without the suffix. */
export function slugFromAssetName(objectName: string): string {
  return objectName.replace(/\.png$/i, '').replace(/_polari$/i, '');
}

/** Canonical bucket object name for a word slug. */
export function assetNameForSlug(slug: string): string {
  return `${slug}${ASSET_SUFFIX}.png`;
}
