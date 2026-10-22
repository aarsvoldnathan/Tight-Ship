import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button, Field } from '../../src/components/ui';
import { useStore } from '../../src/store';
import { colors, radius, spacing, touch } from '../../src/theme';
import { ASSET_LABELS, AssetKind } from '../../src/types';

const KINDS: AssetKind[] = ['vehicle', 'machine', 'equipment', 'other'];

export default function NewAsset() {
  const router = useRouter();
  const { addAsset } = useStore();
  const [kind, setKind] = useState<AssetKind>('vehicle');
  const [name, setName] = useState('');
  const [serial, setSerial] = useState('');
  const [hours, setHours] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!name.trim()) return setError('Give the equipment a name.');
    const h = hours.trim() ? Number(hours) : 0;
    if (!Number.isFinite(h) || h < 0) return setError('Enter a valid number of hours.');
    setError(null);
    setBusy(true);
    const err = await addAsset({ name: name.trim(), serial: serial.trim(), kind, currentHours: h });
    setBusy(false);
    if (err) setError(err);
    else router.back();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.kinds}>
          {KINDS.map((k) => (
            <Pressable
              key={k}
              onPress={() => setKind(k)}
              style={[styles.kind, kind === k && styles.kindActive]}
            >
              <Text style={[styles.kindText, kind === k && styles.kindTextActive]}>
                {ASSET_LABELS[k]}
              </Text>
            </Pressable>
          ))}
        </View>
        <Field label="Name" value={name} onChangeText={setName} placeholder="e.g. 2019 F-250" />
        <Field label="Serial / VIN (optional)" value={serial} onChangeText={setSerial} autoCapitalize="characters" />
        <Field
          label="Current hours or miles"
          value={hours}
          onChangeText={setHours}
          keyboardType="decimal-pad"
          placeholder="0"
        />
        {error && <Text style={styles.error}>{error}</Text>}
        <Button label="Save equipment" onPress={save} disabled={busy} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingBottom: spacing.lg * 2 },
  kinds: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  kind: {
    flex: 1,
    minHeight: touch,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kindActive: { borderColor: colors.accent, backgroundColor: '#2A2008' },
  kindText: { color: colors.muted, fontWeight: '700', fontSize: 12 },
  kindTextActive: { color: colors.accent },
  error: { color: colors.danger, marginBottom: spacing.md },
});
