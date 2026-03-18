/**
 * Design tokens for VibeForge Desk themes.
 * Each theme provides: desk, surface, paper, ink, border, accent, shadows
 *
 * AUDIT NOTE (theme list mismatch with themes.ts):
 *
 * Themes in themes.ts but NOT in tokens.ts (added as stubs below):
 *   - recycled-kraft
 *   - cyber-graphite
 *   - vintage-typewriter
 *   - space-white
 *   - oak-workshop
 *   - carbon-fiber
 *   - vibeforge-brand
 *
 * Themes in tokens.ts but NOT in themes.ts:
 *   - ash-ember
 *   - ocean-quartz
 *   - mono-graphite
 *   - cherry-blossom-office
 *   - copper-circuit
 *   - alpine-slate
 */

export interface ThemeTokens {
  desk: string;        // Main background
  surface: string;     // Card/container
  paper: string;       // Text input/note backgrounds
  ink: string;         // Primary text
  border: string;      // Dividers
  accent: string;      // Action highlights
  shadows: string;     // Shadow color
}

export const themes: Record<string, ThemeTokens> = {
  // Original 10 themes
  'stealth-founder': {
    desk: '#0a0e27',
    surface: '#151b3b',
    paper: '#1f2644',
    ink: '#e8eaf6',
    border: '#2e3a5f',
    accent: '#00d9ff',
    shadows: '#000000',
  },
  'marble-classic': {
    desk: '#f5f5f5',
    surface: '#ffffff',
    paper: '#fafafa',
    ink: '#333333',
    border: '#e0e0e0',
    accent: '#2196f3',
    shadows: '#000000',
  },
  'midnight-terminal': {
    desk: '#0d1117',
    surface: '#161b22',
    paper: '#0d1117',
    ink: '#8b949e',
    border: '#30363d',
    accent: '#58a6ff',
    shadows: '#000000',
  },
  'warm-studio': {
    desk: '#f3e5d5',
    surface: '#f9e8dc',
    paper: '#fff3e8',
    ink: '#4a3728',
    border: '#e8d5c4',
    accent: '#d97706',
    shadows: '#8b7355',
  },
  'arctic-minimal': {
    desk: '#e6f2ff',
    surface: '#f0f7ff',
    paper: '#f8fbff',
    ink: '#1a3a52',
    border: '#d0e8f2',
    accent: '#0ea5e9',
    shadows: '#1a3a52',
  },
  'noir-brass': {
    desk: '#1a1a1a',
    surface: '#2d2d2d',
    paper: '#242424',
    ink: '#d4af37',
    border: '#444444',
    accent: '#d4af37',
    shadows: '#000000',
  },
  'neon-nightshift': {
    desk: '#0f0f1f',
    surface: '#1a1a3a',
    paper: '#0f0f1f',
    ink: '#00ff88',
    border: '#2a2a5a',
    accent: '#ff00ff',
    shadows: '#000000',
  },
  'sandstone-paper': {
    desk: '#e8dcc8',
    surface: '#f2ede5',
    paper: '#faf6f0',
    ink: '#5a4a3a',
    border: '#d9cfc5',
    accent: '#c67c4e',
    shadows: '#9b8b7b',
  },
  'forest-ledger': {
    desk: '#1a3a2e',
    surface: '#2d5a4a',
    paper: '#3d7a6a',
    ink: '#e8f5f0',
    border: '#4a8a7a',
    accent: '#64d5b8',
    shadows: '#0f1f1a',
  },
  'violet-ink': {
    desk: '#2d1b4e',
    surface: '#3d2b6e',
    paper: '#4d3b7e',
    ink: '#e8d5ff',
    border: '#5d4b8e',
    accent: '#d18eff',
    shadows: '#1a0f2e',
  },

  // NEW 8 themes
  'leather-executive': {
    desk: '#3a2f2a',
    surface: '#4a3f3a',
    paper: '#5a4f4a',
    ink: '#e6d7cc',
    border: '#6a5f5a',
    accent: '#d4a574',
    shadows: '#1a0f0a',
  },
  'blueprint-engineer': {
    desk: '#0d2847',
    surface: '#1a3f6a',
    paper: '#265399',
    ink: '#b8d7ff',
    border: '#3366cc',
    accent: '#66b3ff',
    shadows: '#001a33',
  },
  'ash-ember': {
    desk: '#2a2420',
    surface: '#3a3430',
    paper: '#4a4440',
    ink: '#ffb88c',
    border: '#5a5450',
    accent: '#ff6b35',
    shadows: '#0a0000',
  },
  'ocean-quartz': {
    desk: '#1a3a4a',
    surface: '#2a5a7a',
    paper: '#3a7a9a',
    ink: '#c8e6f5',
    border: '#4a8faa',
    accent: '#4ecdc4',
    shadows: '#0a1a2a',
  },
  'mono-graphite': {
    desk: '#2a2a2a',
    surface: '#3f3f3f',
    paper: '#4a4a4a',
    ink: '#e0e0e0',
    border: '#555555',
    accent: '#b0b0b0',
    shadows: '#000000',
  },
  'cherry-blossom-office': {
    desk: '#fff0f5',
    surface: '#fff5fa',
    paper: '#fffafc',
    ink: '#5a1a3a',
    border: '#ffd7e8',
    accent: '#ff69b4',
    shadows: '#8b4a6a',
  },
  'copper-circuit': {
    desk: '#1a1a1a',
    surface: '#2d2420',
    paper: '#3a3330',
    ink: '#d4a574',
    border: '#8b6f47',
    accent: '#d17e4a',
    shadows: '#000000',
  },
  'alpine-slate': {
    desk: '#2a3f4a',
    surface: '#3a5a6a',
    paper: '#4a7a8a',
    ink: '#d0dce5',
    border: '#5a8a9a',
    accent: '#7cb8d4',
    shadows: '#1a2a3a',
  },

  // Stubs for themes present in themes.ts but previously missing here
  'recycled-kraft': {
    desk: '#d4a574',
    surface: '#e0b080',
    paper: '#f0e8d0',
    ink: '#3a3a3a',
    border: '#8b6f47',
    accent: '#e74c3c',
    shadows: '#6a5a48',
  },
  'cyber-graphite': {
    desk: '#1a1a1a',
    surface: '#2a2a2a',
    paper: '#e8e8e8',
    ink: '#e8e8e8',
    border: '#3a3a3a',
    accent: '#00d9ff',
    shadows: '#000000',
  },
  'vintage-typewriter': {
    desk: '#1a1612',
    surface: '#2a2418',
    paper: '#f5f1e8',
    ink: '#f0e8d0',
    border: '#3a3228',
    accent: '#d84c2a',
    shadows: '#0f0d0a',
  },
  'space-white': {
    desk: '#f8f8fa',
    surface: '#f0f0f5',
    paper: '#fafbfc',
    ink: '#2a2a3a',
    border: '#d8d8e0',
    accent: '#4a5ae8',
    shadows: '#7a7a8a',
  },
  'oak-workshop': {
    desk: '#4a3a2a',
    surface: '#5a4a38',
    paper: '#f0e8d0',
    ink: '#e8dcc8',
    border: '#6a5a48',
    accent: '#c8a876',
    shadows: '#2a1a0a',
  },
  'carbon-fiber': {
    desk: '#1a1a1c',
    surface: '#282829',
    paper: '#f0f0f2',
    ink: '#e8e8ea',
    border: '#3a3a3c',
    accent: '#e84c3a',
    shadows: '#000000',
  },
  'vibeforge-brand': {
    desk: '#0d0d12',
    surface: '#1a1a24',
    paper: '#eeeef8',
    ink: '#f5f5ff',
    border: '#1e1e2c',
    accent: '#ff3a5c',
    shadows: '#000000',
  },
};

export const themeNames: Record<string, string> = {
  'stealth-founder': 'Stealth Founder',
  'marble-classic': 'Marble Classic',
  'midnight-terminal': 'Midnight Terminal',
  'warm-studio': 'Warm Studio',
  'arctic-minimal': 'Arctic Minimal',
  'noir-brass': 'Noir Brass',
  'neon-nightshift': 'Neon Nightshift',
  'sandstone-paper': 'Sandstone Paper',
  'forest-ledger': 'Forest Ledger',
  'violet-ink': 'Violet Ink',
  'leather-executive': 'Leather Executive',
  'blueprint-engineer': 'Blueprint Engineer',
  'ash-ember': 'Ash & Ember',
  'ocean-quartz': 'Ocean Quartz',
  'mono-graphite': 'Mono Graphite',
  'cherry-blossom-office': 'Cherry Blossom Office',
  'copper-circuit': 'Copper Circuit',
  'alpine-slate': 'Alpine Slate',
  'recycled-kraft': 'Recycled Kraft',
  'cyber-graphite': 'Cyber Graphite',
  'vintage-typewriter': 'Vintage Typewriter',
  'space-white': 'Space White',
  'oak-workshop': 'Oak Workshop',
  'carbon-fiber': 'Carbon Fiber',
  'vibeforge-brand': 'VibeForge Brand',
};
