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
          d="M44.4119 45.4529 L156.702 0 L134.932 296.242 L1.23202e-05 275.271 L44.4119 45.4529 Z"
          transform={`scale(${s}) matrix(0.893,-0.449,0.311,0.95,-37.734,277.92)`}
          fill="#DA62AC"
          opacity={0.16}
        />
        <Path
          d="M0 0 L164.5 0 L145.5 344.5 L47.5 335 L0 0 Z"
          transform={`scale(${s}) matrix(1,0,0,1,109.5,184)`}
          fill="#E2B203"
          opacity={0.16}
        />
        <Path
          d="M82.6763 13.8804 L186.84 0 L147.298 288.982 L-6.05684e-06 251.022 L82.6763 13.8804 Z"
          transform={`scale(${s}) matrix(-0.893,-0.449,-0.311,0.95,448.912,293.964)`}
          fill="#2898BD"
          opacity={0.16}
        />
      </Svg>
      <Image
        source={trioFav}
        resizeMode="contain"
        style={{ position: 'absolute', left: 57 * s, top: 248.5 * s, width: 117 * s, height: 255 * s }}
        accessibilityIgnoresInvertColors
      />
      <Image
        source={trioAch}
        resizeMode="contain"
        style={{ position: 'absolute', left: 126 * s, top: 207.5 * s, width: 119 * s, height: 296 * s }}
        accessibilityIgnoresInvertColors
      />
      <Image
        source={trioGal}
        resizeMode="contain"
        style={{
          position: 'absolute',
          left: 250 * s,
          top: 248.5 * s,
          width: 107 * s,
          height: 255 * s,
          transform: [{ scaleX: -1 }],
        }}
        accessibilityIgnoresInvertColors
      />
    </View>
  );

  if (!session) {
    return (
      <View style={styles.screen}>
        <Text style={[styles.gateCopy, { left: 33 * s, top: 90 * s, width: 330 * s, fontSize: 18 * s, lineHeight: 26 * s }]}>
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
