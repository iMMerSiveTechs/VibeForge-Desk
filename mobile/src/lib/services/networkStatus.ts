import { useState, useEffect, useRef, useCallback } from 'react';

const CHECK_INTERVAL_MS = 30_000;
const CHECK_TIMEOUT_MS = 5_000;

/**
 * Performs a lightweight connectivity check by sending a HEAD request
 * to a known, highly-available endpoint.
 */
export async function isOnline(): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);

  try {
    const response = await fetch('https://clients3.google.com/generate_204', {
      method: 'HEAD',
      signal: controller.signal,
    });
    return response.status >= 200 && response.status < 400;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

interface NetworkStatus {
  isOnline: boolean;
  lastChecked: Date;
}

/**
 * React hook that periodically checks network connectivity.
 * Checks immediately on mount, then every 30 seconds.
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: true, // Optimistic default
    lastChecked: new Date(),
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const check = useCallback(async () => {
    const online = await isOnline();
    setStatus({ isOnline: online, lastChecked: new Date() });
  }, []);

  useEffect(() => {
    // Initial check
    check();

    // Periodic checks
    intervalRef.current = setInterval(check, CHECK_INTERVAL_MS);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [check]);

  return status;
}
