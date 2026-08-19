```
╔════════════════════════════════════════════════════════════════════════╗
║                                                                        ║
║       ██████╗   ██████╗  ██╗       █████╗  ██████╗  ██╗                ║
║       ██╔══██╗ ██╔═══██╗ ██║      ██╔══██╗ ██╔══██╗ ██║                ║
║       ██████╔╝ ██║   ██║ ██║      ███████║ ██████╔╝ ██║                ║
║       ██╔═══╝  ██║   ██║ ██║      ██╔══██║ ██╔══██╗ ██║                ║
║       ██║      ╚██████╔╝ ███████╗ ██║  ██║ ██║  ██║ ██║                ║
║       ╚═╝       ╚═════╝  ╚══════╝ ╚═╝  ╚═╝ ╚═╝  ╚═╝ ╚═╝                ║
║                                                                        ║
║                    L E A R N   T H E   L I N G O                       ║
║                                                                        ║
╚════════════════════════════════════════════════════════════════════════╝
```

![GitHub Release](https://img.shields.io/github/v/release/loremipsumcreative/polari-app?style=flat&logo=github&logoSize=auto&label=pre-release&color=%231D7AFC)

> A character-led **Polari dictionary and learning app** preserving the
> historical queer cant through a daily word, cultural context, collections,
> quizzes, spaced repetition, streaks, achievements, and shareable cards.

<p align="center">
  <a href="https://polari-app.vercel.app"><b>&#9654; Live app</b></a>
  &nbsp;&middot;&nbsp; Expo &nbsp;&middot;&nbsp; React Native &nbsp;&middot;&nbsp; TypeScript &nbsp;&middot;&nbsp; Supabase &nbsp;&middot;&nbsp; Vercel
</p>

---

## ✦ What it does

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│   Google Sheet     ┌──────────────────┐       ╔══════════════════╗     │
│   + character  ──► │  Supabase        │  ──►  ║  Today ·         ║     │
│     artwork        │  Postgres · Auth │       ║  Dictionary ·    ║     │
│                    │  Storage · RLS   │       ║  Quiz · Review   ║     │
│                    └──────────────────┘       ╚══════════════════╝     │
│                                                                        │
│   One Expo codebase runs on iOS, Android, and a phone-width web app.   │
│   Dictionary and artwork changes are checked and batched separately.   │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

Polari turns a 347-entry dictionary into a daily learning habit. Every word
can carry pronunciation, origin, usage, cultural context, related terms, and
original character art. The core dictionary, daily word, and quizzes work
without an account; signing in adds favourites, progress, streaks, scores,
achievements, and spaced-repetition review.

## ✦ Features

```
╭─ LEARN ────────────────────────────────────────────────────────────────╮
│ • Gift-wrapped Word of the Day with previous-day browsing              │
│ • Searchable A–Z dictionary with word / phrase filters                 │
│ • Definition, pronunciation, example, origin, culture, and usage       │
│ • Related-word links and themed collections                            │
╰────────────────────────────────────────────────────────────────────────╯

╭─ PRACTISE ─────────────────────────────────────────────────────────────╮
│ • 10 Questions · 1 Minute · 1 Life quiz modes                          │
│ • Meaning, reverse, and typed-recall question formats                  │
│ • Per-word mastery and due-word spaced-repetition review               │
│ • High scores, answer streaks, and progress tracking                   │
╰────────────────────────────────────────────────────────────────────────╯

╭─ COLLECT ──────────────────────────────────────────────────────────────╮
│ • Favourite words and curated thematic collections                     │
│ • Achievement badges derived from real learning activity               │
│ • Character gallery backed by live Supabase artwork                    │
│ • Daily streaks, milestones, and banked streak freezes                 │
╰────────────────────────────────────────────────────────────────────────╯

╭─ SHARE & CULTURE ──────────────────────────────────────────────────────╮
│ • Figma-designed portrait share cards with character art + QR code     │
│ • “About Polari” history, source attribution, and further reading      │
│ • Usage states: Common · Rare · Historical                             │
│ • Sensitive historical context presented without flattening the past   │
╰────────────────────────────────────────────────────────────────────────╯
```

## ✦ App map

```
┌─────────────┬──────────────────────────────────────────────────────────┐
│ AREA        │ WHAT IT SHOWS                                            │
├─────────────┼──────────────────────────────────────────────────────────┤
│ Collections │ Favourites · Achievements · Gallery · curated sets       │
│ Dictionary  │ Search, filters, A–Z list, entry detail, related words   │
│ Today       │ Daily reveal, character art, word card, day navigation   │
│ Quiz        │ Three game modes plus due-word review                    │
│ Account     │ Streaks, words learned, feedback, history, account data  │
└─────────────┴──────────────────────────────────────────────────────────┘
```

## ✦ Quick start

```bash
npm install       # install dependencies
npm start         # Expo development server
npm run ios       # open the iOS development target
npm run android   # open the Android development target
npm run web       # open the web app
```

Create a local `.env.local` before starting the app:

```
┌─ Required public variables ────────────────────────────────────────────┐
│                                                                        │
│  EXPO_PUBLIC_SUPABASE_URL       = https://<project>.supabase.co        │
│  EXPO_PUBLIC_SUPABASE_ANON_KEY  = <Supabase publishable / anon key>    │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

The anon key is safe to ship in the client. Authorization is enforced by
Supabase Auth and row-level security. Never expose the service-role key in the
app bundle or commit it to the repository.

## ✦ Dictionary workflow

The Google Sheet is the editable content source. Changes are deliberately
reviewed as a batch instead of being written to production on every edit.

```bash
npm run words:check   # fetch the Sheet and write dictionary-changes.md
npm run words:apply   # apply the reviewed batch to Supabase
npm run seed:words    # full idempotent seed / repair by slug
```

```
Google Sheet edit ─► words:check ─► dictionary-changes.md ─► review
                                                        └─► words:apply ─► Supabase
```

Existing `sort_order` values remain stable so the Word of the Day rotation
does not change when the Sheet is reordered. New slugs are appended after the
current maximum.

## ✦ Character artwork

Character art is served from the public Supabase Storage bucket
`characters`, using the dictionary slug as the filename:

```text
abdabs.png
blaz-queen.png
charpering-omee.png
vada-varda.png
```

Upload or overwrite a PNG in the bucket and it appears on the next app load;
no app release is required. Bundled images remain as offline/failure fallbacks.

```bash
npm run art:check   # compare the bucket with the committed snapshot
npm run art:ack     # record and acknowledge the current bucket state
```

The checker writes `art-changes.md` and flags filenames that do not match a
dictionary slug. Scheduled GitHub Actions monitor both dictionary and artwork
changes daily.

## ✦ Project structure

```
polari-app/
├── app/
│   ├── (tabs)/                 ◄─ Collections · Dictionary · Today · Quiz · Account
│   ├── (auth)/                 ◄─ sign in · sign up · password recovery
│   └── _layout.tsx             ◄─ providers, fonts, phone-width web shell
├── src/
│   ├── components/             ◄─ cards, navbar, collection chrome, share UI
│   ├── lib/                    ◄─ auth, words, SRS, streaks, art, quiz, sharing
│   └── types/database.ts       ◄─ generated Supabase types
├── assets/
│   ├── characters/             ◄─ bundled artwork fallbacks
│   ├── fonts/                  ◄─ Digitale otf + MouseMemoirs ttf (native only)
│   ├── quiz/                   ◄─ quiz-stage artwork
│   └── share/                  ◄─ share-card frame + QR assets
├── scripts/                    ◄─ dictionary + artwork check/apply tooling
├── supabase/
│   ├── migrations/             ◄─ schema, RLS, cultural + learning data
│   └── functions/              ◄─ account-deletion edge function
├── .github/workflows/          ◄─ scheduled dictionary + artwork monitors
├── public/fonts/               ◄─ variable woff2 served to web via CSS @font-face
├── app.json                    ◄─ Expo configuration
├── vercel.json                 ◄─ static SPA deployment + route fallback
└── README.md
```

## ✦ Tech stack

```
┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│ Expo + RN      │  │ Supabase       │  │ Expo Router    │  │ Vercel         │
│ SDK 57 · TS    │  │ DB·Auth·RLS    │  │ file routes    │  │ static web SPA │
└────────────────┘  └────────────────┘  └────────────────┘  └────────────────┘
```

[Expo](https://expo.dev) and [React Native](https://reactnative.dev) provide
the shared iOS, Android, and web codebase. [Expo Router](https://docs.expo.dev/router/introduction/)
handles file-based navigation. [Supabase](https://supabase.com) provides
Postgres, Auth, row-level security, RPCs, Edge Functions, and character-art
storage. [Vercel](https://vercel.com) hosts the static web export.

The interface uses the custom **Digitale** family, Tabler icons, and original
Polari character illustrations. The web build remains intentionally mobile:
wide browsers centre the app in a phone-width column rather than introducing a
desktop breakpoint.

## ✦ Deployment

Export the static web app, then deploy the prebuilt `dist/` directory:

```bash
npx expo export -p web
npx vercel deploy --prod
```

```
Expo export ─► dist/ ─► Vercel ─► polari-app.vercel.app
                         │
                         └──────► live Supabase data + character CDN
```

Vercel serves the existing static assets first, then rewrites unmatched routes
to `index.html` so deep links such as `/dictionary/queen` remain valid.

---

<p align="center"><sub>Queer history · one word at a time · bona to vada you.</sub></p>
