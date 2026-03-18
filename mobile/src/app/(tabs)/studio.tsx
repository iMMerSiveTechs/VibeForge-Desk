import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Helper to convert hex to rgba
function hexToRgba(hex: string, alpha: number = 1): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

import {
  Check,
  Lock,
  Palette,
  FileText,
  GraduationCap,
  Users,
  Sun,
  Calendar,
  Target,
  Dumbbell,
  UtensilsCrossed,
  ShoppingCart,
  Columns3,
  Briefcase,
  Brain,
  Lightbulb,
  Scale,
  BookOpen,
  PenLine,
  Plane,
  DollarSign,
  Heart,
  UserPlus,
  Megaphone,
  AlertCircle,
  Zap,
  CheckCircle,
  Trophy,
  Activity,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/lib/theme/ThemeContext';
import useDeskStore from '@/lib/state/store';
import { createItem, uid } from '@/lib/state/store';
import { THEMES } from '@/lib/theme/themes';
import { DESIGN_PACKS } from '@/lib/theme/designPacks';
import { KINDS } from '@/lib/constants';
import { TEMPLATES, getTaskTemplateRows, getTemplateCategories, getTemplatesByCategory, type EditorTemplate } from '@/lib/templates';
import { useSubscription } from '@/lib/subscription/SubscriptionContext';
import { deferredNavigate } from '@/lib/navigation';
import { canUseTheme, canUseDesignPack, canUseTemplate } from '@/lib/subscription/gating';
import ProLockModal from '@/components/ProLockModal';

// ---------------------------------------------------------------------------
// Template Icon Mapper
// ---------------------------------------------------------------------------

function templateIcon(iconName: string, color: string, size: number = 16): React.ReactNode {
  const icons: Record<string, React.ReactNode> = {
    GraduationCap: <GraduationCap size={size} color={color} />,
    Users: <Users size={size} color={color} />,
    Sun: <Sun size={size} color={color} />,
    Calendar: <Calendar size={size} color={color} />,
    Target: <Target size={size} color={color} />,
    Dumbbell: <Dumbbell size={size} color={color} />,
    UtensilsCrossed: <UtensilsCrossed size={size} color={color} />,
    ShoppingCart: <ShoppingCart size={size} color={color} />,
    Columns3: <Columns3 size={size} color={color} />,
    Briefcase: <Briefcase size={size} color={color} />,
    Brain: <Brain size={size} color={color} />,
    Lightbulb: <Lightbulb size={size} color={color} />,
    Scale: <Scale size={size} color={color} />,
    BookOpen: <BookOpen size={size} color={color} />,
    PenLine: <PenLine size={size} color={color} />,
    Plane: <Plane size={size} color={color} />,
    DollarSign: <DollarSign size={size} color={color} />,
    Heart: <Heart size={size} color={color} />,
    UserPlus: <UserPlus size={size} color={color} />,
    Megaphone: <Megaphone size={size} color={color} />,
    AlertCircle: <AlertCircle size={size} color={color} />,
    Zap: <Zap size={size} color={color} />,
    CheckCircle: <CheckCircle size={size} color={color} />,
    Trophy: <Trophy size={size} color={color} />,
    Activity: <Activity size={size} color={color} />,
  };
  return icons[iconName] ?? <FileText size={size} color={color} />;
}

// ---------------------------------------------------------------------------
// Section Header
// ---------------------------------------------------------------------------

function SectionHeader({ title }: { title: string }) {
  const theme = useTheme();
  return (
    <Text
      style={{
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 2,
        color: theme.muted,
        marginBottom: 12,
        marginTop: 28,
      }}
    >
      {title}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// Tab Navigation
// ---------------------------------------------------------------------------

type StudioTab = 'themes' | 'design-packs' | 'templates';

function TabBar({ active, onChangeTab }: { active: StudioTab; onChangeTab: (tab: StudioTab) => void }) {
  const theme = useTheme();
  const tabs: { id: StudioTab; label: string }[] = [
    { id: 'themes', label: 'THEMES' },
    { id: 'design-packs', label: 'DESIGN PACKS' },
    { id: 'templates', label: 'TEMPLATES' },
  ];

  return (
    <View
      style={{
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        marginBottom: 20,
      }}
    >
      {tabs.map((tab) => (
        <Pressable
          key={tab.id}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onChangeTab(tab.id);
          }}
          style={{
            flex: 1,
            paddingVertical: 12,
            alignItems: 'center',
            borderBottomWidth: active === tab.id ? 2 : 0,
            borderBottomColor: theme.spineAccent,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              letterSpacing: 1,
              color: active === tab.id ? theme.textOnDesk : theme.muted,
            }}
          >
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Theme Card
// ---------------------------------------------------------------------------

function ThemeCard({
  themeId,
  isActive,
  isLocked,
  onPress,
}: {
  themeId: string;
  isActive: boolean;
  isLocked: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const themeObj = THEMES[themeId];

  if (!themeObj) return null;

  return (
    <Pressable
      onPress={onPress}
      style={{
        marginBottom: 12,
        backgroundColor: theme.deskHl,
        borderRadius: 12,
        padding: 14,
        borderWidth: isActive ? 1.5 : 0.5,
        borderColor: isActive ? theme.brandGreen : theme.border,
      }}
    >
      {/* Active checkmark OR lock icon */}
      {isActive ? (
        <View
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: theme.brandGreen,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Check size={12} color="#FFFFFF" />
        </View>
      ) : isLocked ? (
        <View style={{ position: 'absolute', top: 10, right: 10 }}>
          <Lock size={14} color={theme.muted} />
        </View>
      ) : null}

      <Text
        style={{
          fontSize: 14,
          fontWeight: '700',
          color: theme.textOnDesk,
          marginBottom: 8,
        }}
      >
        {themeObj.name}
      </Text>

      {/* Swatches */}
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {themeObj.swatches.map((color, i) => (
          <View
            key={i}
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              backgroundColor: color,
              borderWidth: 0.5,
              borderColor: 'rgba(255,255,255,0.15)',
            }}
          />
        ))}
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Design Pack Card
// ---------------------------------------------------------------------------

function DesignPackCard({
  pack,
  isActive,
  isLocked,
  onPress,
}: {
  pack: (typeof DESIGN_PACKS)[number];
  isActive: boolean;
  isLocked: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const t = pack.tokens;
  const accentColor = pack.overrides.accentColor ?? theme.spineAccent;

  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: theme.deskHl,
        borderRadius: 12,
        padding: 12,
        borderWidth: isActive ? 1.5 : 0.5,
        borderColor: isActive ? theme.brandGreen : theme.border,
        marginBottom: 12,
        minHeight: 110,
      }}
    >
      {/* Active checkmark OR lock icon */}
      {isActive ? (
        <View
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: theme.brandGreen,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Check size={12} color="#FFFFFF" />
        </View>
      ) : isLocked ? (
        <View style={{ position: 'absolute', top: 10, right: 10 }}>
          <Lock size={14} color={theme.muted} />
        </View>
      ) : null}

      <Text
        style={{
          fontSize: 13,
          fontWeight: '700',
          color: theme.textOnDesk,
          marginBottom: 4,
        }}
      >
        {pack.name}
      </Text>
      <Text
        style={{
          fontSize: 11,
          color: theme.muted,
          lineHeight: 15,
          marginBottom: 10,
        }}
      >
        {pack.description}
      </Text>

      {/* Live mini-preview row */}
      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
        {/* Mini card swatch showing radius + shadow */}
        <View
          style={{
            width: 36,
            height: 24,
            borderRadius: Math.min(t.cardRadius * 0.5, 10),
            backgroundColor: accentColor + '33',
            borderWidth: t.cardBorderWidth,
            borderColor: accentColor + '88',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: t.cardShadowOffsetY * 0.5 },
            shadowOpacity: t.cardShadowOpacity,
            shadowRadius: t.cardShadowRadius * 0.5,
            elevation: Math.round(t.cardShadowOpacity * 8),
          }}
        />
        {/* Button style swatch */}
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: Math.min(t.cardRadius * 0.4, 8),
            backgroundColor: t.buttonStyle === 'filled' ? accentColor : 'transparent',
            borderWidth: t.buttonStyle !== 'filled' ? 1 : 0,
            borderColor: accentColor,
          }}
        >
          <Text style={{ fontSize: 9, fontWeight: '700', color: t.buttonStyle === 'filled' ? '#fff' : accentColor }}>
            {t.buttonStyle.toUpperCase()}
          </Text>
        </View>
        {/* Overlay style indicator */}
        {t.bgOverlay !== 'none' ? (
          <View style={{ flex: 1, height: 18, borderRadius: 3, overflow: 'hidden', backgroundColor: theme.border + '44' }}>
            {t.bgOverlay === 'lines' || t.bgOverlay === 'blueprint' ? (
              [0, 1, 2].map((i) => (
                <View key={i} style={{ position: 'absolute', top: 4 + i * 6, left: 0, right: 0, height: 0.5, backgroundColor: theme.muted }} />
              ))
            ) : (
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.4, backgroundColor: accentColor + '22' }} />
            )}
          </View>
        ) : (
          <View style={{ flex: 1, height: 18, borderRadius: 3, backgroundColor: theme.border + '22' }}>
            <Text style={{ fontSize: 8, color: theme.muted, textAlign: 'center', lineHeight: 18 }}>CLEAN</Text>
          </View>
        )}
        {/* Glow dot */}
        {t.glowStrength > 0 ? (
          <View
            style={{
              width: 10, height: 10, borderRadius: 5,
              backgroundColor: accentColor,
              shadowColor: accentColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: t.glowStrength,
              shadowRadius: 6,
              elevation: 4,
            }}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Template Card
// ---------------------------------------------------------------------------

function TemplateCard({
  template,
  isLocked,
  onLocked,
}: {
  template: EditorTemplate;
  isLocked: boolean;
  onLocked: () => void;
}) {
  const theme = useTheme();
  const upsertItem = useDeskStore((s) => s.upsertItem);

  const kindBg = useMemo(() => {
    switch (template.suggestedKind) {
      case 'plan':
        return theme.coverPrimary;
      case 'task':
        return theme.plannerGreen;
      case 'sticky':
        return theme.stickyYellow;
      case 'note':
        return theme.paper;
      case 'vault':
        return theme.coverPrimary;
      case 'journal':
        return theme.plannerPaper;
      case 'goal':
        return theme.brandGreen;
    }
  }, [template.suggestedKind, theme]);

  const kindIconColor = useMemo(() => {
    switch (template.suggestedKind) {
      case 'sticky':
      case 'note':
      case 'journal':
        return theme.ink;
      default:
        return '#FFFFFF';
    }
  }, [template.suggestedKind, theme]);

  const kindLabel = KINDS[template.suggestedKind]?.label ?? template.suggestedKind;

  const handleUseTemplate = () => {
    if (isLocked) {
      onLocked();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const item = createItem(template.suggestedKind);
    item.title = template.titleTemplate;
    item.body = template.bodyTemplate;

    // For task templates, pre-fill task rows
    if (template.suggestedKind === 'task') {
      const rows = getTaskTemplateRows(template.id);
      if (item.taskData) {
        item.taskData.tasks = rows.map((r) => ({ id: uid(), text: r.text, done: r.done }));
      }
    }

    upsertItem(item);
    deferredNavigate({ pathname: '/editor', params: { itemId: item.id, isNew: '1' } });
  };

  return (
    <Pressable
      onPress={handleUseTemplate}
      style={{
        backgroundColor: theme.deskHl,
        borderRadius: 12,
        padding: 12,
        borderWidth: 0.5,
        borderColor: theme.border,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
      }}
    >
      {/* Icon circle */}
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: kindBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        {templateIcon(template.icon, kindIconColor, 16)}
      </View>

      {/* Name + description */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: '700',
            color: theme.textOnDesk,
            marginBottom: 2,
          }}
        >
          {template.name}
        </Text>
        <Text
          style={{
            fontSize: 11,
            color: theme.muted,
          }}
        >
          {template.description}
        </Text>
      </View>

      {/* Lock icon OR Kind badge */}
      {isLocked ? (
        <Lock size={14} color={theme.muted} style={{ marginLeft: 8 }} />
      ) : (
        <View
          style={{
            backgroundColor: hexToRgba(theme.spineAccent, 0.12),
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
            marginLeft: 8,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: '600',
              color: theme.spineAccent,
            }}
          >
            {kindLabel}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function StudioScreen() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<StudioTab>('themes');
  const currentTheme = useDeskStore((s) => s.currentTheme);
  const currentDesignPack = useDeskStore((s) => s.currentColorPack);
  const setTheme = useDeskStore((s) => s.setTheme);
  const setDesignPack = useDeskStore((s) => s.setColorPack);
  const { isPro } = useSubscription();
  const [lockModal, setLockModal] = useState<{ visible: boolean; featureName: string }>({ visible: false, featureName: '' });

  const templateCategories = useMemo(() => getTemplateCategories(), []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.desk }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24, marginTop: 8 }}>
          <Text
            style={{
              fontSize: 24,
              fontWeight: '700',
              color: theme.textOnDesk,
              letterSpacing: -0.5,
            }}
          >
            Studio
          </Text>
        </View>

        {/* Tab Navigation */}
        <TabBar active={activeTab} onChangeTab={setActiveTab} />

        {/* THEMES TAB */}
        {activeTab === 'themes' && (
          <View>
            <SectionHeader title="AVAILABLE THEMES" />
            {Object.keys(THEMES).map((themeId) => {
              const locked = !canUseTheme(themeId, isPro);
              return (
                <ThemeCard
                  key={themeId}
                  themeId={themeId}
                  isActive={currentTheme === themeId}
                  isLocked={locked}
                  onPress={() => {
                    if (locked) {
                      setLockModal({ visible: true, featureName: THEMES[themeId].name + ' theme' });
                    } else {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setTheme(themeId);
                    }
                  }}
                />
              );
            })}
          </View>
        )}

        {/* DESIGN PACKS TAB */}
        {activeTab === 'design-packs' && (
          <View>
            <SectionHeader title="DESIGN PACKS" />
            <Text
              style={{
                fontSize: 12,
                color: theme.muted,
                marginBottom: 16,
                lineHeight: 18,
              }}
            >
              Apply design packs to modify your desk's visual system: paper texture, rule style, card shadows, and accent colors.
            </Text>

            {/* None option — always free */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setDesignPack(undefined);
              }}
              style={{
                marginBottom: 12,
                backgroundColor: theme.deskHl,
                borderRadius: 12,
                padding: 14,
                borderWidth: !currentDesignPack ? 1.5 : 0.5,
                borderColor: !currentDesignPack ? theme.brandGreen : theme.border,
              }}
            >
              {!currentDesignPack ? (
                <View
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: theme.brandGreen,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Check size={12} color="#FFFFFF" />
                </View>
              ) : null}
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: theme.textOnDesk,
                }}
              >
                No Design Pack
              </Text>
            </Pressable>

            {DESIGN_PACKS.map((pack) => {
              const locked = !canUseDesignPack(pack.id, isPro);
              return (
                <DesignPackCard
                  key={pack.id}
                  pack={pack}
                  isActive={currentDesignPack === pack.id}
                  isLocked={locked}
                  onPress={() => {
                    if (locked) {
                      setLockModal({ visible: true, featureName: pack.name + ' design pack' });
                    } else {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setDesignPack(pack.id);
                    }
                  }}
                />
              );
            })}
          </View>
        )}

        {/* TEMPLATES TAB */}
        {activeTab === 'templates' && (
          <View>
            {templateCategories.map((category) => (
              <View key={category}>
                <SectionHeader title={category.toUpperCase()} />
                {getTemplatesByCategory(category).map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    isLocked={!canUseTemplate(template.category, isPro)}
                    onLocked={() => setLockModal({ visible: true, featureName: template.name + ' template' })}
                  />
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <ProLockModal
        visible={lockModal.visible}
        featureName={lockModal.featureName}
        onClose={() => setLockModal({ visible: false, featureName: '' })}
      />
    </SafeAreaView>
  );
}
