import { Link } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../src/auth';
import { DueRow } from '../src/components/DueRow';
import { Tile } from '../src/components/Tile';
import { UpdateBanner } from '../src/components/UpdateBanner';
import { Button, SectionTitle } from '../src/components/ui';
import { getDueItems, getStaleAssets } from '../src/maintenance';
import { useStore } from '../src/store';
import { colors, radius, spacing } from '../src/theme';
import { ASSET_LABELS, KIND_LABELS } from '../src/types';

function Empty({ text }: { text: string }) {
  return <Text style={styles.empty}>{text}</Text>;
}

export default function Hub() {
  const { ready, properties, propertyTasks, assets, serviceTasks, refresh } = useStore();
  const { signOut } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  const now = new Date();
  const due = getDueItems(properties, propertyTasks, assets, serviceTasks, now);
  const overdue = due.filter((d) => d.status === 'overdue');
  const dueSoon = due.filter((d) => d.status === 'dueSoon');
  const stale = getStaleAssets(assets, now);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={colors.accent}
          onRefresh={async () => {
            setRefreshing(true);
            await refresh();
            setRefreshing(false);
          }}
        />
      }
    >
      <UpdateBanner />

      <View style={styles.tiles}>
        <Tile label="Overdue" value={overdue.length} color={colors.danger} />
        <Tile label="Due soon" value={dueSoon.length} color={colors.warn} />
        <Tile label="Hours stale" value={stale.length} color={colors.accent} />
      </View>

      <View style={styles.section}>
        <SectionTitle>Needs attention</SectionTitle>
        {due.length === 0 ? (
          <Empty text="Nothing due across your home, rentals and equipment. Sleep well." />
        ) : (
          due.map((d) => <DueRow key={`${d.module}-${d.id}`} item={d} />)
        )}
      </View>

      <View style={styles.section}>
        <SectionTitle>Service: vehicles and equipment</SectionTitle>
        {assets.length === 0 ? (
          <Empty text="No equipment yet." />
        ) : (
          assets.map((a) => (
            <Link key={a.id} href={{ pathname: '/service/[id]', params: { id: a.id } }} asChild>
              <Pressable style={styles.listRow}>
                <Text style={styles.rowTitle}>{a.name}</Text>
                <Text style={styles.rowMeta}>
                  {ASSET_LABELS[a.kind]} · {a.currentHours}
                </Text>
              </Pressable>
            </Link>
          ))
        )}
        <Link href="/service/new" asChild>
          <Pressable style={styles.addButton}>
            <Text style={styles.addText}>+ Add equipment</Text>
          </Pressable>
        </Link>
      </View>

      <View style={styles.section}>
        <SectionTitle>Home and rentals</SectionTitle>
        {properties.length === 0 ? (
          <Empty text="No properties yet." />
        ) : (
          properties.map((p) => (
            <Link key={p.id} href={{ pathname: '/properties/[id]', params: { id: p.id } }} asChild>
              <Pressable style={styles.listRow}>
                <Text style={styles.rowTitle}>{p.name}</Text>
                <Text style={styles.rowMeta}>
                  {KIND_LABELS[p.kind]}
                  {p.address ? ` · ${p.address}` : ''}
                </Text>
              </Pressable>
            </Link>
          ))
        )}
        <Link href="/properties/new" asChild>
          <Pressable style={styles.addButton}>
            <Text style={styles.addText}>+ Add property</Text>
          </Pressable>
        </Link>
      </View>

      <Button label="Sign out" kind="secondary" onPress={signOut} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: spacing.lg * 2 },
  tiles: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  section: { marginBottom: spacing.lg },
  empty: { color: colors.muted, fontSize: 15, paddingVertical: spacing.sm },
  listRow: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius,
    padding: spacing.md,
    marginBottom: spacing.sm,
    minHeight: 64,
  },
  rowTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  rowMeta: { color: colors.muted, fontSize: 14, marginTop: 2 },
  addButton: {
    minHeight: 52,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.accent,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: { color: colors.accent, fontSize: 16, fontWeight: '800' },
});
