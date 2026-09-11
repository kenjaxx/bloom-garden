import { Redirect, Stack, useSegments } from 'expo-router';
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
 * Declarative auth guard. Rather than imperatively calling router.replace()
 * from an effect (which can race with other navigation, or simply not fire
 * if this component doesn't re-run at the right moment), this renders a
 * <Redirect> whenever the current segment doesn't match the auth state.
 * Expo Router applies <Redirect> synchronously during render, which is why
 * this is the pattern Expo's own docs recommend for protected routes — it
 * fixed the bug where sign-out / leave-garden left you stuck on the tabs
 * screen (with a stale Firestore listener still attached) until a refresh.
 */
function RootNavigationGuard({ children }: { children: React.ReactNode }) {
  const { user, initializing } = useAuth();
  const segments = useSegments();

  if (initializing) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#4caf50" />
      </View>
    );
  }

  // For the root index route ("/"), useSegments() returns an empty array.
  const topSegment = segments[0];
  const inProtectedGroup = topSegment === '(tabs)';
  const onSignedOutScreens = topSegment === undefined || topSegment === 'register';

  if (!user && inProtectedGroup) {
    // Signed out (or session expired) while inside the app -> bounce to login.
    return <Redirect href="/" />;
  }

  if (user && onSignedOutScreens) {
    // Already signed in but sitting on the login/register screen -> go in.
    // ('onboarding' is intentionally excluded so a freshly registered user
    // still sees it before landing on tabs.)
    return <Redirect href="/(tabs)" />;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <RootNavigationGuard>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="register" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </RootNavigationGuard>
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