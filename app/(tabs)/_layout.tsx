import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AuthProvider, useAuth } from '@/contexts/auth-context';

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('App crashed:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <ScrollView contentContainerStyle={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>{this.state.error.message}</Text>
          <Text style={styles.errorStack}>{this.state.error.stack}</Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

/**
 * Auth-gated navigator.
 *
 * This uses expo-router's built-in <Stack.Protected> instead of a manual
 * segments + <Redirect> guard. A hand-rolled guard (what this app had
 * before) computes "where should I be" on every render and issues a
 * navigation call whenever that disagrees with the current route — if
 * anything causes the auth state or segments to be momentarily
 * inconsistent across renders, that turns into a redirect loop (which is
 * exactly the "Throttling navigation to prevent the browser from hanging"
 * error). <Stack.Protected> avoids this entirely: it just mounts/unmounts
 * screens based on the `guard` prop and automatically falls back to the
 * nearest allowed screen, with no manual history manipulation involved.
 */
function AppNavigator() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#4caf50" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>

      <Stack.Protected guard={!user}>
        <Stack.Screen name="index" />
        <Stack.Screen name="register" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
      <StatusBar style="auto" />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: { flexGrow: 1, padding: 24, paddingTop: 60, backgroundColor: '#fff' },
  errorTitle: { fontSize: 20, fontWeight: 'bold', color: '#e53935', marginBottom: 12 },
  errorMessage: { fontSize: 16, marginBottom: 12 },
  errorStack: { fontSize: 12, color: '#666' },
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef5ee',
  },
});