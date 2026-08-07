import { Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import IconChevronLeft from '@tabler/icons-react-native/IconChevronLeft';
import { colors, headerOptions } from '../../src/lib/theme';

export default function AuthLayout() {
  const router = useRouter();

  // Accounts are optional, so every auth screen needs an obvious way back
  // into the app (these screens are pushed as a separate stack group, which
  // otherwise renders no back affordance on its first screen).
  function goBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  return (
    <Stack
      screenOptions={{
        ...headerOptions,
        headerLeft: () => (
          <Pressable
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={12}
          >
            <IconChevronLeft size={26} color={colors.text} />
          </Pressable>
        ),
      }}
    >
      {/* Sign In, Create Account and Forgot Password moved into the profile
          stack — their frames draw the tab bar and an "Account" back chip,
          neither of which this group can render. Password recovery stays
          because it is opened cold from an email link. */}
      <Stack.Screen name="reset-password" options={{ title: 'Choose a new password' }} />
    </Stack>
  );
}
