import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import * as Clipboard from 'expo-clipboard';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    if (__DEV__) {
      console.error('[ErrorBoundary] Caught error:', error);
      console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
    }
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReport = async (): Promise<void> => {
    const { error, errorInfo } = this.state;
    const details = [
      `Error: ${error?.message ?? 'Unknown error'}`,
      `Name: ${error?.name ?? 'Error'}`,
      `Stack: ${error?.stack ?? 'No stack trace'}`,
      `Component Stack: ${errorInfo?.componentStack ?? 'No component stack'}`,
      `Time: ${new Date().toISOString()}`,
    ].join('\n\n');

    try {
      await Clipboard.setStringAsync(details);
    } catch {
      // Clipboard may not be available in all environments
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            {/* Error icon */}
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>!</Text>
            </View>

            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.subtitle}>
              An unexpected error occurred. You can try again or report the issue.
            </Text>

            {__DEV__ && this.state.error ? (
              <ScrollView style={styles.detailsContainer} contentContainerStyle={styles.detailsContent}>
                <Text style={styles.detailsText}>
                  {this.state.error.message}
                </Text>
              </ScrollView>
            ) : null}

            <View style={styles.buttonRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  styles.reportButton,
                  pressed ? styles.buttonPressed : null,
                ]}
                onPress={this.handleReport}
              >
                <Text style={styles.reportButtonText}>Report</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  styles.retryButton,
                  pressed ? styles.buttonPressed : null,
                ]}
                onPress={this.handleReset}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </Pressable>
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 340,
    width: '100%',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#FF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FF4444',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  detailsContainer: {
    maxHeight: 120,
    width: '100%',
    backgroundColor: '#141414',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#222222',
    marginBottom: 24,
  },
  detailsContent: {
    padding: 12,
  },
  detailsText: {
    fontSize: 12,
    color: '#FF6666',
    fontFamily: 'monospace',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  reportButton: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333333',
  },
  reportButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#AAAAAA',
  },
  retryButton: {
    backgroundColor: '#FFFFFF',
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
});

export default ErrorBoundary;
