import { Link } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DueItem } from '../maintenance';
import { colors, radius, spacing } from '../theme';

export function DueRow({ item, linked = true }: { item: DueItem; linked?: boolean }) {
  const color =
    item.status === 'overdue' ? colors.danger : item.status === 'dueSoon' ? colors.warn : colors.ok;
  const body = (
    <View style={[styles.row, { borderLeftColor: color }]}>
      <View style={styles.main}>
        <Text style={styles.task}>{item.title}</Text>
        <Text style={styles.subtitle}>
          {item.module === 'service' ? 'Service' : 'Home & Rentals'} · {item.subtitle}
        </Text>
      </View>
      <Text style={[styles.detail, { color }]}>{item.detail}</Text>
    </View>
  );
  if (!linked) return body;
  return (
    <Link href={item.href} asChild>
      <Pressable>{body}</Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderLeftWidth: 5,
    borderRadius: radius,
    padding: spacing.md,
    marginBottom: spacing.sm,
    minHeight: 64,
  },
  main: { marginBottom: spacing.xs },
  task: { color: colors.text, fontSize: 17, fontWeight: '700' },
  subtitle: { color: colors.muted, fontSize: 14, marginTop: 2 },
  detail: { fontSize: 14, fontWeight: '700' },
});
