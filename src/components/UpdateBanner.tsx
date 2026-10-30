import React, { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { ANDROID_BUILD, ANDROID_DOWNLOAD, GITHUB_REPO } from '../config';
import { colors, radius, spacing } from '../theme';
import { Button } from './ui';

type Latest = { build: number; url: string; notes?: string };

/** On Android, checks GitHub for a newer app build and offers to download it. */
export function UpdateBanner() {
  const [latest, setLatest] = useState<Latest | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'android' || !ANDROID_BUILD) return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases?per_page=10`, {
          headers: { Accept: 'application/vnd.github+json' },
        });
        if (!res.ok) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const releases: any[] = await res.json();
        const best = releases
          .map((r) => ({ r, n: Number(/^android-(\d+)$/.exec(r.tag_name ?? '')?.[1] ?? 0) }))
          .filter((x) => x.n > 0)
          .sort((a, b) => b.n - a.n)[0];
        if (!best || best.n <= ANDROID_BUILD) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const apk = (best.r.assets ?? []).find((a: any) => String(a.name).endsWith('.apk'));
        const subject = /\*\*Latest change:\*\* (.+)/.exec(best.r.body ?? '')?.[1];
        if (alive) {
          setLatest({ build: best.n, url: apk?.browser_download_url ?? ANDROID_DOWNLOAD, notes: subject });
        }
      } catch {
        // Offline or GitHub unavailable: try again next launch.
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!latest || hidden) return null;

  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Text style={styles.title}>Update available</Text>
      <Text style={styles.body}>
        Build {latest.build} is ready (you have build {ANDROID_BUILD}).
        {latest.notes ? `\n${latest.notes}` : ''}
      </Text>
      <Text style={styles.small}>Download it, then open the file and tap Update. Your data stays.</Text>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Button label="Download update" onPress={() => Linking.openURL(latest.url)} />
        </View>
        <Pressable onPress={() => setHidden(true)} accessibilityRole="button" hitSlop={8} style={styles.later}>
          <Text style={styles.laterText}>Later</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: 2,
    borderColor: colors.accent,
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  title: { color: colors.accent, fontSize: 17, fontWeight: '800' },
  body: { color: colors.text, fontSize: 15, marginTop: spacing.xs },
  small: { color: colors.muted, fontSize: 13, marginTop: spacing.xs, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  later: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  laterText: { color: colors.muted, fontSize: 16, fontWeight: '700' },
});
