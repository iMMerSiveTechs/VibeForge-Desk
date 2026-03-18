import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';
import Purchases, {
  type PurchasesOfferings,
  type PurchasesPackage,
} from 'react-native-purchases';
import {
  getCustomerInfo,
  getOfferings,
  isRevenueCatEnabled,
  purchasePackage,
  restorePurchases,
} from '@/lib/revenuecatClient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SubscriptionContextValue {
  isPro: boolean;
  offerings: PurchasesOfferings | null;
  isLoading: boolean;
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const SubscriptionContext = createContext<SubscriptionContextValue>({
  isPro: false,
  offerings: null,
  isLoading: false,
  purchase: async () => false,
  restore: async () => false,
  refresh: async () => undefined,
});

// ---------------------------------------------------------------------------
// Error codes from react-native-purchases
// ---------------------------------------------------------------------------

const USER_CANCELLED_CODE = 1; // PURCHASE_CANCELLED

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const enabled = isRevenueCatEnabled();
  const isNative = Platform.OS !== 'web';

  const [isPro, setIsPro] = useState<boolean>(false);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(enabled && isNative);

  // Keep a ref so listener callback always has the latest setter
  const setIsProRef = useRef(setIsPro);
  setIsProRef.current = setIsPro;

  const checkIsPro = useCallback(async () => {
    if (!enabled || !isNative) return;
    const result = await getCustomerInfo();
    if (result.ok) {
      setIsProRef.current(!!result.data.entitlements.active['pro']);
    }
  }, [enabled, isNative]);

  const fetchOfferings = useCallback(async () => {
    if (!enabled || !isNative) return;
    const result = await getOfferings();
    if (result.ok) {
      setOfferings(result.data);
    }
  }, [enabled, isNative]);

  // Initial load
  useEffect(() => {
    if (!enabled || !isNative) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setIsLoading(true);
      await Promise.all([checkIsPro(), fetchOfferings()]);
      if (!cancelled) setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, isNative, checkIsPro, fetchOfferings]);

  // Real-time listener
  useEffect(() => {
    if (!enabled || !isNative) return;

    const listener = (info: import('react-native-purchases').CustomerInfo) => {
      setIsProRef.current(!!info.entitlements.active['pro']);
    };

    Purchases.addCustomerInfoUpdateListener(listener);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [enabled, isNative]);

  // purchase
  const purchase = useCallback(
    async (pkg: PurchasesPackage): Promise<boolean> => {
      if (!enabled || !isNative) return false;

      try {
        const result = await purchasePackage(pkg);
        if (result.ok) {
          setIsPro(!!result.data.entitlements.active['pro']);
          return true;
        }

        // Detect user cancellation via nested error code
        const err = result.error as { code?: number; userCancelled?: boolean } | undefined;
        if (
          err?.userCancelled === true ||
          err?.code === USER_CANCELLED_CODE
        ) {
          return false;
        }

        return false;
      } catch (err: unknown) {
        const e = err as { code?: number; userCancelled?: boolean } | undefined;
        if (e?.userCancelled === true || e?.code === USER_CANCELLED_CODE) {
          return false;
        }
        console.warn('[Subscription] purchase error:', err);
        return false;
      }
    },
    [enabled, isNative],
  );

  // restore
  const restore = useCallback(async (): Promise<boolean> => {
    if (!enabled || !isNative) return false;

    const result = await restorePurchases();
    if (result.ok) {
      const pro = !!result.data.entitlements.active['pro'];
      setIsPro(pro);
      return pro;
    }
    return false;
  }, [enabled, isNative]);

  // refresh
  const refresh = useCallback(async (): Promise<void> => {
    if (!enabled || !isNative) return;
    await checkIsPro();
  }, [enabled, isNative, checkIsPro]);

  const value: SubscriptionContextValue = {
    isPro,
    offerings,
    isLoading,
    purchase,
    restore,
    refresh,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSubscription(): SubscriptionContextValue {
  return useContext(SubscriptionContext);
}
