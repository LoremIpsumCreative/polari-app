# Changelog

Polari's release history, reconstructed and tagged retroactively on 2026-08-03.
Versions follow [Semantic Versioning](https://semver.org). The project is
pre-launch: `1.0.0` is reserved for the first App Store release, so every
version below is `0.x` and the public API is not yet stable.

## [v0.19.0](https://github.com/LoremIpsumCreative/polari-app/releases/tag/v0.19.0) — 2026-08-12

The 2026-08-12 change request.

- **Account screens** get their background back. Three of them scrolled inside an
  opaque view sitting on top of the sparkle pattern, hiding it completely, and
  the Account screen was painting the wrong grey as well.
- **Account rows** re-spaced to the frames — 8 apart inside a block, 24 between,
  38 before Sign Out — and **App Info**, **Privacy Policy** and **Terms and
  Conditions** added, disabled until there is something behind them.
- **Profile fields** are editable in place. Changing your email no longer gates
  the app: the new address shows straight away marked **Unverified**, with
  **Resend Verification Email** beside Change Password.
- **Content advisory** restated, and its button is now an affirmation — "I
  confirm that I am aged 15 or over" — with the age mark on flagged entries
  changed from 18+ to 15+ to agree with it.
- **Suggest Edit** uses the pencil-with-exclamation mark on the definition card.
- **Present animations** wait for their artwork. The box used to pop in partway
  through its own bounce; both the wrapped present and the opening sequence are
  now decoded behind the loading screen before either plays.
- **Results screen** stops cropping the quizmaster — the poses are re-exported at
  their frame sizes and drawn with `contain` — and the Play Again and Finish
  controls return to the frame's lines, 24-30px higher than they sat.

## [v0.18.0](https://github.com/LoremIpsumCreative/polari-app/releases/tag/v0.18.0) — 2026-08-11

The 2026-08-11 change request, batch 5.

- **Content advisory** gates the app after the launch sequence: every cold start
  when signed out, once per account when signed in.
- The running **version** appears in the Account screen's top-right corner,
  read from the manifest so the release bump is the only place it lives.

## [v0.17.0](https://github.com/LoremIpsumCreative/polari-app/releases/tag/v0.17.0) — 2026-08-11

The 2026-08-11 change request, batches 1–4.

- Read the sheet's renamed **In Use** column. `Example` no longer resolves, so
  without this the next sync would have blanked the "in use" text on 292 words.
- **Flagged** column reaches the app: a red flag on flagged rows in the
  dictionary and curated lists, and an 18+ mark on their definition cards.
- Sensitivity note comes off the card — its sheet column is gone and the 18+
  mark carries that signal now. The DB column is left in place.
- Quiz matching board **marks its answers**: a tick or cross straddling each
  tile's top edge once the board is finished. Tiles corrected to the current
  frames (155x72 from y290) — they were 10px out.
- **High Score** now shows on the first signed-in game of a mode, not only when
  a stored best is beaten. Signed-out players still never see it.
- **Suggest Edit** on every definition card, writing to a new write-only
  `suggested_edits` table, with a daily digest of what is waiting.

## [v0.15.1](https://github.com/LoremIpsumCreative/polari-app/releases/tag/v0.15.1) — 2026-08-02

Content sync — dictionary and character artwork

- Dictionary changes detected in the Google Sheet
- Bring dictionary-check onto the v6 actions
- Character art changes detected in the bucket
- Character art changes detected in the bucket

## [v0.15.0](https://github.com/LoremIpsumCreative/polari-app/releases/tag/v0.15.0) — 2026-08-02

Character asset suffixes, Vercel build pipeline, typecheck script, iOS native identity

- Derive character slugs independently of the _polari asset suffix
- Alias the dilly character art onto the "Dilly, the" entry
- Record the _polari rename in the art snapshot
- Build the web bundle on Vercel instead of uploading a prebuilt dist
- Add a typecheck script that survives the TS 6 checker's stack depth
- Correct the third and fourth match-pair colours to their frames
- Match the Account tab accent to its frame; correct the snapshot tracking list
- Commit the refreshed lockfile so npm ci resolves again
- End scrolling screens above the floating tab bar; add the iOS native identity

## [v0.14.0](https://github.com/LoremIpsumCreative/polari-app/releases/tag/v0.14.0) — 2026-07-30

Adopt 393x852 as the single design resolution

- Adopt 393x852 as the one design resolution

## [v0.13.1](https://github.com/LoremIpsumCreative/polari-app/releases/tag/v0.13.1) — 2026-07-29

Fixes — deletion modal on web, quiz scoring, false high score, match reveal

- Fix the deletion modal being unclickable on web
- Rebuild the signed-out Account screen against its frame
- Return the tab bar to the foot of the 852 column
- Use the frames' own outlines and edge gradients for the quiz banners
- Fix quiz scoring, the false high score, and the cut-off results screen
- Reveal the correct pairings when a match board is finished

## [v0.13.0](https://github.com/LoremIpsumCreative/polari-app/releases/tag/v0.13.0) — 2026-07-28

Rebuild wave — filter modal, curated list, definition, Collections, Account, About, Change Password, quiz screens

- Add the Dictionary filter modal and quick filters
- Rebuild the Curated List screen against its redesigned frame
- Rebuild the Dictionary definition screen against its redesigned frame
- Rebuild the Collections sub-screens against their redesigned frames
- Rebuild the Collections hub against its redesigned frames
- Rebuild the Account main screen against its redesigned frames
- Rebuild the About screen against its redesigned frame
- Add the Change Password screen
- Add the deletion confirmation modal
- Anchor the quiz mode fan to the frame instead of the tab-bar inset
- Add the quiz mode How to Play card
- Rebuild the quiz question header and answer grid to their frames
- Rebuild the character and match question variants to their frames
- Sync the quiz countdown and per-mode question frames
- Sync the quiz results controls to their frames
- Make the quiz STREAK field mean what it says

## [v0.12.0](https://github.com/LoremIpsumCreative/polari-app/releases/tag/v0.12.0) — 2026-07-27

852px design height, sparkle background pattern, unified canvas colour

- Hold every screen to the mockups' 852px design height
- Add the sparkle background pattern to the Today screens
- Pin the tab bar to the viewport bottom on web
- Render the sparkle pattern at 70% opacity
- Overlay the sparkle pattern on every screen but the quiz landing and results
- Set the base canvas to #E7E9EC on every screen but quiz landing and results
- Rebuild the Dictionary main screen against its redesigned frame

## [v0.11.0](https://github.com/LoremIpsumCreative/polari-app/releases/tag/v0.11.0) — 2026-07-26

Snapshot-driven sync across Today, Collections and Dictionary

- Extend Figma snapshot to the updated Today screens
- Sync the New Word screen to the updated Today frame
- Capture fill-opacity in the Figma snapshotter
- Sync the Share Card to the updated Today frame
- Rebuild the countdown to the redesigned frames
- Extend Figma snapshot baseline to collections, dictionary, account, and question screens
- Sync Dictionary screen background to its Figma frame
- Sync Collections hub (signed-out gate) to its Figma frame
- Sync CollectionPanel position to the Collections sub-screen frames
- Sync the Dictionary header and Curated Lists rail to its Figma frame

## [v0.10.0](https://github.com/LoremIpsumCreative/polari-app/releases/tag/v0.10.0) — 2026-07-25

Design-fidelity tooling — Figma snapshot and pixel diff

- Fix character art check workflow runtime
- Add design-fidelity tooling: Figma snapshot + pixel diff
- Sync the quiz question screen to the current frame; map the quiz restructure

## [v0.9.0](https://github.com/LoremIpsumCreative/polari-app/releases/tag/v0.9.0) — 2026-07-21

Navbar 2.0, quiz screen rebuilds, Digitale variable family

- Remove the tab bar's satellite fan
- Fidelity pass to the revised mockups: navbar, quiz landing, results, word card
- Rebuild the Share Card to the revised Figma frame
- Add the unwrap screen's asymmetric shapes
- Reposition the Collections trio to the revised mockup
- Correct Word of the Day geometry to match the mockup exactly
- Match the Collections gate copy to the mockup's line height
- Rebuild the tab bar to the Navbar 2.0 component
- Run every screen's background the full height of the device
- Spread the tab bar's tabs edge to edge
- Rebuild the quiz results screens to the revised frames
- Rebuild the quiz landing to the revised frame
- Move to the Digitale variable family and add the navbar's blur pane
- Land the countdown screens on the frame's cap lines
- Correct the quiz question screen against its frame
- Replicate the quiz landing frame as drawn
- updated README

## [v0.8.0](https://github.com/LoremIpsumCreative/polari-app/releases/tag/v0.8.0) — 2026-07-18

Mouse Memoirs display face, Figma navbar, redesigned quiz, gift-wrapped Word of the Day

- Remove fill-in-the-blank and typed-recall quiz formats
- Add Mouse Memoirs as the display face
- Match the tab bar to the Figma navbar: Collections, order, accents, geometry
- Implement the redesigned quiz screens from Figma
- Gift-wrap the Word of the Day behind a daily unlock
- Replace the Collection screens with the Figma redesigns

## [v0.7.0](https://github.com/LoremIpsumCreative/polari-app/releases/tag/v0.7.0) — 2026-07-14

Three quiz game modes with mode fan, countdown and scoring

- Add three quiz game modes with a mode fan, countdown and scoring

## [v0.6.0](https://github.com/LoremIpsumCreative/polari-app/releases/tag/v0.6.0) — 2026-07-11

Framed share card, Baker-verified word list, design-token palette

- Redesign share card to the framed Figma v4 (node 1058-1546)
- Align share card and Today with the latest Figma frames
- Verify the word list against Baker-derived lexicons; split multi-spellings
- Retoken the app to the Figma design-token palette

## [v0.5.0](https://github.com/LoremIpsumCreative/polari-app/releases/tag/v0.5.0) — 2026-07-10

About Polari, quiz variety, spaced repetition, achievements, gallery, streak freezes, Supabase artwork

- Add "About Polari" history & sources screen
- Camp voice pass on error and empty states
- Extend Sheet sync to own the cultural fields (presence-safe)
- Add quiz variety: reverse and typed-answer questions with a difficulty ramp
- Add spaced-repetition review: per-word progress + due-word review mode
- Pixel refresh of the word card per Figma 1042-205
- Fix deck sliver colours and quiz-ring scope
- Add Achievements and Gallery to the dashboard fan
- Add streak safety net: freezes, milestone recharge and celebrations
- Serve character art from Supabase Storage with change tracking

## [v0.4.0](https://github.com/LoremIpsumCreative/polari-app/releases/tag/v0.4.0) — 2026-07-07

Cultural context layer and themed collections

- Add cultural layer foundations + per-entry context on word cards
- Add themed collections: discovery rail + collection detail

## [v0.3.0](https://github.com/LoremIpsumCreative/polari-app/releases/tag/v0.3.0) — 2026-07-06

Quiz intro stage, Vercel web deploy, font pipeline, Google Sheet dictionary sync

- Quiz intro stage per Figma + navbar refresh
- Grey canvas, muted card icons, floating day pill, fullscreen art
- Add web build config and Vercel static deploy
- Use autoPort for polari-web preview server
- Fix missing web assets on deploy and switch fonts to woff2
- Load platform-specific font formats: woff2 on web, otf on native
- Add reviewable Google Sheet dictionary sync workflow
- Rebuild Share card to match the Figma "Word of the day" design

## [v0.2.0](https://github.com/LoremIpsumCreative/polari-app/releases/tag/v0.2.0) — 2026-07-05

Phone-width web layout, reworked navbar, first Figma redesign

- Cap the web layout at smartphone width
- Rework navbar: Settings, centred Dashboard with satellite fan
- Figma redesign: blue palette, character art, day browsing

## [v0.1.0](https://github.com/LoremIpsumCreative/polari-app/releases/tag/v0.1.0) — 2026-07-03

First working app — dictionary, Word of the Day, auth, favourites, streaks, quiz, share card, feedback

- Initial commit
- Set up Expo Router shell, Supabase schema, and word-list seed script
- Add Dictionary and Word of the Day screens
- Add auth, favourites, and streaks
- Add Duolingo-style quiz with per-user high scores
- Add shareable word card
- Add feedback form and account deletion
- Add floating-bubble tab bar with Tabler icons
- Restyle: Finito design language, Digitale type, pride accents
- Restyle as atomic lounge: retro palette + character illustrations
