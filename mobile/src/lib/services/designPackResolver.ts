import type { ThemeColors, Theme } from '../theme/themes';
import type { DesignPack } from '../theme/designPacks';
import { getDesignPack } from '../theme/designPacks';
import type { ItemKind } from '../constants';

/**
 * Applies design pack overrides and styling to theme colors.
 * Used to customize the visual appearance of desk items based on design pack selection.
 */
export interface DesignPackResolvedStyles {
  colors: ThemeColors;
  paperTexture?: 'smooth' | 'linen' | 'kraft' | 'glass';
  ruleStyle?: 'steno' | 'ruled' | 'dotgrid' | 'blueprint' | 'minimal';
  cardShadow?: 'flat' | 'lifted' | 'cinematic';
}

/**
 * Resolves design pack styling for a specific item kind.
 * Priority: tool-specific design pack > global design pack > defaults
 */
export function resolveDesignPackStyles(
  baseThemeColors: ThemeColors,
  globalDesignPackId?: string,
  toolKindDesignPackIds?: Record<ItemKind, string | undefined>,
  itemKind?: ItemKind,
): DesignPackResolvedStyles {
  // Determine which design pack ID to use
  let effectivePackId: string | undefined;

  if (itemKind && toolKindDesignPackIds?.[itemKind]) {
    effectivePackId = toolKindDesignPackIds[itemKind];
  } else if (globalDesignPackId) {
    effectivePackId = globalDesignPackId;
  }

  const designPack = effectivePackId ? getDesignPack(effectivePackId) : undefined;

  // Apply design pack overrides
  const colors: ThemeColors = { ...baseThemeColors };
  if (designPack?.overrides.accentColor) {
    colors.spineAccent = designPack.overrides.accentColor;
    colors.brandGreen = designPack.overrides.accentColor;
    colors.stickyYellow = designPack.overrides.accentColor;
  }

  return {
    colors,
    paperTexture: designPack?.overrides.paperTexture ?? 'smooth',
    ruleStyle: designPack?.overrides.ruleStyle ?? 'ruled',
    cardShadow: designPack?.overrides.cardShadow ?? 'lifted',
  };
}

/**
 * Get CSS style object for paper texture overlay.
 * Used to apply visual texture to paper elements.
 */
export function getPaperTextureStyle(texture: string): any {
  switch (texture) {
    case 'linen':
      return {
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,.05) 1px, rgba(0,0,0,.05) 2px)',
      };
    case 'kraft':
      return {
        opacity: 0.98,
      };
    case 'glass':
      return {
        opacity: 0.95,
      };
    case 'smooth':
    default:
      return {};
  }
}

/**
 * Get rule/margin line style for notes.
 * Returns line configuration for rendering in UI.
 */
export function getRuleLineStyle(
  style: string,
  ruleBlue: string,
  marginRed: string,
  paperWidth: number,
): {
  horizontalLines: Array<{ top: number; width: number; color: string }>;
  marginLine?: { x: number; color: string };
} {
  switch (style) {
    case 'steno':
      return {
        horizontalLines: Array.from({ length: 7 }, (_, i) => ({
          top: 40 + i * 22,
          width: paperWidth - 40,
          color: ruleBlue,
        })),
        marginLine: { x: 28, color: marginRed },
      };
    case 'dotgrid':
      return {
        horizontalLines: [],
      };
    case 'blueprint':
      return {
        horizontalLines: Array.from({ length: 10 }, (_, i) => ({
          top: 20 + i * 20,
          width: paperWidth,
          color: ruleBlue,
        })),
      };
    case 'minimal':
      return {
        horizontalLines: [{ top: paperWidth / 2, width: paperWidth, color: ruleBlue }],
      };
    case 'ruled':
    default:
      return {
        horizontalLines: Array.from({ length: 8 }, (_, i) => ({
          top: 35 + i * 20,
          width: paperWidth,
          color: ruleBlue,
        })),
        marginLine: { x: 30, color: marginRed },
      };
  }
}

/**
 * Get shadow style for cards based on design pack.
 */
export function getCardShadowStyle(
  style: string,
): {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
} {
  switch (style) {
    case 'cinematic':
      return {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
      };
    case 'flat':
      return {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
      };
    case 'lifted':
    default:
      return {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
      };
  }
}
