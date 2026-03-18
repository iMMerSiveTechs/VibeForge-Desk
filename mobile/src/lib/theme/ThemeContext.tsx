import React, { useContext, useRef } from 'react';
import useDeskStore from '../state/store';
import { getThemeWithPack, DEFAULT_THEME } from './themes';
import type { ThemeColors } from './themes';
import { applyThemeSafetyPass } from './contrast';

// Cache theme colors at module level to ensure stable references
let cachedThemeId: string | undefined;
let cachedPackId: string | undefined;
let cachedColors: ThemeColors = getThemeWithPack(DEFAULT_THEME).colors;

function getCachedThemeColors(themeId: string, packId: string | undefined): ThemeColors {
  if (themeId === cachedThemeId && packId === cachedPackId) {
    return cachedColors;
  }
  cachedThemeId = themeId;
  cachedPackId = packId;
  const rawColors = getThemeWithPack(themeId, packId).colors;
  cachedColors = applyThemeSafetyPass(rawColors);
  return cachedColors;
}

const ThemeContext = React.createContext<ThemeColors>(cachedColors);

export function ThemeProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  // Use a single selector that returns primitive values to avoid Zustand snapshot issues
  const themeId = useDeskStore((s) => s.currentTheme);
  const packId = useDeskStore((s) => s.currentColorPack);

  // Use ref to track previous values and avoid unnecessary re-renders
  const colorsRef = useRef<ThemeColors>(cachedColors);

  // Only update if theme/pack actually changed
  const colors = getCachedThemeColors(themeId, packId);
  colorsRef.current = colors;

  return <ThemeContext.Provider value={colors}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeColors {
  return useContext(ThemeContext);
}
