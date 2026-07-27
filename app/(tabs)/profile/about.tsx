import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  IconBinoculars,
  IconChevronLeft,
  IconExternalLink,
  IconUser,
} from '@tabler/icons-react-native';
import { colors, radii, spacing, fonts } from '../../../src/lib/theme';
import { ScreenBackground } from '../../../src/components/ScreenBackground';

const auntie = require('../../../assets/characters/auntie.png');

// Account/About (Figma 2172:3625): back chip y52, the title beside Auntie
// bleeding off the left edge at y115, the lede at y177, then the prose card
// from y285 and Further Reading from y941.

// Long-form "About Polari" — the history behind the app, plus sources and
// further reading. Content is deliberately factual and credited: the app
// borrows a real community's heritage, so it says where the words come from.

type Section = { title: string; body: string };

const SECTIONS: Section[] = [
  {
    title: 'What is Polari?',
    body:
      'Polari is a form of cant slang — a coded way of speaking — used in Britain through the twentieth century, above all by gay men, drag performers and people of the theatre. It stitched together Italianate words brought by sailors and showfolk, Romani, Yiddish, Cockney back-slang and rhyming slang, and the lingo of fairgrounds and circuses. To vada a bona omi — to clock a handsome man — was to speak a language the straight world around you could not follow.',
  },
  {
    title: 'Why a secret language?',
    body:
      'For most of Polari’s life, sex between men was a crime in Britain. A careless word in the wrong company could mean arrest, blackmail, the loss of a job or a family. Polari let queer people find each other, gossip, flirt and warn one another in plain sight — camp code hiding in a sentence. It flourished in theatre dressing rooms, merchant navy messes, West End bars and street markets from the 1900s to the 1960s.',
  },
  {
    title: 'Fame, then fade',
    body:
      'In the late 1960s the BBC radio show Round the Horne beamed Polari into millions of homes through Julian and Sandy — two outrageously camp characters played by Hugh Paddick and Kenneth Williams. The joke’s cover was blown just as it became less needed: the partial decriminalisation of homosexuality in 1967 began easing the danger that had made a secret language necessary. Within a generation, Polari had largely fallen out of use — remembered by elders, recorded by scholars, and at real risk of being lost.',
  },
  {
    title: 'A living inheritance',
    body:
      'Polari never entirely died. Naff, camp, butch, zhuzh and a clutch of other words slipped into everyday English. Drag and ballroom culture carry its spirit, and its echoes turn up everywhere from Drag Race to Polari-blessed Bibles performed by the Sisters of Perpetual Indulgence. Learning it now is an act of remembrance and of joy: keeping faith with the people who needed it, and delighting in how fabulous they made survival sound.',
  },
  {
    title: 'A note on the words themselves',
    body:
      'Polari grew up in criminalised, working-class and sexual worlds — bars, docks, cottages and stage doors. Some entries in this dictionary are bawdy, blunt or tied to practices that were dangerous precisely because they were policed. We present them in their historical context, without sanitising and without judgement. They are part of the record of how a community lived.',
  },
];

type Source = { title: string; author: string; detail: string; url: string };

const SOURCES: Source[] = [
  {
    title: 'Fabulosa! The Story of Polari',
    author: 'Paul Baker',
    detail: 'The definitive popular history of Polari (Reaktion Books, 2019).',
    url: 'https://reaktionbooks.co.uk/work/fabulosa',
  },
  {
    title: 'Polari: The Lost Language of Gay Men',
    author: 'Paul Baker',
    detail: 'The scholarly study and lexicon this field rests on (Routledge, 2002).',
    url: 'https://www.routledge.com/Polari-The-Lost-Language-of-Gay-Men/Baker/p/book/9780415261807',
  },
  {
    title: 'Bishopsgate Institute',
    author: 'LGBTQ+ Archives',
    detail: 'Home to major UK queer history collections, including Polari material.',
    url: 'https://www.bishopsgate.org.uk/collections/lgbtq-history',
  },
  {
    title: 'Round the Horne',
    author: 'Julian & Sandy',
    detail: 'The BBC radio sketches that carried Polari to a mass audience (1965–68).',
    url: 'https://www.bbc.co.uk/programmes/b007jqvp',
  },
];

export default function AboutScreen() {
  const router = useRouter();
  return (
    <View style={styles.screenBg}>
      <ScreenBackground />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))}
          style={({ pressed }) => [styles.backChip, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Back to Account"
        >
          <IconChevronLeft size={10} color={colors.text} />
          <Text style={styles.backChipText}>Account</Text>
        </Pressable>

        {/* Auntie bleeds off the left edge behind the heading block. */}
        <Image source={auntie} style={styles.auntie} resizeMode="contain" accessibilityIgnoresInvertColors />

        <View style={styles.heading}>
          <Text style={styles.title}>About Polari</Text>
          <Text style={styles.ledeTitle}>The story behind the lingo</Text>
          <Text style={styles.ledeBody}>
            Where Polari came from, why it mattered, and why it’s worth keeping alive.
          </Text>
        </View>

        <View style={styles.card}>
          {SECTIONS.map((sec) => (
            <View key={sec.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{sec.title}</Text>
              <Text style={styles.sectionBody}>{sec.body}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.sourcesHeader}>
            <View style={styles.sourcesIcon}>
              <IconBinoculars size={15} color={colors.onPrimary} />
            </View>
            <Text style={styles.sourcesTitle}>Further Reading</Text>
          </View>
          <Text style={styles.sourcesNote}>
            This app stands on the work of the scholars, archivists and elders who recorded
            Polari before it could vanish. Definitions are drawn from the community record;
            errors are ours, not theirs.
          </Text>
          {SOURCES.map((src) => (
            <Pressable
              key={src.title}
              onPress={() => Linking.openURL(src.url)}
              style={({ pressed }) => [styles.sourceRow, pressed && styles.sourcePressed]}
              accessibilityRole="link"
              accessibilityLabel={`Open ${src.title}`}
            >
              <View style={styles.sourceText}>
                <Text style={styles.sourceTitle}>{src.title}</Text>
                <View style={styles.authorRow}>
                  <View style={styles.authorIcon}>
                    <IconUser size={10} color={colors.primary} />
                  </View>
                  <Text style={styles.authorName}>{src.author}</Text>
                </View>
                <Text style={styles.sourceDetail}>{src.detail}</Text>
              </View>
              <IconExternalLink size={16} color={colors.primary} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Wrapper so the sparkle pattern stays fixed behind the scrolling content.
  screenBg: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingBottom: spacing.xl + 56 },

  backChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 52,
    marginLeft: 17,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radii.pill,
    backgroundColor: colors.inset,
  },
  backChipText: { fontFamily: fonts.semibold, fontSize: 10, letterSpacing: 0.3, color: colors.text },
  pressed: { opacity: 0.7 },

  // auntie 1: x0 y115, 119x195, running off the left edge.
  auntie: { position: 'absolute', left: 0, top: 115, width: 119, height: 195 },

  // The heading block sits to the right of her, from x134.
  heading: { marginLeft: 134, marginRight: 22, marginTop: 7 },
  title: { fontFamily: fonts.display, fontSize: 36, lineHeight: 40, color: colors.text },
  ledeTitle: {
    marginTop: 47,
    fontFamily: fonts.bold,
    fontSize: 14,
    letterSpacing: 0.3,
    color: colors.text,
  },
  ledeBody: {
    marginTop: 11,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.3,
    color: colors.text,
  },

  // Prose card x23 y285 w349, and Further Reading below it.
  card: {
    marginTop: 63,
    marginHorizontal: 23,
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 30,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.fieldBorder,
  },
  section: { gap: 16 },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 14, letterSpacing: 0.3, color: colors.text },
  sectionBody: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.3,
    color: colors.text,
  },

  sourcesHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  sourcesIcon: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourcesTitle: { fontFamily: fonts.bold, fontSize: 14, letterSpacing: 0.3, color: colors.text },
  sourcesNote: {
    marginTop: -14,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.3,
    color: colors.text,
  },

  sourceRow: {
    marginTop: -14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 22,
    paddingVertical: 12,
    backgroundColor: colors.primarySoft,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.fieldBorder,
  },
  sourcePressed: { opacity: 0.7 },
  sourceText: { flex: 1, gap: 4 },
  sourceTitle: {
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 15,
    letterSpacing: 0.3,
    color: colors.text,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  authorIcon: {
    width: 23,
    height: 23,
    borderRadius: 999,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorName: { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 0.3, color: colors.primary },
  sourceDetail: {
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.3,
    color: colors.text,
  },
});
