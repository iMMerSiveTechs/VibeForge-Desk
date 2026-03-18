/**
 * 3D Canvas Components — Barrel Export
 *
 * All components require @react-three/fiber, three, and expo-gl to be
 * installed. Import from this barrel:
 *
 *   import { DeskScene, Card3D, StickyNote3D, ParticleSystem } from '@/components/canvas/3d';
 */

export { default as DeskScene } from './DeskScene';
export { default as Card3D } from './Card3D';
export { default as StickyNote3D } from './StickyNote3D';
export { default as ParticleSystem } from './ParticleSystem';
export { default as Connector3D } from './Connector3D';
export { default as SpatialView } from './SpatialView';
export {
  default as getThemeLightingConfig,
  getAvailableLightingThemes,
} from './ThemeLighting';

// Re-export types
export type { ParticleStyle } from './ParticleSystem';
export type { LightingConfig } from './ThemeLighting';
