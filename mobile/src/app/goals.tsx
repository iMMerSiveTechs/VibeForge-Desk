import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Trash2, Target } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/lib/theme/ThemeContext';
import { getReadableTextColor } from '@/lib/theme/contrast';
import useDeskStore from '@/lib/state/store';
import { createItem } from '@/lib/state/store';
import type { VFItem } from '@/lib/state/store';
import StageSafeHeader from '@/components/StageSafeHeader';

export default function GoalsScreen() {
  const theme = useTheme();
  const router = useRouter();

  const itemsById = useDeskStore((s) => s.itemsById);
  const upsertItem = useDeskStore((s) => s.upsertItem);
  const deleteItem = useDeskStore((s) => s.deleteItem);
  const goalOrder = useDeskStore((s) => s.orderByKind.goal ?? []);

  const goals = useMemo(() => {
    return goalOrder.map((id) => itemsById[id]).filter(Boolean) as VFItem[];
  }, [goalOrder, itemsById]);

  const parseGoalData = (item: VFItem): { description: string; progress: number; status: string; keyResults: { text?: string }[] } => {
    try {
      if (!item.body) return { description: '', progress: 0, status: 'active', keyResults: [] };
      return JSON.parse(item.body);
    } catch {
      return { description: '', progress: 0, status: 'active', keyResults: [] };
    }
  };

  const stats = useMemo(() => {
    if (goals.length === 0) return { total: 0, active: 0, avgPct: 0 };
    let activeCount = 0;
    let totalPct = 0;
    for (const g of goals) {
      const data = parseGoalData(g);
      if (data.status === 'active') activeCount++;
      totalPct += Math.min(Math.max(data.progress || 0, 0), 100);
    }
    return {
      total: goals.length,
      active: activeCount,
      avgPct: Math.round(totalPct / goals.length),
    };
  }, [goals]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateGoal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const item = createItem('goal');
    item.title = 'New Goal';
    item.body = JSON.stringify({
      description: '',
      progress: 0,
      status: 'active',
      keyResults: [],
    });
    upsertItem(item);
    router.push({ pathname: '/editor', params: { itemId: item.id, isNew: '1' } });
  };

  const handleDeleteGoal = (goalId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    deleteItem(goalId);
  };

  const statusColor = (status: string): string => {
    if (status === 'active') return theme.brandGreen;
    if (status === 'completed') return theme.ruleBlue;
    return theme.muted;
  };

  const statusLabel = (status: string): string => {
    if (status === 'active') return 'Active';
    if (status === 'completed') return 'Completed';
    return 'Paused';
  };

  const headerRight = (
    <Pressable
      onPress={handleCreateGoal}
      style={{
        backgroundColor: theme.brandGreen,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
      }}
    >
      <Plus size={18} color={getReadableTextColor(theme.brandGreen)} />
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.desk }}>
      <StageSafeHeader
        title="Goals"
        onBack={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }}
        rightActions={headerRight}
      />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>

        {/* Stat strip */}
        {goals.length > 0 ? (
          <View
            style={{
              flexDirection: 'row',
              gap: 8,
              marginTop: 4,
              marginBottom: 20,
            }}
          >
            {[
              { label: 'Total', value: String(stats.total) },
              { label: 'Active', value: String(stats.active) },
              { label: 'Avg', value: `${stats.avgPct}%` },
            ].map((stat) => (
              <View
                key={stat.label}
                style={{
                  flex: 1,
                  backgroundColor: theme.deskHl,
                  borderRadius: 10,
                  paddingVertical: 10,
                  alignItems: 'center',
                  borderWidth: 0.5,
                  borderColor: theme.border,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: '800', color: theme.textOnDesk }}>
                  {stat.value}
                </Text>
                <Text style={{ fontSize: 10, color: theme.muted, fontWeight: '600', letterSpacing: 0.5, marginTop: 2 }}>
                  {stat.label.toUpperCase()}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text
            style={{
              fontSize: 12,
              color: theme.muted,
              marginBottom: 20,
              lineHeight: 18,
            }}
          >
            Set OKR-style goals with key results. Track progress and adjust along the way. Tap any goal to edit.
          </Text>
        )}

        {/* Goals List */}
        {goals.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 60, gap: 12 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 18,
                backgroundColor: theme.brandGreen + '18',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 4,
              }}
            >
              <Target size={32} color={theme.brandGreen} />
            </View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: theme.textOnDesk,
              }}
            >
              Define what success looks like
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: theme.muted,
                textAlign: 'center',
                lineHeight: 18,
                paddingHorizontal: 24,
              }}
            >
              Create OKR-style goals with measurable key results to stay focused on what matters.
            </Text>
            <Pressable
              onPress={handleCreateGoal}
              style={{
                backgroundColor: theme.brandGreen,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 10,
                marginTop: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: getReadableTextColor(theme.brandGreen),
                }}
              >
                Create Your First Goal
              </Text>
            </Pressable>
          </View>
        ) : (
          goals.map((goal) => {
            const data = parseGoalData(goal);
            const progressPct = Math.min(Math.max(data.progress || 0, 0), 100);
            const isActive = data.status === 'active';
            const accentColor = statusColor(data.status);
            const krCount = data.keyResults?.length ?? 0;

            return (
              <Pressable
                key={goal.id}
                onPress={() => {
                  router.push({ pathname: '/editor', params: { itemId: goal.id } });
                }}
                style={{
                  backgroundColor: theme.deskHl,
                  borderRadius: 14,
                  marginBottom: 14,
                  borderWidth: 0.5,
                  borderColor: isActive ? theme.brandGreen + '33' : theme.border,
                  overflow: 'hidden',
                }}
              >
                {/* Left accent bar */}
                <View
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, bottom: 0, width: 4,
                    backgroundColor: accentColor,
                  }}
                />
                <View style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 14, paddingBottom: 14 }}>
                  {/* Header */}
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: '700',
                          color: theme.textOnDesk,
                          marginBottom: 4,
                        }}
                      >
                        {goal.title}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {/* Status badge */}
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 6,
                            backgroundColor: accentColor + '22',
                          }}
                        >
                          <Text style={{ fontSize: 10, fontWeight: '700', color: accentColor, letterSpacing: 0.5 }}>
                            {statusLabel(data.status).toUpperCase()}
                          </Text>
                        </View>
                        {/* Key result count */}
                        {krCount > 0 ? (
                          <View
                            style={{
                              paddingHorizontal: 7,
                              paddingVertical: 2,
                              borderRadius: 6,
                              backgroundColor: theme.muted + '22',
                            }}
                          >
                            <Text style={{ fontSize: 10, fontWeight: '600', color: theme.muted }}>
                              {krCount} KR{krCount !== 1 ? 's' : ''}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    {/* Delete button */}
                    <Pressable
                      onPress={() => handleDeleteGoal(goal.id)}
                      style={{ padding: 8, opacity: 0.6 }}
                    >
                      <Trash2 size={16} color={theme.danger} />
                    </Pressable>
                  </View>

                  {/* Description */}
                  {data.description ? (
                    <Text
                      style={{
                        fontSize: 12,
                        color: theme.muted,
                        lineHeight: 16,
                        marginBottom: 12,
                      }}
                      numberOfLines={2}
                    >
                      {data.description}
                    </Text>
                  ) : null}

                  {/* Progress bar row */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: accentColor + '28',
                        height: 8,
                        borderRadius: 4,
                        overflow: 'hidden',
                      }}
                    >
                      <View
                        style={{
                          width: `${progressPct}%`,
                          height: '100%',
                          backgroundColor: accentColor,
                          borderRadius: 4,
                        }}
                      />
                    </View>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '700',
                        color: accentColor,
                        minWidth: 36,
                        textAlign: 'right',
                      }}
                    >
                      {progressPct}%
                    </Text>
                  </View>

                  {/* Key Results preview */}
                  {data.keyResults && data.keyResults.length > 0 ? (
                    <View style={{ marginTop: 10 }}>
                      {data.keyResults.slice(0, 2).map((kr, i) => (
                        <Text
                          key={i}
                          style={{
                            fontSize: 11,
                            color: theme.muted,
                            marginBottom: 2,
                          }}
                          numberOfLines={1}
                        >
                          {i + 1}. {kr.text ?? String(kr)}
                        </Text>
                      ))}
                      {data.keyResults.length > 2 ? (
                        <Text style={{ fontSize: 10, color: theme.muted, marginTop: 4 }}>
                          +{data.keyResults.length - 2} more
                        </Text>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
