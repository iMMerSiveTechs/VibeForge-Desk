export interface ThemeColors {
  desk: string;
  deskHl: string;
  coverPrimary: string;
  coverMarble: string;
  labelPlate: string;
  spineAccent: string;
  paper: string;
  ruleBlue: string;
  marginRed: string;
  plannerGreen: string;
  plannerPaper: string;
  stickyYellow: string;
  stickyGreen: string;
  brandGreen: string;
  textOnDesk: string;
  muted: string;
  ink: string;
  danger: string;
  border: string;
}

export interface Theme {
  name: string;
  colors: ThemeColors;
  swatches: string[];
}

const stealth: Theme = {
  name: 'Stealth Founder',
  colors: {
    desk: '#19141B',
    deskHl: '#232226',
    coverPrimary: '#0F0F0F',
    coverMarble: '#2A2A2A',
    labelPlate: '#F5F5F5',
    spineAccent: '#D54B56',
    paper: '#D9D8D5',
    ruleBlue: '#5FB0D6',
    marginRed: '#D54B56',
    plannerGreen: '#5B6961',
    plannerPaper: '#EFEBE1',
    stickyYellow: '#DEDD5A',
    stickyGreen: '#CFE6A8',
    brandGreen: '#00C853',
    textOnDesk: '#F0F0F0',
    muted: '#A9A9B2',
    ink: '#121216',
    danger: '#FF3B30',
    border: 'rgba(255,255,255,0.10)',
  },
  swatches: ['#19141B', '#D54B56', '#5B6961', '#DEDD5A'],
};

const marble: Theme = {
  name: 'Marble Classic',
  colors: {
    desk: '#1C1A1E',
    deskHl: '#2A272D',
    coverPrimary: '#0A0A0C',
    coverMarble: '#3A3A3E',
    labelPlate: '#ECECEC',
    spineAccent: '#8B6914',
    paper: '#E8E4DA',
    ruleBlue: '#7BAFC4',
    marginRed: '#C4785A',
    plannerGreen: '#4A5E52',
    plannerPaper: '#F0ECE2',
    stickyYellow: '#E8D44D',
    stickyGreen: '#B8D48A',
    brandGreen: '#8B6914',
    textOnDesk: '#EDE9E0',
    muted: '#9A958C',
    ink: '#1A1814',
    danger: '#C44B3A',
    border: 'rgba(255,255,255,0.10)',
  },
  swatches: ['#1C1A1E', '#8B6914', '#4A5E52', '#E8D44D'],
};

const midnight: Theme = {
  name: 'Midnight Terminal',
  colors: {
    desk: '#0A0E1A',
    deskHl: '#141826',
    coverPrimary: '#060810',
    coverMarble: '#1A1E2E',
    labelPlate: '#D0D4E0',
    spineAccent: '#4A6CF7',
    paper: '#C8CCD8',
    ruleBlue: '#4A6CF7',
    marginRed: '#F74A6C',
    plannerGreen: '#2D5A4A',
    plannerPaper: '#E0E4EA',
    stickyYellow: '#F7D94A',
    stickyGreen: '#7AE0A8',
    brandGreen: '#4AE08A',
    textOnDesk: '#D0D8F0',
    muted: '#6A7090',
    ink: '#0A0E18',
    danger: '#F74A4A',
    border: 'rgba(255,255,255,0.10)',
  },
  swatches: ['#0A0E1A', '#4A6CF7', '#2D5A4A', '#F7D94A'],
};

const warm: Theme = {
  name: 'Warm Studio',
  colors: {
    desk: '#1E1814',
    deskHl: '#2A221C',
    coverPrimary: '#12100E',
    coverMarble: '#3A3028',
    labelPlate: '#F0E8D8',
    spineAccent: '#D47A3A',
    paper: '#E8DCC8',
    ruleBlue: '#8BAEC0',
    marginRed: '#C45A4A',
    plannerGreen: '#5A6E48',
    plannerPaper: '#F0E8D8',
    stickyYellow: '#E8C840',
    stickyGreen: '#B8D080',
    brandGreen: '#D47A3A',
    textOnDesk: '#E8DCC8',
    muted: '#9A8E7C',
    ink: '#1A1612',
    danger: '#C44A3A',
    border: 'rgba(255,255,255,0.10)',
  },
  swatches: ['#1E1814', '#D47A3A', '#5A6E48', '#E8C840'],
};

const arctic: Theme = {
  name: 'Arctic Minimal',
  colors: {
    desk: '#F0F2F5',
    deskHl: '#E0E4E8',
    coverPrimary: '#D0D4D8',
    coverMarble: '#B0B8C0',
    labelPlate: '#1A1A2E',
    spineAccent: '#2A6EAA',
    paper: '#FAFBFC',
    ruleBlue: '#2A6EAA',
    marginRed: '#D04040',
    plannerGreen: '#2A7A5A',
    plannerPaper: '#F5F7FA',
    stickyYellow: '#F0D848',
    stickyGreen: '#A8E0B8',
    brandGreen: '#2A6EAA',
    textOnDesk: '#1A1A2E',
    muted: '#6A7080',
    ink: '#1A1A2E',
    danger: '#D04040',
    border: 'rgba(0,0,0,0.10)',
  },
  swatches: ['#F0F2F5', '#2A6EAA', '#2A7A5A', '#F0D848'],
};

const noir: Theme = {
  name: 'Noir Brass',
  colors: {
    desk: '#0E0E10',
    deskHl: '#1A1A1E',
    coverPrimary: '#060608',
    coverMarble: '#2A2A2E',
    labelPlate: '#D4B878',
    spineAccent: '#D4B878',
    paper: '#D8D4C8',
    ruleBlue: '#8A9AA8',
    marginRed: '#C8584A',
    plannerGreen: '#4A5E4A',
    plannerPaper: '#E8E4D8',
    stickyYellow: '#D4B878',
    stickyGreen: '#98C898',
    brandGreen: '#D4B878',
    textOnDesk: '#D4B878',
    muted: '#6A6A70',
    ink: '#0E0E10',
    danger: '#C84848',
    border: 'rgba(212,184,120,0.15)',
  },
  swatches: ['#0E0E10', '#D4B878', '#4A5E4A', '#D4B878'],
};

const neon: Theme = {
  name: 'Neon Nightshift',
  colors: {
    desk: '#0A0A14',
    deskHl: '#14142A',
    coverPrimary: '#060610',
    coverMarble: '#1A1A30',
    labelPlate: '#E0E0F0',
    spineAccent: '#FF4488',
    paper: '#D0D0E0',
    ruleBlue: '#44AAFF',
    marginRed: '#FF4488',
    plannerGreen: '#00CC88',
    plannerPaper: '#E8E8F0',
    stickyYellow: '#FFEE44',
    stickyGreen: '#44FF88',
    brandGreen: '#00FF88',
    textOnDesk: '#E0E0F0',
    muted: '#6060A0',
    ink: '#0A0A14',
    danger: '#FF4444',
    border: 'rgba(0,255,136,0.12)',
  },
  swatches: ['#0A0A14', '#FF4488', '#00CC88', '#FFEE44'],
};

const sandstone: Theme = {
  name: 'Sandstone Paper',
  colors: {
    desk: '#2A2418',
    deskHl: '#3A3228',
    coverPrimary: '#1A1610',
    coverMarble: '#4A4030',
    labelPlate: '#F0E8D0',
    spineAccent: '#C87838',
    paper: '#F0E8D0',
    ruleBlue: '#7090A0',
    marginRed: '#B86040',
    plannerGreen: '#5A7040',
    plannerPaper: '#F0E8D0',
    stickyYellow: '#E0C040',
    stickyGreen: '#A0C880',
    brandGreen: '#C87838',
    textOnDesk: '#F0E8D0',
    muted: '#8A7E68',
    ink: '#2A2418',
    danger: '#B84040',
    border: 'rgba(255,255,255,0.08)',
  },
  swatches: ['#2A2418', '#C87838', '#5A7040', '#E0C040'],
};

const forest: Theme = {
  name: 'Forest Ledger',
  colors: {
    desk: '#0E1A14',
    deskHl: '#1A2A20',
    coverPrimary: '#081210',
    coverMarble: '#1A2E22',
    labelPlate: '#D8E8D8',
    spineAccent: '#2A8A4A',
    paper: '#D8E8D8',
    ruleBlue: '#5A90A0',
    marginRed: '#C86040',
    plannerGreen: '#2A6A3A',
    plannerPaper: '#E0F0E0',
    stickyYellow: '#D0C840',
    stickyGreen: '#80D880',
    brandGreen: '#2ACA5A',
    textOnDesk: '#C8E0C8',
    muted: '#5A8A6A',
    ink: '#0E1A14',
    danger: '#C84040',
    border: 'rgba(42,202,90,0.10)',
  },
  swatches: ['#0E1A14', '#2A8A4A', '#2A6A3A', '#D0C840'],
};

const violet: Theme = {
  name: 'Violet Ink',
  colors: {
    desk: '#14101E',
    deskHl: '#201A2E',
    coverPrimary: '#0A0814',
    coverMarble: '#2A2040',
    labelPlate: '#E0D8F0',
    spineAccent: '#8A4AE0',
    paper: '#D8D0E8',
    ruleBlue: '#6A6AF0',
    marginRed: '#E04A6A',
    plannerGreen: '#4A6A5A',
    plannerPaper: '#E8E0F0',
    stickyYellow: '#E0D040',
    stickyGreen: '#A0D8A0',
    brandGreen: '#8A4AE0',
    textOnDesk: '#D8D0F0',
    muted: '#7A6A9A',
    ink: '#14101E',
    danger: '#E04A4A',
    border: 'rgba(138,74,224,0.12)',
  },
  swatches: ['#14101E', '#8A4AE0', '#4A6A5A', '#E0D040'],
};

// ---- New themes (11-18) ----

const leatherExecutive: Theme = {
  name: 'Leather Executive',
  colors: {
    desk: '#3D2817',
    deskHl: '#4A3420',
    coverPrimary: '#2A1810',
    coverMarble: '#5A4230',
    labelPlate: '#D4AF37',
    spineAccent: '#D4AF37',
    paper: '#E8DCC8',
    ruleBlue: '#6B7280',
    marginRed: '#A84C3A',
    plannerGreen: '#556B4A',
    plannerPaper: '#EAE3D0',
    stickyYellow: '#D4C540',
    stickyGreen: '#9CB084',
    brandGreen: '#D4AF37',
    textOnDesk: '#E8DCC8',
    muted: '#8A7A68',
    ink: '#2A1810',
    danger: '#C84040',
    border: 'rgba(212,175,55,0.15)',
  },
  swatches: ['#3D2817', '#D4AF37', '#556B4A', '#D4C540'],
};

const recycledKraft: Theme = {
  name: 'Recycled Kraft',
  colors: {
    desk: '#D4A574',
    deskHl: '#C09860',
    coverPrimary: '#B8956A',
    coverMarble: '#E0B080',
    labelPlate: '#3A3A3A',
    spineAccent: '#E74C3C',
    paper: '#E8DCC8',
    ruleBlue: '#8B6F47',
    marginRed: '#E74C3C',
    plannerGreen: '#5A6E48',
    plannerPaper: '#F0E8D0',
    stickyYellow: '#F0D840',
    stickyGreen: '#A0C880',
    brandGreen: '#E74C3C',
    textOnDesk: '#3A3A3A',
    muted: '#6A6A60',
    ink: '#2A2A2A',
    danger: '#E74C3C',
    border: 'rgba(231,76,60,0.15)',
  },
  swatches: ['#D4A574', '#E74C3C', '#5A6E48', '#F0D840'],
};

const cyberGraphite: Theme = {
  name: 'Cyber Graphite',
  colors: {
    desk: '#1A1A1A',
    deskHl: '#2A2A2A',
    coverPrimary: '#0F0F0F',
    coverMarble: '#3A3A3A',
    labelPlate: '#E8E8E8',
    spineAccent: '#00D9FF',
    paper: '#D0D0D0',
    ruleBlue: '#00D9FF',
    marginRed: '#FF006E',
    plannerGreen: '#00C9A7',
    plannerPaper: '#E8E8E8',
    stickyYellow: '#FFD60A',
    stickyGreen: '#00D9FF',
    brandGreen: '#00D9FF',
    textOnDesk: '#E8E8E8',
    muted: '#808080',
    ink: '#0F0F0F',
    danger: '#FF006E',
    border: 'rgba(0,217,255,0.20)',
  },
  swatches: ['#1A1A1A', '#00D9FF', '#00C9A7', '#FFD60A'],
};

const vintageTypewriter: Theme = {
  name: 'Vintage Typewriter',
  colors: {
    desk: '#1A1612',
    deskHl: '#2A2418',
    coverPrimary: '#0F0D0A',
    coverMarble: '#3A3228',
    labelPlate: '#F0E8D0',
    spineAccent: '#D84C2A',
    paper: '#F5F1E8',
    ruleBlue: '#3A7A4A',
    marginRed: '#E84C3A',
    plannerGreen: '#3A7A4A',
    plannerPaper: '#F5F1E8',
    stickyYellow: '#E8C840',
    stickyGreen: '#7AB080',
    brandGreen: '#3A7A4A',
    textOnDesk: '#F0E8D0',
    muted: '#8A7E68',
    ink: '#1A1612',
    danger: '#E84C3A',
    border: 'rgba(232,76,58,0.10)',
  },
  swatches: ['#1A1612', '#D84C2A', '#3A7A4A', '#E8C840'],
};

const spaceWhite: Theme = {
  name: 'Space White',
  colors: {
    desk: '#F8F8FA',
    deskHl: '#F0F0F5',
    coverPrimary: '#E8E8ED',
    coverMarble: '#D8D8E0',
    labelPlate: '#2A2A3A',
    spineAccent: '#4A5AE8',
    paper: '#FAFBFC',
    ruleBlue: '#4A5AE8',
    marginRed: '#E84A4A',
    plannerGreen: '#2A7A5A',
    plannerPaper: '#F5F7FB',
    stickyYellow: '#F0D848',
    stickyGreen: '#7AC080',
    brandGreen: '#4A5AE8',
    textOnDesk: '#2A2A3A',
    muted: '#7A7A8A',
    ink: '#2A2A3A',
    danger: '#E84A4A',
    border: 'rgba(74,90,232,0.12)',
  },
  swatches: ['#F8F8FA', '#4A5AE8', '#2A7A5A', '#F0D848'],
};

const oakWorkshop: Theme = {
  name: 'Oak Workshop',
  colors: {
    desk: '#4A3A2A',
    deskHl: '#5A4A38',
    coverPrimary: '#3A2A1A',
    coverMarble: '#6A5A48',
    labelPlate: '#D4B896',
    spineAccent: '#C8A876',
    paper: '#E8DCC8',
    ruleBlue: '#7A8A7A',
    marginRed: '#C84A3A',
    plannerGreen: '#5A6E48',
    plannerPaper: '#F0E8D0',
    stickyYellow: '#E8C840',
    stickyGreen: '#A0C880',
    brandGreen: '#C8A876',
    textOnDesk: '#E8DCC8',
    muted: '#9A8A78',
    ink: '#2A1A0A',
    danger: '#C84A3A',
    border: 'rgba(200,168,118,0.15)',
  },
  swatches: ['#4A3A2A', '#C8A876', '#5A6E48', '#E8C840'],
};

const carbonFiber: Theme = {
  name: 'Carbon Fiber',
  colors: {
    desk: '#1A1A1C',
    deskHl: '#282829',
    coverPrimary: '#0F0F10',
    coverMarble: '#3A3A3C',
    labelPlate: '#E8E8EA',
    spineAccent: '#E84C3A',
    paper: '#D8D8DA',
    ruleBlue: '#6A6A70',
    marginRed: '#E84C3A',
    plannerGreen: '#4A6A5A',
    plannerPaper: '#F0F0F2',
    stickyYellow: '#F0D848',
    stickyGreen: '#8AC080',
    brandGreen: '#E84C3A',
    textOnDesk: '#E8E8EA',
    muted: '#7A7A80',
    ink: '#0F0F10',
    danger: '#E84C3A',
    border: 'rgba(232,76,58,0.12)',
  },
  swatches: ['#1A1A1C', '#E84C3A', '#4A6A5A', '#F0D848'],
};

const blueprintEngineer: Theme = {
  name: 'Blueprint Engineer',
  colors: {
    desk: '#0D1E30',        // deep navy — much darker
    deskHl: '#1E4060',      // steel blue card — clearly distinct
    coverPrimary: '#0A1824',
    coverMarble: '#253C52',
    labelPlate: '#D8DCD0',
    spineAccent: '#FFD700',
    paper: '#E0E8F0',
    ruleBlue: '#4A7ABA',
    marginRed: '#FF8C42',
    plannerGreen: '#4A8A6A',
    plannerPaper: '#E8F0F8',
    stickyYellow: '#FFD700',
    stickyGreen: '#6AC080',
    brandGreen: '#FFD700',
    textOnDesk: '#D8DCD0',  // light text on deep navy
    muted: '#7A8A9A',
    ink: '#0D1E30',
    danger: '#FF6B6B',
    border: 'rgba(255,215,0,0.35)',  // stronger gold hairline
  },
  swatches: ['#0D1E30', '#FFD700', '#4A8A6A', '#FF8C42'],
};

const vibeforge: Theme = {
  name: 'VibeForge Brand',
  colors: {
    desk: '#0D0D12',
    deskHl: '#1A1A24',
    coverPrimary: '#080810',
    coverMarble: '#1E1E2C',
    labelPlate: '#F0F0F5',
    spineAccent: '#FF3A5C',
    paper: '#E8E8F0',
    ruleBlue: '#5A8AFF',
    marginRed: '#FF3A5C',
    plannerGreen: '#00C853',
    plannerPaper: '#EEEEF8',
    stickyYellow: '#FFD60A',
    stickyGreen: '#00C853',
    brandGreen: '#00C853',
    textOnDesk: '#F5F5FF',
    muted: '#7070A0',
    ink: '#0D0D12',
    danger: '#FF3B30',
    border: 'rgba(255,58,92,0.18)',
  },
  swatches: ['#0D0D12', '#FF3A5C', '#00C853', '#FFD60A'],
};

export const THEMES: Record<string, Theme> = {
  stealth,
  marble,
  midnight,
  warm,
  arctic,
  noir,
  neon,
  sandstone,
  forest,
  violet,
  leatherExecutive,
  recycledKraft,
  cyberGraphite,
  vintageTypewriter,
  spaceWhite,
  oakWorkshop,
  carbonFiber,
  blueprintEngineer,
  vibeforge,
};

export const DEFAULT_THEME = 'stealth';

export function getTheme(id: string): Theme {
  return THEMES[id] ?? THEMES[DEFAULT_THEME];
}

// ---------------------------------------------------------------------------
// Color Packs
// ---------------------------------------------------------------------------

export interface ColorPack {
  id: string;
  name: string;
  description: string;
  overrides: Partial<ThemeColors>;
}

export const COLOR_PACKS: ColorPack[] = [
  {
    id: 'metallic',
    name: 'Metallic',
    description: 'Chrome and steel accents',
    overrides: {
      coverPrimary: '#2C2C2E',
      spineAccent: '#A8A8AA',
      brandGreen: '#8E8E93',
      stickyYellow: '#C7C7CC',
      stickyGreen: '#D1D1D6',
    },
  },
  {
    id: 'neon_pack',
    name: 'Neon',
    description: 'Electric glow accents',
    overrides: {
      spineAccent: '#FF2D55',
      brandGreen: '#00FF88',
      stickyYellow: '#FFCC00',
      stickyGreen: '#64FFDA',
      plannerGreen: '#00E676',
    },
  },
  {
    id: 'flat',
    name: 'Flat',
    description: 'Clean matte surfaces',
    overrides: {
      coverPrimary: '#34495E',
      spineAccent: '#E74C3C',
      plannerGreen: '#27AE60',
      stickyYellow: '#F1C40F',
      stickyGreen: '#2ECC71',
      brandGreen: '#3498DB',
    },
  },
  {
    id: 'pastel',
    name: 'Pastel',
    description: 'Soft muted tones',
    overrides: {
      coverPrimary: '#5C5470',
      spineAccent: '#E8A0BF',
      plannerGreen: '#B4E197',
      stickyYellow: '#FFE5B4',
      stickyGreen: '#C3F8FF',
      brandGreen: '#B4E197',
      paper: '#FAF0E6',
      plannerPaper: '#FFF8F0',
    },
  },
  {
    id: 'vibeforge',
    name: 'VibeForge',
    description: 'Brand-true crimson, electric green, and deep midnight',
    overrides: {
      spineAccent: '#FF3A5C',
      brandGreen: '#00C853',
      stickyYellow: '#FFD60A',
      stickyGreen: '#00E676',
      plannerGreen: '#00C853',
      border: 'rgba(255,58,92,0.18)',
    },
  },
];

export function getThemeWithPack(themeId: string, packId?: string): Theme {
  const base = getTheme(themeId);
  if (!packId) return base;
  const pack = COLOR_PACKS.find((p) => p.id === packId);
  if (!pack) return base;
  return {
    ...base,
    name: `${base.name} + ${pack.name}`,
    colors: { ...base.colors, ...pack.overrides },
  };
}
