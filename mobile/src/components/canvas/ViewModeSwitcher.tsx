import React, { useState, useCallback } from 'react';
import { View, Pressable, Text, Modal } from 'react-native';
import { Layers, Monitor, Box, Home, ChevronDown, Lock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ViewMode = 'flat' | 'desk' | 'spatial' | 'room';

interface Props {
  currentMode: ViewMode;
  onChangeMode: (mode: ViewMode) => void;
  isPro: boolean;
}

// ---------------------------------------------------------------------------
// Mode definitions
// ---------------------------------------------------------------------------

interface ModeOption {
  mode: ViewMode;
  label: string;
  Icon: React.ComponentType<{ size: number; color: string }>;
  proOnly: boolean;
  comingSoon: boolean;
}

const MODE_OPTIONS: ModeOption[] = [
  { mode: 'flat', label: 'Flat', Icon: Layers, proOnly: false, comingSoon: false },
  { mode: 'desk', label: 'Desk', Icon: Monitor, proOnly: false, comingSoon: false },
  { mode: 'spatial', label: 'Spatial', Icon: Box, proOnly: true, comingSoon: false },
  { mode: 'room', label: 'Room', Icon: Home, proOnly: true, comingSoon: true },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ViewModeSwitcher({ currentMode, onChangeMode, isPro }: Props) {
  const [open, setOpen] = useState<boolean>(false);

  const currentOption = MODE_OPTIONS.find((o) => o.mode === currentMode) ?? MODE_OPTIONS[0];
  const CurrentIcon = currentOption.Icon;

  const handleSelect = useCallback(
    (option: ModeOption) => {
      // Block locked options
      if (option.proOnly && !isPro) return;
      if (option.comingSoon) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onChangeMode(option.mode);
      setOpen(false);
    },
    [isPro, onChangeMode],
  );

  const handleOpenPopover = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOpen(true);
  }, []);

  return (
    <>
      {/* Floating pill trigger */}
      <Pressable
        onPress={handleOpenPopover}
        style={{
          position: 'absolute',
          top: 56,
          right: 16,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: 'rgba(20,20,28,0.92)',
          borderRadius: 16,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.12)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
          elevation: 16,
          zIndex: 250,
          gap: 6,
        }}
      >
        <CurrentIcon size={16} color="#fff" />
        <Text
          style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: 12,
            fontWeight: '600',
            letterSpacing: 0.3,
          }}
        >
          {currentOption.label}
        </Text>
        <ChevronDown size={12} color="rgba(255,255,255,0.45)" />
      </Pressable>

      {/* Popover modal */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          onPress={() => setOpen(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.35)',
          }}
        >
          {/* Popover card - positioned below the trigger */}
          <View
            style={{
              position: 'absolute',
              top: 96,
              right: 16,
              backgroundColor: 'rgba(20,20,28,0.96)',
              borderRadius: 16,
              paddingVertical: 6,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.12)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.5,
              shadowRadius: 20,
              elevation: 24,
              minWidth: 180,
            }}
          >
            {/* Header label */}
            <Text
              style={{
                color: 'rgba(255,255,255,0.35)',
                fontSize: 10,
                fontWeight: '700',
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                paddingHorizontal: 14,
                paddingTop: 8,
                paddingBottom: 6,
              }}
            >
              View Mode
            </Text>

            {MODE_OPTIONS.map((option) => {
              const { mode, label, Icon, proOnly, comingSoon } = option;
              const isSelected = currentMode === mode;
              const isLocked = (proOnly && !isPro) || comingSoon;

              return (
                <Pressable
                  key={mode}
                  onPress={() => handleSelect(option)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    marginHorizontal: 6,
                    borderRadius: 10,
                    backgroundColor: isSelected
                      ? 'rgba(255,255,255,0.12)'
                      : 'transparent',
                    opacity: isLocked ? 0.45 : 1,
                    gap: 10,
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: isSelected
                        ? 'rgba(255,255,255,0.15)'
                        : 'rgba(255,255,255,0.06)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: isSelected ? 1 : 0,
                      borderColor: 'rgba(255,255,255,0.25)',
                    }}
                  >
                    <Icon
                      size={16}
                      color={isSelected ? '#fff' : 'rgba(255,255,255,0.6)'}
                    />
                  </View>

                  <Text
                    style={{
                      flex: 1,
                      color: isSelected ? '#fff' : 'rgba(255,255,255,0.7)',
                      fontSize: 14,
                      fontWeight: isSelected ? '600' : '500',
                    }}
                  >
                    {label}
                  </Text>

                  {/* Pro badge */}
                  {proOnly && !isPro && (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255,180,50,0.15)',
                        borderRadius: 6,
                        paddingHorizontal: 6,
                        paddingVertical: 3,
                        gap: 3,
                      }}
                    >
                      <Lock size={9} color="rgba(255,180,50,0.9)" />
                      <Text
                        style={{
                          color: 'rgba(255,180,50,0.9)',
                          fontSize: 9,
                          fontWeight: '700',
                          letterSpacing: 0.5,
                        }}
                      >
                        PRO
                      </Text>
                    </View>
                  )}

                  {/* Coming soon badge */}
                  {comingSoon && (
                    <View
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        borderRadius: 6,
                        paddingHorizontal: 6,
                        paddingVertical: 3,
                      }}
                    >
                      <Text
                        style={{
                          color: 'rgba(255,255,255,0.35)',
                          fontSize: 9,
                          fontWeight: '600',
                          letterSpacing: 0.3,
                        }}
                      >
                        SOON
                      </Text>
                    </View>
                  )}

                  {/* Selection indicator */}
                  {isSelected && (
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: '#00C853',
                      }}
                    />
                  )}
                </Pressable>
              );
            })}

            {/* Divider */}
            <View
              style={{
                height: 1,
                backgroundColor: 'rgba(255,255,255,0.08)',
                marginHorizontal: 14,
                marginTop: 4,
                marginBottom: 2,
              }}
            />

            {/* Footer hint */}
            <Text
              style={{
                color: 'rgba(255,255,255,0.2)',
                fontSize: 10,
                textAlign: 'center',
                paddingVertical: 8,
                paddingHorizontal: 14,
              }}
            >
              3D views require a compatible device
            </Text>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
