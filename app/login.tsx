import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../src/auth';
import { supabaseConfigured } from '../src/supabase';
import { colors, spacing } from '../src/theme';
import { Button, Field } from '../src/components/ui';

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (mode: 'in' | 'up') => {
    if (!email.trim() || password.length < 6) {
      setMessage('Enter your email and a password of at least 6 characters.');
      return;
    }
    setBusy(true);
    setMessage(null);
    const err = await (mode === 'in' ? signIn : signUp)(email.trim(), password);
    setBusy(false);
    if (err) setMessage(err);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Tight Ship</Text>
        <Text style={styles.subtitle}>Run a tight ship at home and at work.</Text>

        {!supabaseConfigured && (
          <Text style={styles.warning}>
            Supabase is not configured. Copy .env.example to .env and add your project URL and
            publishable key, then restart the app.
          </Text>
        )}

        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
        />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />

        {message && <Text style={styles.message}>{message}</Text>}

        <View style={{ gap: spacing.sm }}>
          <Button label="Sign in" onPress={() => submit('in')} disabled={busy} />
          <Button label="Create account" kind="secondary" onPress={() => submit('up')} disabled={busy} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingTop: spacing.lg * 3, flexGrow: 1 },
  title: { color: colors.text, fontSize: 34, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 16, marginTop: spacing.xs, marginBottom: spacing.lg },
  warning: { color: colors.warn, fontSize: 14, marginBottom: spacing.md },
  message: { color: colors.danger, fontSize: 14, marginBottom: spacing.md },
});
