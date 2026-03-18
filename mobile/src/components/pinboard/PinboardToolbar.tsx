import React from 'react';
import { View, Pressable } from 'react-native';
import { Hand, Pen, Highlighter, Undo2, Redo2, Trash2, ArrowRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export type DrawTool = 'pan' | 'pen' | 'highlighter' | 'arrow';

interface Props {
  activeTool: DrawTool;
  onChangeTool: (tool: DrawTool) => void;
  safeMode?: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export default function PinboardToolbar({
  activeTool,
  onChangeTool,
  safeMode,
  onUndo,
  onRedo,
  onClear,
  canUndo,
  canRedo,
}: Props) {
  return (
    <View
      style={{
        position: 'absolute',
        bottom: 100,
        left: 16,
        right: 16,
        flexDirection: 'row',
        backgroundColor: 'rgba(20,20,28,0.92)',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 16,
        zIndex: 200,
      }}
    >
      {/* Mode buttons */}
      {(
        [
          ...(safeMode ? [] : [{ tool: 'pan' as DrawTool, Icon: Hand }]),
          { tool: 'pen' as DrawTool, Icon: Pen },
          { tool: 'highlighter' as DrawTool, Icon: Highlighter },
          ...(safeMode ? [] : [{ tool: 'arrow' as DrawTool, Icon: ArrowRight }]),
        ] as const
      ).map(({ tool, Icon }) => (
        <Pressable
          key={tool}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onChangeTool(tool);
          }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor:
              activeTool === tool ? 'rgba(255,255,255,0.15)' : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: activeTool === tool ? 1.5 : 0,
            borderColor:
              activeTool === tool ? 'rgba(255,255,255,0.4)' : 'transparent',
          }}
        >
          <Icon
            size={18}
            color={activeTool === tool ? '#fff' : 'rgba(255,255,255,0.45)'}
          />
        </Pressable>
      ))}

      {/* Divider */}
      <View
        style={{
          width: 1,
          height: 28,
          backgroundColor: 'rgba(255,255,255,0.1)',
          marginHorizontal: 2,
        }}
      />

      {/* Undo */}
      <Pressable
        onPress={() => {
          if (canUndo) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onUndo();
          }
        }}
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Undo2 size={17} color={canUndo ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.2)'} />
      </Pressable>

      {/* Redo */}
      <Pressable
        onPress={() => {
          if (canRedo) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onRedo();
          }
        }}
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Redo2 size={17} color={canRedo ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.2)'} />
      </Pressable>

      {/* Clear */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onClear();
        }}
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Trash2 size={16} color="rgba(255,100,100,0.8)" />
      </Pressable>
    </View>
  );
}
