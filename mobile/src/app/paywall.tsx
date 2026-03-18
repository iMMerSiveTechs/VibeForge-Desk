import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { X, Check, Zap, ShieldCheck } from 'lucide-react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { useTheme } from '@/lib/theme/ThemeContext';
import { useSubscription } from '@/lib/subscription/SubscriptionContext';
import { safeDismiss } from '@/lib/safeClose';

const MONTHLY_ID = '$rc_monthly';
const ANNUAL_ID = '$rc_annual';

const FEATURES = [
  'All themes + all design packs',
  'Full Studio library + monthly drops',
  'Command Bar + Quick Shelf',
  'Full Studio access',
];

const TRUST_LINES = [
  'Cancel anytime',
  'Local-first. Your data stays on your device.',
];

function WebFallback() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: theme.desk, alignItems: 'center', justifyContent: 'center', paddingTop: insets.top, paddingBottom: insets.bottom, paddingHorizontal: 32 }}>
      <Zap size={40} color={theme.spineAccent} />
      <Text style={{ fontSize: 20, fontWeight: '700', color: theme.textOnDesk, marginTop: 16, textAlign: 'center' }}>Subscriptions not available on web</Text>
      <Text style={{ fontSize: 14, color: theme.muted, marginTop: 8, textAlign: 'center', lineHeight: 20 }}>Open the iOS or Android app to subscribe to VibeForge Desk Pro.</Text>
      <Pressable onPress={() => safeDismiss(router)} style={{ marginTop: 32, paddingVertical: 14, paddingHorizontal: 32, backgroundColor: theme.spineAccent, borderRadius: 12 }}>
        <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>Go Back</Text>
      </Pressable>
    </View>
  );
}

function PackageCard({
  pkg, label, price, period, badge, selected, onSelect, theme,
}: {
  pkg: PurchasesPackage; label: string; price: string; period: string;
  badge?: string; selected: boolean; onSelect: () => void; theme: ReturnType<typeof useTheme>;
}) {
  return (
    <Pressable onPress={onSelect} style={{ borderRadius: 16, borderWidth: selected ? 2 : 1, borderColor: selected ? theme.spineAccent : theme.border, backgroundColor: selected ? `${theme.spineAccent}18` : theme.deskHl, padding: 16, flex: 1, position: 'relative', overflow: 'hidden' }}>
      {badge ? (
        <View style={{ position: 'absolute', top: 10, right: 10, backgroundColor: theme.spineAccent, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 }}>
          <Text style={{ fontSize: 9, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.8 }}>{badge}</Text>
        </View>
      ) : null}
      <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: selected ? theme.spineAccent : theme.border, backgroundColor: selected ? theme.spineAccent : 'transparent', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        {selected ? <Check size={12} color="#FFFFFF" strokeWidth={3} /> : null}
      </View>
      <Text style={{ fontSize: 13, fontWeight: '600', color: selected ? theme.spineAccent : theme.muted, marginBottom: 4, letterSpacing: 0.4 }}>{label}</Text>
      <Text style={{ fontSize: 24, fontWeight: '800', color: theme.textOnDesk, letterSpacing: -0.5 }}>{price}</Text>
      <Text style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>{period}</Text>
    </Pressable>
  );
}

export default function PaywallScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { offerings, purchase, restore, isPro } = useSubscription();

  const [selectedId, setSelectedId] = useState<string>(ANNUAL_ID);
  const [purchasing, setPurchasing] = useState<boolean>(false);
  const [restoring, setRestoring] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(24);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
    translateY.value = withTiming(0, { duration: 400 });
  }, [opacity, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => safeDismiss(router), 1200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [success, router]);

  if (Platform.OS === 'web') return <WebFallback />;

  const packages = offerings?.current?.availablePackages ?? null;
  if (packages === null) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.desk, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={theme.spineAccent} size="large" />
      </View>
    );
  }

  if (packages.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.desk, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <Zap size={40} color={theme.muted} />
        <Text style={{ fontSize: 18, fontWeight: '700', color: theme.textOnDesk, marginTop: 16, textAlign: 'center' }}>Subscriptions not available</Text>
        <Text style={{ fontSize: 13, color: theme.muted, marginTop: 8, textAlign: 'center' }}>Check back soon.</Text>
        <Pressable onPress={() => safeDismiss(router)} style={{ marginTop: 28, paddingVertical: 14, paddingHorizontal: 32, backgroundColor: theme.deskHl, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
          <Text style={{ color: theme.textOnDesk, fontWeight: '600', fontSize: 15 }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const monthlyPkg = packages.find((p) => p.identifier === MONTHLY_ID) ?? packages[0];
  const annualPkg = packages.find((p) => p.identifier === ANNUAL_ID) ?? null;
  const selectedPkg = packages.find((p) => p.identifier === selectedId) ?? monthlyPkg;

  const monthlyPrice = monthlyPkg?.product.priceString ?? '$4.99';
  const annualPrice = annualPkg?.product.priceString ?? '$49.99';

  // Compute savings badge truthfully
  const monthlyAmount = monthlyPkg?.product.price ?? 4.99;
  const annualAmount = annualPkg?.product.price ?? 49.99;
  const annualEquiv = monthlyAmount * 12;
  const savingsPct = annualEquiv > 0 ? Math.round(((annualEquiv - annualAmount) / annualEquiv) * 100) : 0;
  const bestValueBadge = savingsPct > 0 ? `BEST VALUE · Save ${savingsPct}%` : 'BEST VALUE';

  // Suppress unused variable warning — isPro is available from context for potential use
  void isPro;

  const handlePurchase = async () => {
    if (purchasing || !selectedPkg) return;
    setPurchasing(true);
    const ok = await purchase(selectedPkg);
    setPurchasing(false);
    if (ok) setSuccess(true);
  };

  const handleRestore = async () => {
    if (restoring) return;
    setRestoring(true);
    await restore();
    setRestoring(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.desk }}>
      {/* Close button */}
      <Pressable onPress={() => safeDismiss(router)} style={{ position: 'absolute', top: insets.top + 12, right: 20, zIndex: 10, width: 34, height: 34, borderRadius: 17, backgroundColor: theme.deskHl, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' }} hitSlop={12}>
        <X size={16} color={theme.muted} />
      </Pressable>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: insets.top + 56, paddingBottom: insets.bottom + 32, paddingHorizontal: 24 }} showsVerticalScrollIndicator={false}>
        <Animated.View style={animStyle}>
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 28 }}>
            <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: `${theme.spineAccent}22`, borderWidth: 1.5, borderColor: `${theme.spineAccent}55`, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Zap size={26} color={theme.spineAccent} />
            </View>
            <Text style={{ fontSize: 28, fontWeight: '800', color: theme.textOnDesk, letterSpacing: -0.8, textAlign: 'center' }}>VibeForge Desk Pro</Text>
            <Text style={{ fontSize: 14, color: theme.muted, marginTop: 6, textAlign: 'center', lineHeight: 20, paddingHorizontal: 16 }}>
              Your premium local-first desk OS: themes, packs, templates, and power tools.
            </Text>
          </View>

          {/* Feature list */}
          <View style={{ backgroundColor: theme.deskHl, borderRadius: 16, borderWidth: 1, borderColor: theme.border, padding: 20, marginBottom: 16, gap: 14 }}>
            {FEATURES.map((feat) => (
              <View key={feat} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: `${theme.spineAccent}28`, alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={12} color={theme.spineAccent} strokeWidth={3} />
                </View>
                <Text style={{ fontSize: 14, color: theme.textOnDesk, fontWeight: '500', flex: 1 }}>{feat}</Text>
              </View>
            ))}
          </View>

          {/* Trust lines */}
          <View style={{ gap: 6, marginBottom: 24, paddingHorizontal: 4 }}>
            {TRUST_LINES.map((line) => (
              <View key={line} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={13} color={theme.muted} />
                <Text style={{ fontSize: 12, color: theme.muted, fontWeight: '500' }}>{line}</Text>
              </View>
            ))}
          </View>

          {/* Package cards */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
            <PackageCard pkg={monthlyPkg} label="MONTHLY" price={monthlyPrice} period="per month" selected={selectedId === MONTHLY_ID} onSelect={() => setSelectedId(MONTHLY_ID)} theme={theme} />
            {annualPkg ? (
              <PackageCard pkg={annualPkg} label="YEARLY" price={annualPrice} period="per year" badge={bestValueBadge} selected={selectedId === ANNUAL_ID} onSelect={() => setSelectedId(ANNUAL_ID)} theme={theme} />
            ) : null}
          </View>

          {/* Primary CTA */}
          <Pressable onPress={handlePurchase} disabled={purchasing || success} style={({ pressed }) => ({ backgroundColor: success ? theme.brandGreen : theme.spineAccent, borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', opacity: pressed || purchasing ? 0.85 : 1, marginBottom: 12, minHeight: 52 })}>
            {purchasing ? <ActivityIndicator color="#FFFFFF" /> : (
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 }}>
                {success ? 'Welcome to Pro!' : 'Start Pro'}
              </Text>
            )}
          </Pressable>

          {/* Not now */}
          <Pressable onPress={() => safeDismiss(router)} style={{ alignItems: 'center', paddingVertical: 10, marginBottom: 8 }}>
            <Text style={{ fontSize: 14, color: theme.muted, fontWeight: '500' }}>Not now</Text>
          </Pressable>

          {/* Restore */}
          <Pressable onPress={handleRestore} disabled={restoring} style={{ alignItems: 'center', paddingVertical: 8 }}>
            {restoring ? <ActivityIndicator color={theme.muted} size="small" /> : (
              <Text style={{ fontSize: 12, color: theme.muted, textDecorationLine: 'underline' }}>Restore Purchases</Text>
            )}
          </Pressable>

          {/* Legal links */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 20 }}>
            <Pressable onPress={() => Linking.openURL('https://vibeforgedesk.com/terms').catch(() => {})}>
              <Text style={{ fontSize: 11, color: theme.muted }}>Terms of Service</Text>
            </Pressable>
            <Pressable onPress={() => Linking.openURL('https://vibeforgedesk.com/privacy').catch(() => {})}>
              <Text style={{ fontSize: 11, color: theme.muted }}>Privacy Policy</Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
