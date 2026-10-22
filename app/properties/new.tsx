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
import { KIND_LABELS, PropertyKind } from '../../src/types';

const KINDS: PropertyKind[] = ['home', 'rental', 'other'];

export default function NewProperty() {
  const router = useRouter();
  const { addProperty } = useStore();
  const [kind, setKind] = useState<PropertyKind>('rental');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [tenantContact, setTenantContact] = useState('');
  const [rent, setRent] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!name.trim()) {
      setError('Give the property a name.');
      return;
    }
    const rentValue = rent.trim() ? Number(rent) : undefined;
    if (rentValue !== undefined && (!Number.isFinite(rentValue) || rentValue < 0)) {
      setError('Enter a valid monthly rent.');
      return;
    }
    setBusy(true);
    const err = await addProperty({
      name: name.trim(),
      address: address.trim(),
      kind,
      tenantName: kind === 'rental' ? tenantName.trim() : undefined,
      tenantContact: kind === 'rental' ? tenantContact.trim() : undefined,
      monthlyRent: kind === 'rental' ? rentValue : undefined,
      notes: notes.trim(),
    });
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
                {KIND_LABELS[k]}
              </Text>
            </Pressable>
          ))}
        </View>

        <Field label="Name" value={name} onChangeText={setName} placeholder="e.g. 123 Oak St" />
        <Field label="Address" value={address} onChangeText={setAddress} />
        {kind === 'rental' && (
          <>
            <Field label="Tenant name" value={tenantName} onChangeText={setTenantName} />
            <Field label="Tenant contact" value={tenantContact} onChangeText={setTenantContact} />
            <Field
              label="Monthly rent ($)"
              value={rent}
              onChangeText={setRent}
              keyboardType="decimal-pad"
            />
          </>
        )}
        <Field label="Notes" value={notes} onChangeText={setNotes} multiline />

        {error && <Text style={styles.error}>{error}</Text>}
        <Button label="Save property" onPress={save} disabled={busy} />
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
  kindText: { color: colors.muted, fontWeight: '700' },
  kindTextActive: { color: colors.accent },
  error: { color: colors.danger, marginBottom: spacing.md },
});
