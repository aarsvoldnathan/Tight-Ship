import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../src/auth';
import { StoreProvider } from '../src/store';
import { colors } from '../src/theme';

function Routes() {
  const { session, ready } = useAuth();

  if (!ready) {
    return (
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}
      >
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '800' },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="index" options={{ title: 'Tight Ship' }} />
        <Stack.Screen name="properties/new" options={{ title: 'Add property' }} />
        <Stack.Screen name="properties/[id]" options={{ title: 'Property' }} />
        <Stack.Screen name="service/new" options={{ title: 'Add equipment' }} />
        <Stack.Screen name="service/[id]" options={{ title: 'Equipment' }} />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StoreProvider>
        <StatusBar style="light" />
        <Routes />
      </StoreProvider>
    </AuthProvider>
  );
}
