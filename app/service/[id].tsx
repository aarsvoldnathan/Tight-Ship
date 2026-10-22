import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { DueRow } from '../../src/components/DueRow';
import { Button, Field, SectionTitle } from '../../src/components/ui';
import { serviceTaskDue } from '../../src/maintenance';
import { useStore } from '../../src/store';
import { colors, radius, spacing } from '../../src/theme';
import { ASSET_LABELS, ServiceTask } from '../../src/types';

export default function AssetDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    assets,
    serviceTasks,
    serviceLogs,
    updateHours,
    addServiceTask,
    deleteServiceTask,
    completeServiceTask,
    deleteAsset,
  } = useStore();

  const asset = assets.find((a) => a.id === id);
  const [hours, setHours] = useState('');
  const [taskName, setTaskName] = useState('');
  const [everyHours, setEveryHours] = useState('');
  const [everyDays, setEveryDays] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!asset) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Equipment not found.</Text>
      </View>
    );
  }

  const now = new Date();
  const myTasks = serviceTasks.filter((t) => t.assetId === asset.id);
  const myLogs = serviceLogs.filter((l) => l.assetId === asset.id);

  const saveHours = async () => {
    const err = await updateHours(asset.id, Number(hours));
    if (err) setError(err);
    else {
      setError(null);
      setHours('');
    }
  };

  const add = async () => {
    const h = everyHours.trim() ? Number(everyHours) : null;
    const d = everyDays.trim() ? Number(everyDays) : null;
    if (!taskName.trim()) return setError('Enter a service name.');
    if (h === null && d === null) return setError('Set a repeat interval in hours, days, or both.');
    if ((h !== null && (!Number.isFinite(h) || h <= 0)) || (d !== null && (!Number.isInteger(d) || d <= 0))) {
      return setError('Intervals must be positive numbers (days must be whole).');
    }
    setError(null);
    const err = await addServiceTask({
      assetId: asset.id,
      name: taskName.trim(),
      intervalHours: h,
      intervalDays: d,
    });
    if (err) setError(err);
    else {
      setTaskName('');
      setEveryHours('');
      setEveryDays('');
    }
  };

  const markDone = async (task: ServiceTask) => {
    const err = await completeServiceTask(task, asset, {});
    if (err) Alert.alert('Could not log service', err);
  };

  const confirmDelete = () =>
    Alert.alert('Delete equipment?', 'This also deletes its services and history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const err = await deleteAsset(asset.id);
          if (err) Alert.alert('Could not delete', err);
          else router.back();
        },
      },
    ]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: asset.name }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.kind}>{ASSET_LABELS[asset.kind]}</Text>
          {asset.serial ? <Text style={styles.line}>Serial / VIN: {asset.serial}</Text> : null}
          <Text style={styles.line}>Current reading: {asset.currentHours}</Text>
          <Text style={styles.muted}>
            Updated {new Date(asset.hoursUpdatedAt).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.section}>
          <SectionTitle>Update hours / miles</SectionTitle>
          <Field label="New reading" value={hours} onChangeText={setHours} keyboardType="decimal-pad" />
          <Button label="Save reading" kind="secondary" onPress={saveHours} />
        </View>

        <View style={styles.section}>
          <SectionTitle>Services</SectionTitle>
          {myTasks.length === 0 ? (
            <Text style={styles.muted}>No services yet. Add one below.</Text>
          ) : (
            myTasks.map((t) => (
              <View key={t.id} style={{ marginBottom: spacing.sm }}>
                <DueRow linked={false} item={serviceTaskDue(t, asset, now)} />
                <View style={styles.actions}>
                  <View style={{ flex: 1 }}>
                    <Button label="Mark done" onPress={() => markDone(t)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      label="Delete"
                      kind="danger"
                      onPress={async () => {
                        const err = await deleteServiceTask(t.id);
                        if (err) Alert.alert('Could not delete', err);
                      }}
                    />
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <SectionTitle>Add service</SectionTitle>
          <Field label="Service" value={taskName} onChangeText={setTaskName} placeholder="e.g. Engine oil and filter" />
          <Field label="Repeat every (hours / miles)" value={everyHours} onChangeText={setEveryHours} keyboardType="decimal-pad" />
          <Field label="Or every (days)" value={everyDays} onChangeText={setEveryDays} keyboardType="number-pad" />
          <Text style={styles.hint}>Set one or both. Whichever comes first makes it due.</Text>
          {error && <Text style={styles.error}>{error}</Text>}
          <Button label="Add service" kind="secondary" onPress={add} />
        </View>

        <View style={styles.section}>
          <SectionTitle>History</SectionTitle>
          {myLogs.length === 0 ? (
            <Text style={styles.muted}>Nothing logged yet.</Text>
          ) : (
            myLogs.map((l) => (
              <View key={l.id} style={styles.logRow}>
                <Text style={styles.logTask}>{l.taskName}</Text>
                <Text style={styles.muted}>
                  {new Date(l.performedAt).toLocaleDateString()}
                  {l.hoursAtService !== null ? ` · ${l.hoursAtService}` : ''}
                  {l.performedBy ? ` · ${l.performedBy}` : ''}
                </Text>
              </View>
            ))
          )}
        </View>

        <Button label="Delete equipment" kind="danger" onPress={confirmDelete} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: spacing.lg * 2 },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  kind: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  line: { color: colors.text, fontSize: 16 },
  muted: { color: colors.muted, fontSize: 14 },
  hint: { color: colors.muted, fontSize: 13, marginBottom: spacing.md },
  section: { marginBottom: spacing.lg },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  error: { color: colors.danger, marginBottom: spacing.md },
  logRow: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderLeftWidth: 5,
    borderLeftColor: colors.ok,
    borderRadius: radius,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  logTask: { color: colors.text, fontSize: 17, fontWeight: '700' },
});
