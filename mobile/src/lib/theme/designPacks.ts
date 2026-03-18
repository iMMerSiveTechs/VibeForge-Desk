import type { ThemeColors } from './themes';

// ---------------------------------------------------------------------------
// Design Pack UI Tokens — these are the values components actually READ
// ---------------------------------------------------------------------------

export interface PackTokens {
  // Card geometry
  cardRadius: number;
  cardBorderWidth: number;
  cardBorderOpacity: number; // multiplied onto border color alpha

  // Card shadow
  cardShadowOpacity: number;
  cardShadowRadius: number;
  cardShadowOffsetY: number;

  // Background overlay style
  bgOverlay: 'none' | 'grid' | 'noise' | 'lines' | 'blueprint';
  bgOverlayOpacity: number;

  // Button / chip style
  buttonStyle: 'filled' | 'outline' | 'ghost';

  // Glow: applied to accent badges, progress bars, etc.
  glowStrength: number; // 0–1, used as shadow opacity on accent elements

  // Spacing scale
  spacingScale: number; // multiply base padding by this
}

// ---------------------------------------------------------------------------
// Design Pack Types
// ---------------------------------------------------------------------------

export interface DesignPackOverrides {
  accentColor?: string;
  paperTexture?: 'smooth' | 'linen' | 'kraft' | 'glass';
  ruleStyle?: 'steno' | 'ruled' | 'dotgrid' | 'blueprint' | 'minimal';
  cardShadow?: 'flat' | 'lifted' | 'cinematic';
  iconSetKey?: string;
}

export interface DesignPack {
  id: string;
  name: string;
  description: string;
  overrides: DesignPackOverrides;
  tokens: PackTokens;
}

// ---------------------------------------------------------------------------
// Default tokens (no pack selected)
// ---------------------------------------------------------------------------

export const DEFAULT_PACK_TOKENS: PackTokens = {
  cardRadius: 16,
  cardBorderWidth: 0.5,
  cardBorderOpacity: 1,
  cardShadowOpacity: 0.28,
  cardShadowRadius: 8,
  cardShadowOffsetY: 4,
  bgOverlay: 'none',
  bgOverlayOpacity: 0,
  buttonStyle: 'filled',
  glowStrength: 0,
  spacingScale: 1,
};

// ---------------------------------------------------------------------------
// Design Packs — each must produce a visibly different look
// ---------------------------------------------------------------------------

export const DESIGN_PACKS: DesignPack[] = [
  {
    id: 'metallic',
    name: 'Metallic',
    description: 'Shiny, lifted surfaces with strong shadows and tight corners',
    overrides: {
      paperTexture: 'smooth',
      ruleStyle: 'ruled',
      cardShadow: 'lifted',
      iconSetKey: 'modern',
    },
    tokens: {
      cardRadius: 10,
      cardBorderWidth: 1,
      cardBorderOpacity: 0.6,
      cardShadowOpacity: 0.45,
      cardShadowRadius: 14,
      cardShadowOffsetY: 7,
      bgOverlay: 'none',
      bgOverlayOpacity: 0,
      buttonStyle: 'filled',
      glowStrength: 0.15,
      spacingScale: 1,
    },
  },
  {
    id: 'neon',
    name: 'Neon',
    description: 'Glowing accents, cinematic shadows, dark glass surfaces',
    overrides: {
      paperTexture: 'smooth',
      ruleStyle: 'minimal',
      cardShadow: 'cinematic',
      iconSetKey: 'modern',
    },
    tokens: {
      cardRadius: 18,
      cardBorderWidth: 1,
      cardBorderOpacity: 0.9,
      cardShadowOpacity: 0.6,
      cardShadowRadius: 22,
      cardShadowOffsetY: 8,
      bgOverlay: 'noise',
      bgOverlayOpacity: 0.06,
      buttonStyle: 'outline',
      glowStrength: 0.6,
      spacingScale: 1,
    },
  },
  {
    id: 'flat',
    name: 'Flat',
    description: 'Zero shadows, bold borders, crisp pure-color surfaces',
    overrides: {
      paperTexture: 'smooth',
      ruleStyle: 'minimal',
      cardShadow: 'flat',
      iconSetKey: 'modern',
    },
    tokens: {
      cardRadius: 8,
      cardBorderWidth: 1.5,
      cardBorderOpacity: 1.2,
      cardShadowOpacity: 0,
      cardShadowRadius: 0,
      cardShadowOffsetY: 0,
      bgOverlay: 'none',
      bgOverlayOpacity: 0,
      buttonStyle: 'outline',
      glowStrength: 0,
      spacingScale: 0.95,
    },
  },
  {
    id: 'pastel',
    name: 'Pastel',
    description: 'Soft rounded cards with linen texture and gentle shadows',
    overrides: {
      paperTexture: 'linen',
      ruleStyle: 'dotgrid',
      cardShadow: 'lifted',
      iconSetKey: 'modern',
    },
    tokens: {
      cardRadius: 24,
      cardBorderWidth: 0,
      cardBorderOpacity: 0.3,
      cardShadowOpacity: 0.12,
      cardShadowRadius: 10,
      cardShadowOffsetY: 3,
      bgOverlay: 'lines',
      bgOverlayOpacity: 0.05,
      buttonStyle: 'filled',
      glowStrength: 0,
      spacingScale: 1.08,
    },
  },
  {
    id: 'vintage-typewriter',
    name: 'Vintage Typewriter',
    description: 'Kraft paper texture, steno rule, aged warm shadows',
    overrides: {
      accentColor: '#D84C2A',
      paperTexture: 'kraft',
      ruleStyle: 'steno',
      cardShadow: 'lifted',
      iconSetKey: 'vintage',
    },
    tokens: {
      cardRadius: 4,
      cardBorderWidth: 1,
      cardBorderOpacity: 0.8,
      cardShadowOpacity: 0.35,
      cardShadowRadius: 6,
      cardShadowOffsetY: 3,
      bgOverlay: 'lines',
      bgOverlayOpacity: 0.08,
      buttonStyle: 'outline',
      glowStrength: 0,
      spacingScale: 1,
    },
  },
  {
    id: 'blueprint-grid',
    name: 'Blueprint Grid',
    description: 'Engineering grid overlay, technical corners, flat shadows',
    overrides: {
      accentColor: '#FFD700',
      paperTexture: 'smooth',
      ruleStyle: 'blueprint',
      cardShadow: 'flat',
      iconSetKey: 'engineering',
    },
    tokens: {
      cardRadius: 2,
      cardBorderWidth: 1,
      cardBorderOpacity: 1,
      cardShadowOpacity: 0,
      cardShadowRadius: 0,
      cardShadowOffsetY: 0,
      bgOverlay: 'blueprint',
      bgOverlayOpacity: 0.09,
      buttonStyle: 'outline',
      glowStrength: 0.2,
      spacingScale: 1,
    },
  },
  {
    id: 'minimal-ink',
    name: 'Minimal Ink',
    description: 'Ultra-clean, hairline borders, no shadows, maximum whitespace',
    overrides: {
      accentColor: '#2A2A3A',
      paperTexture: 'smooth',
      ruleStyle: 'minimal',
      cardShadow: 'flat',
      iconSetKey: 'minimal',
    },
    tokens: {
      cardRadius: 6,
      cardBorderWidth: 0.75,
      cardBorderOpacity: 0.5,
      cardShadowOpacity: 0,
      cardShadowRadius: 0,
      cardShadowOffsetY: 0,
      bgOverlay: 'none',
      bgOverlayOpacity: 0,
      buttonStyle: 'ghost',
      glowStrength: 0,
      spacingScale: 1.15,
    },
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    description: 'Thick borders, bold shadows, accessibility-focused maximum contrast',
    overrides: {
      paperTexture: 'smooth',
      ruleStyle: 'ruled',
      cardShadow: 'lifted',
      iconSetKey: 'bold',
    },
    tokens: {
      cardRadius: 12,
      cardBorderWidth: 2,
      cardBorderOpacity: 1.5,
      cardShadowOpacity: 0.5,
      cardShadowRadius: 12,
      cardShadowOffsetY: 6,
      bgOverlay: 'none',
      bgOverlayOpacity: 0,
      buttonStyle: 'filled',
      glowStrength: 0.1,
      spacingScale: 1.05,
    },
  },
  {
    id: 'vibeforge-brand',
    name: 'VibeForge Brand',
    description: 'Signature brand style — sharp edges, crimson glow, electric accents',
    overrides: {
      accentColor: '#FF3A5C',
      paperTexture: 'smooth',
      ruleStyle: 'minimal',
      cardShadow: 'cinematic',
      iconSetKey: 'modern',
    },
    tokens: {
      cardRadius: 14,
      cardBorderWidth: 1,
      cardBorderOpacity: 0.8,
      cardShadowOpacity: 0.5,
      cardShadowRadius: 18,
      cardShadowOffsetY: 6,
      bgOverlay: 'noise',
      bgOverlayOpacity: 0.05,
      buttonStyle: 'filled',
      glowStrength: 0.45,
      spacingScale: 1,
    },
  },
];

// ---------------------------------------------------------------------------
// Design Pack Application (color overrides)
// ---------------------------------------------------------------------------

export interface DesignedColors extends ThemeColors {
  __designPack?: DesignPack;
  __paperTexture?: string;
  __ruleStyle?: string;
  __cardShadow?: string;
}

export function applyDesignPack(
  baseColors: ThemeColors,
  pack?: DesignPack,
): DesignedColors {
  if (!pack) {
    return { ...baseColors } as DesignedColors;
  }

  const overrides = pack.overrides;
  const result: DesignedColors = { ...baseColors };

  // Apply accent color override if specified
  if (overrides.accentColor) {
    result.spineAccent = overrides.accentColor;
    result.brandGreen = overrides.accentColor;
    result.stickyYellow = overrides.accentColor;
  }

  // Store design hints for use by UI components
  (result as any).__designPack = pack;
  (result as any).__paperTexture = overrides.paperTexture ?? 'smooth';
  (result as any).__ruleStyle = overrides.ruleStyle ?? 'ruled';
  (result as any).__cardShadow = overrides.cardShadow ?? 'lifted';

  return result;
}

export function getDesignPack(id?: string): DesignPack | undefined {
  if (!id) return undefined;
  return DESIGN_PACKS.find((p) => p.id === id);
}

export function getPackTokens(packId?: string): PackTokens {
  if (!packId) return DEFAULT_PACK_TOKENS;
  return getDesignPack(packId)?.tokens ?? DEFAULT_PACK_TOKENS;
}
