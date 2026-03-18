import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Clock } from 'lucide-react-native';
import { useTheme } from '@/lib/theme/ThemeContext';
import useDeskStore from '@/lib/state/store';
import { useShallow } from 'zustand/react/shallow';

export default function ActivityScreen() {
  const theme = useTheme();
  const activity = useDeskStore(useShallow((s) => s.activity));

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <View className="flex-1" style={{ backgroundColor: theme.desk }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 }}
      >
        <Text
          style={{
            fontSize: 22,
            fontWeight: '700',
            color: theme.textOnDesk,
            fontFamily: 'serif',
            marginBottom: 20,
          }}
        >
          Activity Timeline
        </Text>

        {activity.length === 0 ? (
          <View className="items-center justify-center" style={{ paddingTop: 60 }}>
            <Clock size={36} color={theme.muted} />
            <Text style={{ fontSize: 15, color: theme.muted, marginTop: 12 }}>
              No activity yet
            </Text>
          </View>
        ) : (
          activity.map((entry, i) => (
            <View
              key={`${entry.ts}-${i}`}
              className="flex-row"
              style={{
                marginBottom: 12,
                paddingBottom: 12,
                borderBottomWidth: i < activity.length - 1 ? 0.5 : 0,
                borderBottomColor: theme.border,
              }}
            >
              {/* Time column */}
              <View style={{ width: 60, marginRight: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textOnDesk }}>
                  {formatTime(entry.ts)}
                </Text>
                <Text style={{ fontSize: 10, color: theme.muted }}>
                  {formatDate(entry.ts)}
                </Text>
              </View>

              {/* Timeline dot */}
              <View style={{ alignItems: 'center', marginRight: 12, paddingTop: 4 }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: theme.brandGreen,
                  }}
                />
                {i < activity.length - 1 ? (
                  <View
                    style={{
                      width: 1,
                      flex: 1,
                      backgroundColor: theme.border,
                      marginTop: 4,
                    }}
                  />
                ) : null}
              </View>

              {/* Summary */}
              <View style={{ flex: 1, paddingTop: 1 }}>
                <Text style={{ fontSize: 14, color: theme.textOnDesk, lineHeight: 20 }}>
                  {entry.summary}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
