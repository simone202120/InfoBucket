import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth';
import { useTheme } from '@/theme';
import { Button, ErrorBanner, TextField, Wordmark } from '@/theme/components';

type Mode = 'signin' | 'signup';

/** Login a singolo utente (email/password). Il redirect post-accesso è gestito
 *  dall'auth-gate nel layout root. */
export default function LoginScreen() {
  const t = useTheme();
  const { signInWithPassword, signUpWithPassword } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const action = mode === 'signin' ? signInWithPassword : signUpWithPassword;
    const { error: err } = await action(email.trim(), password);
    if (err) setError(err);
    setBusy(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'center', padding: t.gutter, gap: t.space[5] }}
      >
        <View style={{ gap: t.space[4], marginBottom: t.space[4] }}>
          <Wordmark />
          <Text style={{ color: t.colors.textSecondary, fontFamily: t.font.read, fontSize: t.type.read.size, lineHeight: t.type.read.lh }}>
            {mode === 'signin' ? 'Accedi per continuare.' : 'Crea il tuo account.'}
          </Text>
        </View>

        {error ? <ErrorBanner message={error} onDismiss={() => setError(null)} /> : null}

        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="tu@esempio.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          autoCapitalize="none"
        />

        <Button onPress={submit} fullWidth disabled={busy || !email || !password}>
          {mode === 'signin' ? 'Accedi' : 'Crea account'}
        </Button>
        <Button variant="ghost" onPress={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }}>
          {mode === 'signin' ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
        </Button>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
