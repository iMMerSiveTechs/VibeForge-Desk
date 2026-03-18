import type { SharedValue } from 'react-native-reanimated';
import { Dimensions } from 'react-native';
import type { useTheme } from '@/lib/theme/ThemeContext';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
export const MIN_CARD_W = 140;
export const MIN_CARD_H = 90;
export const CANVAS_SIZE = 4000;

// Canvas tools
export type DrawTool = 'pan' | 'pen' | 'highlighter' | 'arrow' | 'eraser';

// Active stroke (in-progress drawing)
export interface ActiveStrokeState {
  tool: 'pen' | 'highlighter';
  color: string;
  width: number;
  points: Array<{ x: number; y: number }>;
}

// Resize corner type
export type ResizeCorner = 'tl' | 'tr' | 'br' | 'bl';

// Element palette option
export interface PaletteOption {
  label: string;
  color: string;
  onPress: () => void;
  icon: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function clamp(v: number, min: number, max: number): number {
  'worklet';
  return Math.min(Math.max(v, min), max);
}

export function kindDotColor(kind: string, theme: ReturnType<typeof useTheme>): string {
  switch (kind) {
    case 'plan':
      return theme.coverPrimary;
    case 'task':
      return theme.plannerGreen;
    case 'sticky':
      return theme.stickyYellow;
    case 'note':
      return theme.ruleBlue;
    default:
      return theme.muted;
  }
}
