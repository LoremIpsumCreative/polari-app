import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { IconHeart, IconPhoto, IconTrophy } from '@tabler/icons-react-native';
import { useAuth } from '../../../src/lib/auth';
import { HEART_RED, TROPHY_GOLD } from '../../../src/components/CollectionChrome';
import { colors, fonts, DESIGN_WIDTH } from '../../../src/lib/theme';
import { ScreenBackground } from '../../../src/components/ScreenBackground';

const favourette = require('../../../assets/collections/hub-favourette.png');
const achieevee = require('../../../assets/collections/hub-achieevee.png');
const gallerie = require('../../../assets/collections/hub-gallerie.png');

// The Collections hub — signed-in frame 1351:1709, signed-out gate 1117:1578.
// Geometry lives in the mockups' 393-wide design space.

// Icons Row Container, x62 y602 w271: three slots whose 55px circles sit at
// the container's own offsets, labels 72 below the row's top.
const SATELLITES: {
  key: string;
  label: string;
  href: Href;
  Icon: typeof IconHeart;
  tint: string;
  x: number;
  w: number;
  iconX: number;
}[] = [
  { key: 'favourites', label: 'Favourites', href: '/favourites/list', Icon: IconHeart, tint: HEART_RED, x: 62, w: 64, iconX: 4.5 },
  { key: 'achievements', label: 'Achievements', href: '/favourites/achievements', Icon: IconTrophy, tint: TROPHY_GOLD, x: 156, w: 83, iconX: 14 },
  { key: 'gallery', label: 'Gallery', href: '/favourites/gallery', Icon: IconPhoto, tint: colors.related, x: 269, w: 64, iconX: 4.5 },
];

export default function CollectionsHub() {
  const router = useRouter();
  const { session } = useAuth();
  const { width } = useWindowDimensions();
  const s = Math.min(width, 430) / DESIGN_WIDTH;

  // The trio scene (Hero Images, 1825:2862): three tinted spotlight panes at
  // 20% behind the shopper, trophy-winner and photographer. Each pane and two
  // of the three figures carry their own rotation, so every layer is boxed at
  // the frame's outer size with the artwork rotated inside it.
  const trio = (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={{
          position: 'absolute',
          left: 4.22 * s,
          top: 285.5 * s,
          width: 209.634 * s,
          height: 291.093 * s,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Svg
          width={153.11 * s}
          height={233.923 * s}
          viewBox="0 0 153.11 233.923"
          style={{ transform: [{ rotate: '-26.7deg' }, { skewX: '-8.56deg' }] }}
        >
          <Path
            d="M29.8097 20.616L153.11 0L90.3303 233.923L0 191.205L29.8097 20.616Z"
            fill="#DA62AC"
            opacity={0.2}
          />
        </Svg>
      </View>

      <View
        style={{
          position: 'absolute',
          left: 163 * s,
          top: 281.34 * s,
          width: 235.634 * s,
          height: 313.817 * s,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Svg
          width={177.977 * s}
          height={246.075 * s}
          viewBox="0 0 177.977 246.075"
          style={{
            transform: [{ rotate: '-153.3deg' }, { scaleY: -1 }, { skewX: '8.56deg' }],
          }}
        >
          <Path
            d="M45.7906 20.5908L177.977 0L99.3744 246.075L0 185.977L45.7906 20.5908Z"
            fill="#2898BD"
            opacity={0.2}
          />
        </Svg>
      </View>

      <Svg
        width={164 * s}
        height={293 * s}
        viewBox="0 0 164 293"
        style={{ position: 'absolute', left: 102 * s, top: 233 * s }}
      >
        <Path d="M0 0L164 32.3895L129.39 293H69.2208L0 0Z" fill="#E2B203" opacity={0.2} />
      </Svg>

      <View
        style={{
          position: 'absolute',
          left: 84.5 * s,
          top: 189 * s,
          width: 167.14 * s,
          height: 328.315 * s,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image
          source={achieevee}
          resizeMode="contain"
          style={{
            width: 152.805 * s,
            height: 321.76 * s,
            transform: [{ rotate: '2.58deg' }],
          }}
          accessibilityIgnoresInvertColors
        />
      </View>

      <Image
        source={favourette}
        resizeMode="contain"
        style={{ position: 'absolute', left: 55 * s, top: 291 * s, width: 102 * s, height: 264 * s }}
        accessibilityIgnoresInvertColors
      />

      <View
        style={{
          position: 'absolute',
          left: 218.14 * s,
          top: 295.22 * s,
          width: 129.513 * s,
          height: 266.894 * s,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image
          source={gallerie}
          resizeMode="contain"
          style={{
            width: 117.987 * s,
            height: 261.908 * s,
            transform: [{ rotate: '2.55deg' }],
          }}
          accessibilityIgnoresInvertColors
        />
      </View>
    </View>
  );

  if (!session) {
    return (
      <View style={styles.screen}>
        <ScreenBackground />
        <Text style={[styles.gateCopy, { left: 66 * s, top: 89 * s, width: 264 * s, fontSize: 16 * s, lineHeight: 20 * s }]}>
          Sign in or create an account to save favourites, earn achievements and access the
          character gallery
        </Text>
        {trio}
        <Pressable
          style={({ pressed }) => [
            styles.signIn,
            // Frame: x105 w184, which centres on the 393 column. The old
            // 80/199 sat 17 left of centre and ran 15 wide.
            { left: 105 * s, top: 608 * s, width: 184 * s, height: 50 * s },
            pressed && styles.pressed,
          ]}
          onPress={() => router.push('/profile/sign-in')}
          accessibilityRole="button"
        >
          <Text style={[styles.signInText, { fontSize: 14 * s }]}>Sign In</Text>
        </Pressable>
        <Text style={[styles.createLink, { top: 673 * s, fontSize: 14 * s }]}>
          Don’t have an account yet?{' '}
          <Text style={styles.createLinkAccent} onPress={() => router.push('/profile/create-account')}>
            Create one
          </Text>
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenBackground />
      <Text style={[styles.title, { top: 90 * s, fontSize: 60 * s }]}>Collections</Text>
      {trio}
      {SATELLITES.map(({ key, label, href, Icon, tint, x, w, iconX }) => (
        <Pressable
          key={key}
          style={[styles.sat, { left: x * s, top: 602 * s, width: w * s }]}
          onPress={() => router.push(href)}
          accessibilityRole="button"
          accessibilityLabel={label}
        >
          <View
            style={[
              styles.satCircle,
              { marginLeft: iconX * s, width: 55 * s, height: 55 * s, borderRadius: 27.5 * s },
            ]}
          >
            <Icon size={24 * s} color={tint} />
          </View>
          <Text style={[styles.satLabel, { fontSize: 10 * s, marginTop: 17 * s }]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas, alignItems: 'center' },
  title: { position: 'absolute', fontFamily: fonts.display, color: colors.text },
  gateCopy: {
    position: 'absolute',
    fontFamily: fonts.regular,
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
  createLink: { position: 'absolute', fontFamily: fonts.regular, color: colors.text },
  // The frame underlines it and carries no full stop.
  createLinkAccent: { color: colors.primary, textDecorationLine: 'underline' },
  sat: { position: 'absolute' },
  satCircle: {
    backgroundColor: colors.inset,
    alignItems: 'center',
    justifyContent: 'center',
  },
  satLabel: { fontFamily: fonts.semibold, color: colors.text, textAlign: 'center' },
});
