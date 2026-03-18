import { THEMES, type Theme } from './themes';
import { getDesignPack, applyDesignPack, type DesignedColors } from './designPacks';
import type { ItemKind } from '../constants';

// ---------------------------------------------------------------------------
// Theme Resolver
// ---------------------------------------------------------------------------

export interface ThemeResolverInput {
  selectedThemeId: string;
  selectedDesignPackGlobalId?: string;
  selectedDesignPackByToolKind?: Record<ItemKind, string | undefined>;
}

/**
 * Resolves effective theme and design pack for a given context.
 *
 * Priority:
 * 1. Tool-specific design pack (if exists)
 * 2. Global design pack
 * 3. None
 *
 * Returns theme with design pack overrides applied.
 */
export function resolveThemeAndDesignPack(
  input: ThemeResolverInput,
  toolKind?: ItemKind,
): { theme: Theme; designedColors: DesignedColors } {
  const baseTheme = THEMES[input.selectedThemeId] ?? THEMES['stealth'];

  // Determine which design pack to use
  let effectivePackId: string | undefined;

  if (toolKind && input.selectedDesignPackByToolKind?.[toolKind]) {
    // Tool-specific override wins
    effectivePackId = input.selectedDesignPackByToolKind[toolKind];
  } else {
    // Fall back to global
    effectivePackId = input.selectedDesignPackGlobalId;
  }

  const designPack = getDesignPack(effectivePackId);
  const designedColors = applyDesignPack(baseTheme.colors, designPack);

  return {
    theme: baseTheme,
    designedColors,
  };
}

/**
 * Get effective design pack ID for a specific tool kind.
 */
export function getEffectiveDesignPackId(
  input: ThemeResolverInput,
  toolKind: ItemKind,
): string | undefined {
  if (input.selectedDesignPackByToolKind?.[toolKind]) {
    return input.selectedDesignPackByToolKind[toolKind];
  }
  return input.selectedDesignPackGlobalId;
}
