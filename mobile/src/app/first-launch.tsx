import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { MapPin, Layers, ArrowRight, Sparkles } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useDeskStore from '@/lib/state/store';
import { useTheme } from '@/lib/theme/ThemeContext';

const { width: W, height: H } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Dot grid background
// ---------------------------------------------------------------------------

function DotGrid() {
  const cols = Math.ceil(W / 28);
  const rows = Math.ceil(H / 28);
  return (
    <View style={{ position: 'absolute', inset: 0, opacity: 0.07 }}>
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => (
          <View
            key={`${r}-${c}`}
            style={{
              position: 'absolute',
              top: r * 28,
              left: c * 28,
              width: 2,
              height: 2,
              borderRadius: 1,
              backgroundColor: '#ffffff',
            }}
          />
        )),
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Animated choice card
// ---------------------------------------------------------------------------

function ChoiceCard({
  onPress,
  title,
  subtitle,
  helper,
  icon,
  accentColor,
  delay = 0,
}: {
  onPress: () => void;
  title: string;
  subtitle: string;
  helper?: string;
  icon: React.ReactNode;
  accentColor: string;
  delay?: number;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify().damping(18).stiffness(120)}
      style={[animStyle, { width: '100%' }]}
    >
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 20, stiffness: 300 });
        }}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        style={{
          borderRadius: 20,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: accentColor + '44',
          backgroundColor: 'rgba(255,255,255,0.05)',
        }}
      >
        {/* Top accent line */}
        <View style={{ height: 2, backgroundColor: accentColor, opacity: 0.8 }} />

        <View style={{ padding: 22 }}>
          {/* Icon + title row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: accentColor + '20',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}
            >
              {icon}
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 19,
                  fontWeight: '700',
                  color: '#ffffff',
                  letterSpacing: -0.3,
                }}
              >
                {title}
              </Text>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 1 }}>
                {subtitle}
              </Text>
            </View>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                backgroundColor: accentColor + '22',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowRight size={16} color={accentColor} />
            </View>
          </View>

          {/* Helper text */}
          {helper ? (
            <View
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 9,
                borderWidth: 0.5,
                borderColor: 'rgba(255,255,255,0.08)',
              }}
            >
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 17 }}>
                {helper}
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function FirstLaunchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const setFirstLaunchComplete = useDeskStore((s) => s.setFirstLaunchComplete);
  const loadSampleContent = useDeskStore((s) => s.loadSampleContent);
  const setDeskSetupComplete = useDeskStore((s) => s.setDeskSetupComplete);

  const handleStartEmpty = () => {
    setFirstLaunchComplete(true);
    // Desk setup NOT complete — wizard will run, then first-pin prompt
    setDeskSetupComplete(false);
    router.replace('/desk-setup');
  };

  const handleLoadSample = () => {
    setFirstLaunchComplete(true);
    loadSampleContent();
    setDeskSetupComplete(true); // mark complete so desk loads directly
    // Go to desk-setup in "customize" mode (optional step)
    router.replace({ pathname: '/desk-setup', params: { mode: 'customize' } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#080810' }}>
      {/* Background */}
      <DotGrid />
      <LinearGradient
        colors={['rgba(80,200,120,0.08)', 'transparent', 'rgba(100,100,255,0.06)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', inset: 0 }}
      />

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 40,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 32,
          flexGrow: 1,
          justifyContent: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo mark */}
        <Animated.View
          entering={FadeIn.delay(100).duration(600)}
          style={{ alignItems: 'center', marginBottom: 36 }}
        >
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              backgroundColor: 'rgba(80,200,120,0.15)',
              borderWidth: 1,
              borderColor: 'rgba(80,200,120,0.3)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <MapPin size={34} color="#50c878" />
          </View>

          <Text
            style={{
              fontSize: 30,
              fontWeight: '800',
              color: '#ffffff',
              letterSpacing: -0.5,
              fontFamily: 'serif',
              textAlign: 'center',
            }}
          >
            Set up your desk
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: 'rgba(255,255,255,0.45)',
              marginTop: 8,
              textAlign: 'center',
              lineHeight: 21,
            }}
          >
            Choose how you'd like to start.{'\n'}You can change everything later.
          </Text>
        </Animated.View>

        {/* Choice cards */}
        <View style={{ gap: 14 }}>
          <ChoiceCard
            title="Start Empty"
            subtitle="Build your desk from scratch"
            icon={<Layers size={22} color="#a78bfa" />}
            accentColor="#a78bfa"
            delay={200}
            onPress={handleStartEmpty}
          />

          <ChoiceCard
            title="Load Sample Workspace"
            subtitle="See how the desk workflow works"
            helper="Loads example pins and items so you can see how the desk workflow works. Delete anytime."
            icon={<Sparkles size={22} color="#50c878" />}
            accentColor="#50c878"
            delay={320}
            onPress={handleLoadSample}
          />
        </View>
      </ScrollView>
    </View>
  );
}
