import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { IconBook2, IconExternalLink } from '@tabler/icons-react-native';
import { colors, radii, spacing, fonts } from '../../../src/lib/theme';

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

type Source = { title: string; detail: string; url: string };

const SOURCES: Source[] = [
  {
    title: 'Fabulosa! The Story of Polari — Paul Baker',
    detail: 'The definitive popular history of Polari (Reaktion Books, 2019).',
    url: 'https://reaktionbooks.co.uk/work/fabulosa',
  },
  {
    title: 'Polari: The Lost Language of Gay Men — Paul Baker',
    detail: 'The scholarly study and lexicon this field rests on (Routledge, 2002).',
    url: 'https://www.routledge.com/Polari-The-Lost-Language-of-Gay-Men/Baker/p/book/9780415261807',
  },
  {
    title: 'Bishopsgate Institute — LGBTQ+ Archives',
    detail: 'Home to major UK queer history collections, including Polari material.',
    url: 'https://www.bishopsgate.org.uk/collections/lgbtq-history',
  },
  {
    title: 'Round the Horne — Julian & Sandy',
    detail: 'The BBC radio sketches that carried Polari to a mass audience (1965–68).',
    url: 'https://www.bbc.co.uk/programmes/b007jqvp',
  },
];

export default function AboutScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.lede}>
        The story behind the lingo — where Polari came from, why it mattered, and why it’s
        worth keeping alive.
      </Text>

      {SECTIONS.map((s) => (
        <View key={s.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{s.title}</Text>
          <Text style={styles.sectionBody}>{s.body}</Text>
        </View>
      ))}

      <View style={styles.sourcesCard}>
        <View style={styles.sourcesHeader}>
          <IconBook2 size={18} color={colors.primary} />
          <Text style={styles.sourcesTitle}>Sources & further reading</Text>
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
              <Text style={styles.sourceDetail}>{src.detail}</Text>
            </View>
            <IconExternalLink size={16} color={colors.textFaint} />
          </Pressable>
        ))}
      </View>

      <Text style={styles.footer}>Bona to vada you. 💙</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl + 56, gap: spacing.md },
  lede: {
    fontFamily: fonts.italic,
    fontSize: 16,
    lineHeight: 23,
    color: colors.textMuted,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.text,
  },
  sectionBody: {
    fontFamily: fonts.regular,
    fontSize: 14.5,
    lineHeight: 22,
    color: colors.textMuted,
  },
  sourcesCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sourcesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sourcesTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
  },
  sourcesNote: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  sourcePressed: { opacity: 0.7 },
  sourceText: { flex: 1, gap: 2 },
  sourceTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
  },
  sourceDetail: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    lineHeight: 17,
    color: colors.textMuted,
  },
  footer: {
    fontFamily: fonts.italic,
    fontSize: 14,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
