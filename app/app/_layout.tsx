import 'react-native-url-polyfill/auto';
import { BricolageGrotesque_500Medium, BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque';
import { Newsreader_400Regular, Newsreader_500Medium } from '@expo-google-fonts/newsreader';
import { SpaceMono_400Regular } from '@expo-google-fonts/space-mono';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { ShareIntentProvider, useShareIntentContext } from 'expo-share-intent';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth, type AuthStatus } from '@/features/auth';
import { extractFirstUrl } from '@/lib/source';
import { ThemeProvider, ToastProvider, useTheme } from '@/theme';
import { Wordmark } from '@/theme/components';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    BricolageGrotesque_500Medium,
    BricolageGrotesque_700Bold,
    Newsreader_400Regular,
    Newsreader_500Medium,
    SpaceMono_400Regular,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ShareIntentProvider>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <StatusBar style="auto" />
              <RootNavigator />
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </ShareIntentProvider>
    </SafeAreaProvider>
  );
}

/** Quando arriva un contenuto condiviso da un'altra app (solo se l'utente è
 *  loggato), apre la cattura precompilata con l'URL e azzera lo share intent. */
function useSharedCapture(status: AuthStatus) {
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext();
  const router = useRouter();
  useEffect(() => {
    if (status !== 'signedIn' || !hasShareIntent) return;
    const url = shareIntent.webUrl ?? extractFirstUrl(shareIntent.text);
    if (url) router.push({ pathname: '/add', params: { url } });
    resetShareIntent();
  }, [status, hasShareIntent, shareIntent, resetShareIntent, router]);
}

/** Reindirizza fra area autenticata e login in base allo stato di auth. */
function useAuthGate(status: AuthStatus) {
  const segments = useSegments();
  const router = useRouter();
  useEffect(() => {
    if (status === 'loading') return;
    const onLogin = segments[0] === 'login';
    if (status === 'signedOut' && !onLogin) router.replace('/login');
    else if (status === 'signedIn' && onLogin) router.replace('/');
  }, [status, segments, router]);
}

function RootNavigator() {
  const { status } = useAuth();
  useAuthGate(status);
  useSharedCapture(status);

  if (status === 'loading') return <SplashLoader />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
      <Stack.Screen name="add" options={{ presentation: 'modal' }} />
      <Stack.Screen name="item/[id]" />
      <Stack.Screen name="bucket/[id]" />
      <Stack.Screen name="archive" />
      <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

function SplashLoader() {
  const t = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: t.space[7], backgroundColor: t.colors.bg }}>
      <Wordmark />
      <ActivityIndicator color={t.colors.primary} />
    </View>
  );
}
