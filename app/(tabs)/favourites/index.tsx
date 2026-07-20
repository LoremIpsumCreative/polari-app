import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { IconHeart, IconPhoto, IconTrophy } from '@tabler/icons-react-native';
import { useAuth } from '../../../src/lib/auth';
import { HEART_RED, TROPHY_GOLD } from '../../../src/components/CollectionChrome';
import { colors, fonts } from '../../../src/lib/theme';

const trioFav = require('../../../assets/collections/trio-fav.png');
const trioAch = require('../../../assets/collections/trio-ach.png');
const trioGal = require('../../../assets/collections/trio-gal.png');

// The Collections hub (Figma "My Collections", frame 1351:1709) and its
// signed-out gate (frame 1117:1578). Geometry lives in the mockups' 394-wide
// design space.
const DESIGN_WIDTH = 394;

const SATELLITES: { key: string; label: string; href: Href; Icon: typeof IconHeart; tint: string; x: number; w: number }[] = [
  { key: 'favourites', label: 'Favourites', href: '/favourites/list', Icon: IconHeart, tint: HEART_RED, x: 66, w: 64 },
  { key: 'achievements', label: 'Achievements', href: '/favourites/achievements', Icon: IconTrophy, tint: TROPHY_GOLD, x: 164, w: 68 },
  { key: 'gallery', label: 'Gallery', href: '/favourites/gallery', Icon: IconPhoto, tint: colors.related, x: 266, w: 64 },
];

export default function CollectionsHub() {
  const router = useRouter();
  const { session } = useAuth();
  const { width } = useWindowDimensions();
  const s = Math.min(width, 430) / DESIGN_WIDTH;

  // The trio scene: three tinted spotlight panes (drawn from the Figma vector
  // paths at 16% opacity — a flattened export bakes in a dark backdrop) with
  // the shopper, trophy-winner and photographer layered over them.
  const trio = (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg
        style={StyleSheet.absoluteFill}
        width="100%"
        height="100%"
        viewBox={`0 0 ${394 * s} ${752 * s}`}
      >
        <Path
          d="M43.8655 44.1831 L185.202 0 L118.716 278.999 L0 247.061 L43.8655 44.1831 Z"
          transform={`scale(${s}) matrix(0.8933,-0.4494,0.3115,0.9503,-30.45,337.23)`}
          fill="#DA62AC"
          opacity={0.16}
        />
        <Path
          d="M0 0 L155.5 20 L123 281.5 L45 323 L0 0 Z"
          transform={`scale(${s}) matrix(1,0,0,1,112,240)`}
          fill="#E2B203"
          opacity={0.16}
        />
        <Path
          d="M82.6763 0 L209.261 27.7663 L147.298 275.101 L0 237.141 L82.6763 0 Z"
          transform={`scale(${s}) matrix(-0.8933,-0.4494,-0.3115,0.9503,444.59,351.15)`}
          fill="#2898BD"
          opacity={0.16}
        />
      </Svg>
      <Image
        source={trioFav}
        resizeMode="contain"
        style={{ position: 'absolute', left: 57 * s, top: 292.5 * s, width: 117 * s, height: 255 * s }}
        accessibilityIgnoresInvertColors
      />
      <Image
        source={trioAch}
        resizeMode="contain"
        style={{ position: 'absolute', left: 126 * s, top: 251.5 * s, width: 119 * s, height: 296 * s }}
        accessibilityIgnoresInvertColors
      />
      <Image
        source={trioGal}
        resizeMode="contain"
        style={{
          position: 'absolute',
          left: 241 * s,
          top: 282 * s,
          width: 113 * s,
          height: 269 * s,
          transform: [{ scaleX: -1 }],
        }}
        accessibilityIgnoresInvertColors
      />
    </View>
  );

  if (!session) {
    return (
      <View style={styles.screen}>
        <Text style={[styles.gateCopy, { left: 33 * s, top: 90 * s, width: 330 * s, fontSize: 18 * s, lineHeight: 17.7 * s }]}>
          Sign in or create an account to save favourites, earn achievements and access the
          character gallery
        </Text>
        {trio}
        <Pressable
          style={({ pressed }) => [
            styles.signIn,
            { left: 83 * s, top: 578 * s, width: 229 * s, height: 38 * s },
            pressed && styles.pressed,
          ]}
          onPress={() => router.push('/sign-in')}
          accessibilityRole="button"
        >
          <Text style={[styles.signInText, { fontSize: 14 * s }]}>Sign In</Text>
        </Pressable>
        <Text style={[styles.createLink, { top: 636 * s, fontSize: 12 * s }]}>
          Don’t have an account yet?{' '}
          <Text style={styles.createLinkAccent} onPress={() => router.push('/sign-up')}>
            Create one.
          </Text>
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={[styles.title, { top: 90 * s, fontSize: 60 * s }]}>My Collections</Text>
      {trio}
      {SATELLITES.map(({ key, label, href, Icon, tint, x, w }) => (
        <Pressable
          key={key}
          style={[styles.sat, { left: x * s, top: 573 * s, width: w * s }]}
          onPress={() => router.push(href)}
          accessibilityRole="button"
          accessibilityLabel={label}
        >
          <View style={[styles.satCircle, { width: 52 * s, height: 52 * s, borderRadius: 26 * s }]}>
            <Icon size={23 * s} color={tint} />
          </View>
          <Text style={[styles.satLabel, { fontSize: 10 * s, marginTop: 17 * s }]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, alignItems: 'center' },
  title: { position: 'absolute', fontFamily: fonts.display, color: colors.quizInk },
  gateCopy: {
    position: 'absolute',
    fontFamily: fonts.semibold,
    color: colors.text,
    textAlign: 'center',
  },
  signIn: {
    position: 'absolute',
    backgroundColor: colors.primary,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInText: { fontFamily: fonts.bold, color: colors.onPrimary, letterSpacing: 0.3 },
  pressed: { opacity: 0.85 },
  createLink: { position: 'absolute', fontFamily: fonts.semibold, color: colors.text },
  createLinkAccent: { color: colors.primary },
  sat: { position: 'absolute', alignItems: 'center' },
  satCircle: {
    backgroundColor: colors.inset,
    alignItems: 'center',
    justifyContent: 'center',
  },
  satLabel: { fontFamily: fonts.semibold, color: colors.text },
});
