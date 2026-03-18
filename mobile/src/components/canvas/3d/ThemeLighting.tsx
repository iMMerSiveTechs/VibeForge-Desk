/**
 * ThemeLighting.tsx
 *
 * Maps each VibeForge theme to a 3D lighting / atmosphere configuration.
 * Covers all 19 themes defined in src/lib/theme/themes.ts.
 *
 * Usage:
 *   const cfg = getThemeLightingConfig('midnight');
 *   <ambientLight color={cfg.ambientColor} intensity={cfg.ambientIntensity} />
 *
 * Requires: three (for Color validation only; can be used without three at
 * import time since the values are plain strings/numbers).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LightingConfig {
  /** Ambient light intensity (0-1+) */
  ambientIntensity: number;
  /** Ambient light color (hex string) */
  ambientColor: string;
  /** Primary directional light intensity */
  directionalIntensity: number;
  /** Primary directional light color (hex string) */
  directionalColor: string;
  /** Scene fog color (hex string) */
  fogColor: string;
  /** Exponential fog density (0 = none, higher = thicker) */
  fogDensity: number;
  /** Optional accent / rim light color */
  accentLightColor?: string;
  /** Optional accent light intensity */
  accentLightIntensity?: number;
}

// ---------------------------------------------------------------------------
// Configs for each theme
// ---------------------------------------------------------------------------

const CONFIGS: Record<string, LightingConfig> = {
  // 1. Stealth Founder — dim, moody, red accent
  stealth: {
    ambientIntensity: 0.25,
    ambientColor: '#1A1020',
    directionalIntensity: 0.6,
    directionalColor: '#E8D8D0',
    fogColor: '#19141B',
    fogDensity: 0.035,
    accentLightColor: '#D54B56',
    accentLightIntensity: 0.2,
  },

  // 2. Marble Classic — warm white, soft shadows, understated elegance
  marble: {
    ambientIntensity: 0.35,
    ambientColor: '#2A2020',
    directionalIntensity: 0.75,
    directionalColor: '#FFF4E0',
    fogColor: '#1C1A1E',
    fogDensity: 0.025,
    accentLightColor: '#8B6914',
    accentLightIntensity: 0.15,
  },

  // 3. Midnight Terminal — blue/green neon CRT glow
  midnight: {
    ambientIntensity: 0.2,
    ambientColor: '#080E20',
    directionalIntensity: 0.5,
    directionalColor: '#C0D0FF',
    fogColor: '#0A0E1A',
    fogDensity: 0.04,
    accentLightColor: '#4A6CF7',
    accentLightIntensity: 0.35,
  },

  // 4. Warm Studio — golden ambient, cozy warmth
  warm: {
    ambientIntensity: 0.4,
    ambientColor: '#2A1E14',
    directionalIntensity: 0.8,
    directionalColor: '#FFE8C8',
    fogColor: '#1E1814',
    fogDensity: 0.02,
    accentLightColor: '#D47A3A',
    accentLightIntensity: 0.2,
  },

  // 5. Arctic Minimal — bright cool white, clean
  arctic: {
    ambientIntensity: 0.6,
    ambientColor: '#D0D8E8',
    directionalIntensity: 0.9,
    directionalColor: '#F0F4FF',
    fogColor: '#E8ECF0',
    fogDensity: 0.015,
    accentLightColor: '#2A6EAA',
    accentLightIntensity: 0.1,
  },

  // 6. Noir Brass — deep black with warm brass highlights
  noir: {
    ambientIntensity: 0.15,
    ambientColor: '#0A0A0C',
    directionalIntensity: 0.55,
    directionalColor: '#D4B878',
    fogColor: '#0E0E10',
    fogDensity: 0.045,
    accentLightColor: '#D4B878',
    accentLightIntensity: 0.25,
  },

  // 7. Neon Nightshift — vivid neon bloom, dark base
  neon: {
    ambientIntensity: 0.15,
    ambientColor: '#08081A',
    directionalIntensity: 0.4,
    directionalColor: '#A0A0FF',
    fogColor: '#0A0A14',
    fogDensity: 0.04,
    accentLightColor: '#FF4488',
    accentLightIntensity: 0.45,
  },

  // 8. Sandstone Paper — dusty warm, desert tones
  sandstone: {
    ambientIntensity: 0.35,
    ambientColor: '#2A2018',
    directionalIntensity: 0.7,
    directionalColor: '#FFE8C0',
    fogColor: '#2A2418',
    fogDensity: 0.025,
    accentLightColor: '#C87838',
    accentLightIntensity: 0.15,
  },

  // 9. Forest Ledger — deep green, natural daylight
  forest: {
    ambientIntensity: 0.3,
    ambientColor: '#0A1A10',
    directionalIntensity: 0.65,
    directionalColor: '#E0F0D8',
    fogColor: '#0E1A14',
    fogDensity: 0.03,
    accentLightColor: '#2A8A4A',
    accentLightIntensity: 0.2,
  },

  // 10. Violet Ink — purple haze, mystical
  violet: {
    ambientIntensity: 0.25,
    ambientColor: '#140E1E',
    directionalIntensity: 0.55,
    directionalColor: '#E0D0F0',
    fogColor: '#14101E',
    fogDensity: 0.035,
    accentLightColor: '#8A4AE0',
    accentLightIntensity: 0.3,
  },

  // 11. Leather Executive — rich brown, boardroom warmth
  leatherExecutive: {
    ambientIntensity: 0.3,
    ambientColor: '#201410',
    directionalIntensity: 0.7,
    directionalColor: '#FFE4C0',
    fogColor: '#3D2817',
    fogDensity: 0.025,
    accentLightColor: '#D4AF37',
    accentLightIntensity: 0.2,
  },

  // 12. Recycled Kraft — bright, earthy, natural daylight
  recycledKraft: {
    ambientIntensity: 0.5,
    ambientColor: '#C09060',
    directionalIntensity: 0.85,
    directionalColor: '#FFF8E8',
    fogColor: '#C8A070',
    fogDensity: 0.015,
    accentLightColor: '#E74C3C',
    accentLightIntensity: 0.1,
  },

  // 13. Cyber Graphite — industrial grey, cyan accent glow
  cyberGraphite: {
    ambientIntensity: 0.2,
    ambientColor: '#0E0E10',
    directionalIntensity: 0.5,
    directionalColor: '#D0D8E0',
    fogColor: '#1A1A1A',
    fogDensity: 0.04,
    accentLightColor: '#00D9FF',
    accentLightIntensity: 0.35,
  },

  // 14. Vintage Typewriter — warm sepia, incandescent
  vintageTypewriter: {
    ambientIntensity: 0.3,
    ambientColor: '#1A1610',
    directionalIntensity: 0.65,
    directionalColor: '#FFE0B0',
    fogColor: '#1A1612',
    fogDensity: 0.03,
    accentLightColor: '#D84C2A',
    accentLightIntensity: 0.15,
  },

  // 15. Space White — bright, airy, slight blue tint
  spaceWhite: {
    ambientIntensity: 0.65,
    ambientColor: '#E0E0F0',
    directionalIntensity: 0.9,
    directionalColor: '#F8F8FF',
    fogColor: '#F0F0F8',
    fogDensity: 0.01,
    accentLightColor: '#4A5AE8',
    accentLightIntensity: 0.1,
  },

  // 16. Oak Workshop — warm wood tones, workshop lighting
  oakWorkshop: {
    ambientIntensity: 0.35,
    ambientColor: '#2A2018',
    directionalIntensity: 0.75,
    directionalColor: '#FFE4C0',
    fogColor: '#4A3A2A',
    fogDensity: 0.02,
    accentLightColor: '#C8A876',
    accentLightIntensity: 0.15,
  },

  // 17. Carbon Fiber — stark contrast, red accent slash
  carbonFiber: {
    ambientIntensity: 0.2,
    ambientColor: '#101012',
    directionalIntensity: 0.6,
    directionalColor: '#E0E0E4',
    fogColor: '#1A1A1C',
    fogDensity: 0.035,
    accentLightColor: '#E84C3A',
    accentLightIntensity: 0.25,
  },

  // 18. Blueprint Engineer — deep navy with gold highlights
  blueprintEngineer: {
    ambientIntensity: 0.25,
    ambientColor: '#0A1420',
    directionalIntensity: 0.6,
    directionalColor: '#D0D8F0',
    fogColor: '#0D1E30',
    fogDensity: 0.035,
    accentLightColor: '#FFD700',
    accentLightIntensity: 0.3,
  },

  // 19. VibeForge Brand — deep midnight, crimson + green accents
  vibeforge: {
    ambientIntensity: 0.2,
    ambientColor: '#0A0A14',
    directionalIntensity: 0.55,
    directionalColor: '#E0E0F8',
    fogColor: '#0D0D12',
    fogDensity: 0.04,
    accentLightColor: '#FF3A5C',
    accentLightIntensity: 0.35,
  },
};

// ---------------------------------------------------------------------------
// Default fallback
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: LightingConfig = {
  ambientIntensity: 0.3,
  ambientColor: '#1A1A20',
  directionalIntensity: 0.65,
  directionalColor: '#F0E8E0',
  fogColor: '#19141B',
  fogDensity: 0.03,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the 3D lighting configuration for a given theme ID.
 * Falls back to a sensible default if the theme is unrecognized.
 */
export function getThemeLightingConfig(themeId: string): LightingConfig {
  return CONFIGS[themeId] ?? DEFAULT_CONFIG;
}

/**
 * Returns all available theme lighting config IDs (useful for previews).
 */
export function getAvailableLightingThemes(): string[] {
  return Object.keys(CONFIGS);
}

export default getThemeLightingConfig;
