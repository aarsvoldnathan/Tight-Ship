import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { confirmAction, notify } from '../../src/dialog';
import { DueRow } from '../../src/components/DueRow';
import { Button, Field, SectionTitle } from '../../src/components/ui';
import { propertyTaskDue } from '../../src/maintenance';
import { useStore } from '../../src/store';
import { colors, radius, spacing } from '../../src/theme';
import { KIND_LABELS, MaintenanceTask } from '../../src/types';

export default function PropertyDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    properties,
    propertyTasks,
    propertyLogs,
    addPropertyTask,
    deletePropertyTask,
    deleteProperty,
    completePropertyTask,
  } = useStore();

  const property = properties.find((p) => p.id === id);
  const [taskName, setTaskName] = useState('');
  const [interval, setInterval] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!property) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Property not found.</Text>
      </View>
    );
  }

  const now = new Date();
  const myTasks = propertyTasks.filter((t) => t.propertyId === property.id);
  const myLogs = propertyLogs.filter((l) => l.propertyId === property.id);
  const totalCost = myLogs.reduce((sum, l) => sum + (l.cost ?? 0), 0);

  const add = async () => {
    const days = interval.trim() ? Number(interval) : null;
    if (!taskName.trim()) return setError('Enter a task name.');
    if (days !== null && (!Number.isInteger(days) || days <= 0)) {
      return setError('Repeat interval must be a whole number of days.');
    }
    setError(null);
    const err = await addPropertyTask(property.id, taskName.trim(), days);
    if (err) setError(err);
    else {
      setTaskName('');
      setInterval('');
    }
  };

  const markDone = async (task: MaintenanceTask) => {
    const err = await completePropertyTask(task, {});
    if (err) notify('Could not log service', err);
  };

  const confirmDelete = () =>
    confirmAction('Delete property?', 'This also deletes its tasks and history.', 'Delete', async () => {
      const err = await deleteProperty(property.id);
      if (err) notify('Could not delete', err);
      else router.back();
    });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: property.name }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.kind}>{KIND_LABELS[property.kind]}</Text>
          {property.address ? <Text style={styles.line}>{property.address}</Text> : null}
          {property.tenantName ? (
            <Text style={styles.line}>
              Tenant: {property.tenantName}
              {property.tenantContact ? ` (${property.tenantContact})` : ''}
            </Text>
          ) : null}
          {property.monthlyRent !== null ? (
            <Text style={styles.line}>Rent: ${property.monthlyRent.toFixed(2)} / month</Text>
          ) : null}
          {property.notes ? <Text style={styles.muted}>{property.notes}</Text> : null}
          <Text style={styles.line}>Total maintenance spend: ${totalCost.toFixed(2)}</Text>
        </View>

        <View style={styles.section}>
          <SectionTitle>Maintenance tasks</SectionTitle>
          {myTasks.length === 0 ? (
            <Text style={styles.muted}>No tasks yet. Add a recurring task below.</Text>
          ) : (
            myTasks.map((t) => (
              <View key={t.id} style={{ marginBottom: spacing.sm }}>
                <DueRow linked={false} item={propertyTaskDue(t, property, now)} />
                <View style={styles.actions}>
                  <View style={{ flex: 1 }}>
                    <Button label="Mark done" onPress={() => markDone(t)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      label="Delete"
                      kind="danger"
                      onPress={async () => {
                        const err = await deletePropertyTask(t.id);
                        if (err) notify('Could not delete', err);
                      }}
                    />
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <SectionTitle>Add task</SectionTitle>
          <Field
            label="Task"
            value={taskName}
            onChangeText={setTaskName}
            placeholder="e.g. Replace furnace filter"
          />
          <Field
            label="Repeat every (days, optional)"
            value={interval}
            onChangeText={setInterval}
            keyboardType="number-pad"
          />
          {error && <Text style={styles.error}>{error}</Text>}
          <Button label="Add task" kind="secondary" onPress={add} />
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
                  {l.performedBy ? ` · ${l.performedBy}` : ''}
                  {l.cost !== null ? ` · $${l.cost.toFixed(2)}` : ''}
                </Text>
              </View>
            ))
          )}
        </View>

        <Button label="Delete property" kind="danger" onPress={confirmDelete} />
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
