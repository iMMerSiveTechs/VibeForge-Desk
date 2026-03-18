import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useRouter, Redirect } from 'expo-router';

// Dev-only screen — redirect to home in production builds
if (!__DEV__) {
  // Exporting a redirect component so the route resolves but is inaccessible
  module.exports = function ThemeQARedirect() {
    return <Redirect href="/(tabs)" />;
  };
}
import StageSafeHeader from '@/components/StageSafeHeader';
import { getReadableTextColor, relativeLuminance } from '@/lib/theme/contrast';
import { THEMES } from '@/lib/theme/themes';
import type { ThemeColors } from '@/lib/theme/themes';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AccentContrastResult {
  key: string;
  hex: string;
  textColor: '#000000' | '#FFFFFF';
  ratio: number;
  pass: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const THEME_KEYS = Object.keys(THEMES) as Array<keyof typeof THEMES>;

function getPreviewColors(themeKey: string): ThemeColors {
  const theme = THEMES[themeKey];
  return theme ? theme.colors : THEMES['stealth'].colors;
}

function getThemeDisplayName(themeKey: string): string {
  const theme = THEMES[themeKey];
  if (!theme) return themeKey;
  // Shorten name for chip display
  return theme.name.length > 14 ? theme.name.slice(0, 13) + '…' : theme.name;
}

const ACCENT_KEYS: Array<keyof ThemeColors> = [
  'brandGreen',
  'spineAccent',
  'stickyYellow',
  'plannerGreen',
  'coverPrimary',
  'ruleBlue',
];

function computeContrastResults(colors: ThemeColors): AccentContrastResult[] {
  return ACCENT_KEYS.map((key) => {
    const hex = colors[key] as string;
    let safeHex = hex;
    // Strip rgba to hex if needed — skip rgba values
    if (hex.startsWith('rgba') || hex.startsWith('rgb')) {
      safeHex = '#888888'; // fallback for non-hex values
    }
    const textColor = getReadableTextColor(safeHex);
    const accentLum = relativeLuminance(safeHex);
    const textLum = textColor === '#FFFFFF' ? relativeLuminance('#FFFFFF') : relativeLuminance('#000000');
    const lighter = Math.max(accentLum, textLum);
    const darker = Math.min(accentLum, textLum);
    const ratio = (lighter + 0.05) / (darker + 0.05);
    const pass = ratio >= 4.5;
    return { key, hex: safeHex, textColor, ratio, pass };
  });
}

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

function SectionHeader({ label, colors }: { label: string; colors: ThemeColors }) {
  return (
    <Text
      style={{
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 2,
        color: colors.muted,
        marginBottom: 10,
        marginTop: 20,
      }}
    >
      {label}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// Surfaces section
// ---------------------------------------------------------------------------

function SurfacesSection({ colors }: { colors: ThemeColors }) {
  const swatches: Array<{ label: string; color: string }> = [
    { label: 'desk', color: colors.desk },
    { label: 'deskHl', color: colors.deskHl },
    { label: 'border', color: colors.border.startsWith('rgba') ? colors.textOnDesk + '1A' : colors.border },
  ];

  return (
    <View>
      <SectionHeader label="SURFACES" colors={colors} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {swatches.map(({ label, color }) => (
          <View key={label} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
            <View
              style={{
                width: '100%',
                height: 60,
                borderRadius: 10,
                backgroundColor: color,
                borderWidth: 1,
                borderColor: colors.textOnDesk + '20',
              }}
            />
            <Text style={{ fontSize: 10, color: colors.muted, fontWeight: '600' }}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Text tiers section
// ---------------------------------------------------------------------------

function TextTiersSection({ colors }: { colors: ThemeColors }) {
  return (
    <View>
      <SectionHeader label="TEXT TIERS" colors={colors} />
      <View
        style={{
          backgroundColor: colors.desk,
          borderRadius: 10,
          padding: 14,
          borderWidth: 0.5,
          borderColor: colors.border.startsWith('rgba') ? 'rgba(255,255,255,0.1)' : colors.border,
          gap: 8,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textOnDesk }}>
          textOnDesk — Primary text on desk surface
        </Text>
        <Text style={{ fontSize: 13, color: colors.muted }}>
          muted — Secondary / supporting text tier
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Accent palette section
// ---------------------------------------------------------------------------

function AccentPaletteSection({ colors }: { colors: ThemeColors }) {
  const accents: Array<{ label: string; color: string }> = [
    { label: 'brandGreen', color: colors.brandGreen },
    { label: 'spineAccent', color: colors.spineAccent },
    { label: 'stickyYellow', color: colors.stickyYellow },
    { label: 'plannerGreen', color: colors.plannerGreen },
    { label: 'coverPrimary', color: colors.coverPrimary },
    { label: 'ruleBlue', color: colors.ruleBlue },
  ];

  return (
    <View>
      <SectionHeader label="ACCENT PALETTE" colors={colors} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {accents.map(({ label, color }) => {
          const safeColor = color.startsWith('rgba') || color.startsWith('rgb') ? '#888888' : color;
          const textColor = getReadableTextColor(safeColor);
          return (
            <View
              key={label}
              style={{
                backgroundColor: safeColor,
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 8,
                minWidth: 100,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '700', color: textColor }}>{label}</Text>
              <Text style={{ fontSize: 9, color: textColor + 'CC', marginTop: 2 }}>{safeColor}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Buttons section
// ---------------------------------------------------------------------------

function ButtonsSection({ colors }: { colors: ThemeColors }) {
  const filledTextColor = getReadableTextColor(
    colors.brandGreen.startsWith('rgba') ? '#888888' : colors.brandGreen,
  );
  return (
    <View>
      <SectionHeader label="BUTTONS" colors={colors} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {/* Filled button */}
        <View
          style={{
            flex: 1,
            backgroundColor: colors.brandGreen.startsWith('rgba') ? '#888888' : colors.brandGreen,
            borderRadius: 10,
            paddingVertical: 12,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '700', color: filledTextColor }}>Filled</Text>
        </View>
        {/* Outline button */}
        <View
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            borderRadius: 10,
            paddingVertical: 12,
            alignItems: 'center',
            borderWidth: 1.5,
            borderColor: colors.border.startsWith('rgba') ? colors.textOnDesk + '33' : colors.border,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textOnDesk }}>Outline</Text>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Status badges section
// ---------------------------------------------------------------------------

function StatusBadgesSection({ colors }: { colors: ThemeColors }) {
  const badges: Array<{ label: string; bg: string; textColor: string }> = [
    {
      label: 'Active',
      bg: colors.brandGreen.startsWith('rgba') ? '#888888' : colors.brandGreen,
      textColor: getReadableTextColor(colors.brandGreen.startsWith('rgba') ? '#888888' : colors.brandGreen),
    },
    {
      label: 'Completed',
      bg: colors.ruleBlue.startsWith('rgba') ? '#888888' : colors.ruleBlue,
      textColor: getReadableTextColor(colors.ruleBlue.startsWith('rgba') ? '#888888' : colors.ruleBlue),
    },
    {
      label: 'Paused',
      bg: colors.muted + '33',
      textColor: colors.muted,
    },
  ];

  return (
    <View>
      <SectionHeader label="STATUS BADGES" colors={colors} />
      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
        {badges.map(({ label, bg, textColor }) => (
          <View
            key={label}
            style={{
              backgroundColor: bg,
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 6,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: textColor }}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Progress bar section
// ---------------------------------------------------------------------------

function ProgressBarSection({ colors }: { colors: ThemeColors }) {
  const safeGreen = colors.brandGreen.startsWith('rgba') ? '#888888' : colors.brandGreen;
  return (
    <View>
      <SectionHeader label="PROGRESS BAR" colors={colors} />
      <View
        style={{
          height: 10,
          borderRadius: 5,
          backgroundColor: safeGreen + '28',
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height: 10,
            borderRadius: 5,
            backgroundColor: safeGreen,
            width: '65%',
          }}
        />
      </View>
      <Text style={{ fontSize: 11, color: colors.muted, marginTop: 5 }}>65% complete</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Wide card preview section
// ---------------------------------------------------------------------------

function WideCardSection({ colors }: { colors: ThemeColors }) {
  const safeAccent = colors.spineAccent.startsWith('rgba') ? '#888888' : colors.spineAccent;
  return (
    <View>
      <SectionHeader label="WIDE CARD PREVIEW" colors={colors} />
      <View
        style={{
          backgroundColor: colors.deskHl,
          borderRadius: 14,
          padding: 16,
          borderWidth: 0.5,
          borderColor: safeAccent + '44',
          flexDirection: 'row',
          alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Left accent bar */}
        <View
          style={{
            position: 'absolute',
            top: 0, left: 0, bottom: 0, width: 4,
            backgroundColor: safeAccent,
            borderTopLeftRadius: 14,
            borderBottomLeftRadius: 14,
          }}
        />
        {/* Icon block */}
        <View
          style={{
            width: 40, height: 40, borderRadius: 10,
            backgroundColor: safeAccent + '22',
            alignItems: 'center', justifyContent: 'center',
            marginLeft: 8, marginRight: 14,
          }}
        >
          <View style={{ width: 20, height: 20, borderRadius: 4, backgroundColor: safeAccent + '88' }} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: colors.muted, marginBottom: 2 }}>
            VAULT
          </Text>
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textOnDesk, fontFamily: 'serif', marginBottom: 2 }}>
            Mock Wide Card
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted }}>Vault-style layout preview</Text>
        </View>
        <Text style={{ fontSize: 13, color: colors.muted }}>12 items</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Contrast check section
// ---------------------------------------------------------------------------

function ContrastCheckSection({ colors }: { colors: ThemeColors }) {
  const results = computeContrastResults(colors);

  useEffect(() => {
    for (const r of results) {
      if (!r.pass) {
        console.warn(`[ThemeQA] FAIL: ${r.key} contrast ratio: ${r.ratio.toFixed(1)}`);
      }
    }
  }, [results]);

  return (
    <View>
      <SectionHeader label="CONTRAST CHECK (WCAG AA = 4.5:1)" colors={colors} />
      <View style={{ gap: 8 }}>
        {results.map((r) => (
          <View
            key={r.key}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.deskHl,
              borderRadius: 10,
              padding: 12,
              borderWidth: 0.5,
              borderColor: r.pass ? colors.brandGreen + '44' : '#FF3B30' + '44',
            }}
          >
            {/* Color swatch */}
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                backgroundColor: r.hex,
                marginRight: 12,
                borderWidth: 0.5,
                borderColor: colors.textOnDesk + '20',
              }}
            />
            {/* Info */}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textOnDesk }}>{r.key}</Text>
              <Text style={{ fontSize: 10, color: colors.muted }}>{r.hex}</Text>
            </View>
            {/* Ratio + pass/fail */}
            <View style={{ alignItems: 'flex-end', gap: 2 }}>
              <View
                style={{
                  backgroundColor: r.pass ? colors.brandGreen + '22' : '#FF3B30' + '22',
                  borderRadius: 6,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '800',
                    color: r.pass
                      ? (colors.brandGreen.startsWith('rgba') ? '#00C853' : colors.brandGreen)
                      : '#FF3B30',
                  }}
                >
                  {r.pass ? 'PASS' : 'FAIL'}
                </Text>
              </View>
              <Text style={{ fontSize: 10, color: colors.muted }}>{r.ratio.toFixed(2)}:1</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function ThemeQAScreen() {
  const router = useRouter();
  const [selectedThemeKey, setSelectedThemeKey] = useState<string>('stealth');
  const colors = getPreviewColors(selectedThemeKey);

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.desk }]}>
      {/* Header */}
      <StageSafeHeader
        title="Theme QA"
        onBack={() => router.back()}
        backgroundColor={colors.desk}
      />

      {/* Theme switcher strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
      >
        {THEME_KEYS.map((key) => {
          const isSelected = key === selectedThemeKey;
          const theme = THEMES[key];
          const accentHex = theme.colors.brandGreen.startsWith('rgba') ? '#888888' : theme.colors.brandGreen;
          return (
            <Pressable
              key={key}
              onPress={() => setSelectedThemeKey(key)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 20,
                backgroundColor: isSelected ? accentHex : colors.deskHl,
                borderWidth: isSelected ? 0 : 0.5,
                borderColor: colors.border.startsWith('rgba') ? 'rgba(255,255,255,0.15)' : colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: isSelected ? getReadableTextColor(accentHex) : colors.muted,
                }}
              >
                {getThemeDisplayName(key)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Theme name bar */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingBottom: 6,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border.startsWith('rgba') ? 'rgba(255,255,255,0.08)' : colors.border,
        }}
      >
        <Text style={{ fontSize: 11, color: colors.muted, fontWeight: '600' }}>
          Previewing: <Text style={{ color: colors.textOnDesk }}>{THEMES[selectedThemeKey]?.name ?? selectedThemeKey}</Text>
        </Text>
      </View>

      {/* Scrollable preview sections */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <SurfacesSection colors={colors} />
        <TextTiersSection colors={colors} />
        <AccentPaletteSection colors={colors} />
        <ButtonsSection colors={colors} />
        <StatusBadgesSection colors={colors} />
        <ProgressBarSection colors={colors} />
        <WideCardSection colors={colors} />
        <ContrastCheckSection colors={colors} />
      </ScrollView>
    </View>
  );
}
