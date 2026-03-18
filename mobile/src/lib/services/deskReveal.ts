/**
 * VibeForge Desk Reveal Shell
 * Foundation for introduction sequence with lottie placeholder
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const INTRO_KEY = '@vf_desk_intro_shown';

export interface DeskRevealConfig {
  enabled: boolean;
  duration: number; // ms
}

export async function checkAndMarkIntroShown(): Promise<boolean> {
  try {
    const shown = await AsyncStorage.getItem(INTRO_KEY);
    if (!shown) {
      await AsyncStorage.setItem(INTRO_KEY, 'true');
      return false; // First time, should show intro
    }
    return true; // Already shown
  } catch {
    return true; // On error, skip intro
  }
}

export async function resetIntroState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(INTRO_KEY);
  } catch {
    // ignore
  }
}

/**
 * Placeholder Lottie animation config for reveal sequence:
 * - 500ms: Felt texture fade in
 * - 1000ms: Camera drop animation
 * - 1500ms: Stacks settle into place
 *
 * This is a comment placeholder for assets to be added.
 * Use actual Lottie JSON files when implementing.
 */
export const REVEAL_ANIMATION_CONFIG = {
  texturePhase: { start: 0, duration: 500 },
  cameraDropPhase: { start: 500, duration: 1000 },
  stackSettlePhase: { start: 1500, duration: 2000 },
  totalDuration: 3500,
};
