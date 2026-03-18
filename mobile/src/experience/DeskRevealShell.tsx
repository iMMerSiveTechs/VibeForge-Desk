import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

/**
 * DeskRevealShell: Foundation for opening animation on app launch.
 *
 * This is a dormant foundation layer for future reveal animation.
 * Currently provides:
 * - LastIntroDate tracking (AsyncStorage)
 * - Enable/disable flag in settings
 * - Placeholder shared values and comments for Reanimated sequence
 *
 * Does NOT render any UI or animation. Ready for implementation when needed.
 */

const INTRO_STORAGE_KEY = 'desk.intro.lastDate';

/**
 * Get the last date the intro animation was shown.
 */
export async function getLastIntroDate(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(INTRO_STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to read intro date:', e);
    return null;
  }
}

/**
 * Set the intro animation as shown (today).
 */
export async function setIntroShownToday(): Promise<void> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    await AsyncStorage.setItem(INTRO_STORAGE_KEY, today);
  } catch (e) {
    console.warn('Failed to save intro date:', e);
  }
}

/**
 * Check if intro should be shown based on last shown date and enabled flag.
 */
export async function shouldShowIntro(enabledFlag: boolean): Promise<boolean> {
  if (!enabledFlag) return false;

  const lastDate = await getLastIntroDate();
  if (!lastDate) return true; // Never shown

  const today = new Date().toISOString().slice(0, 10);
  return lastDate !== today; // Show once per day
}

/**
 * Placeholder shared value for reveal animation.
 *
 * Future implementation can use this with Reanimated:
 * ```
 * const revealProgress = useSharedValue(0);
 * useEffect(() => {
 *   revealProgress.value = withTiming(1, { duration: 1000 });
 * }, []);
 * ```
 */
export function useDeskRevealAnimation() {
  const revealProgress = useSharedValue(0); // 0-1
  const cardScale = useSharedValue(0.8); // Start small
  const cardOpacity = useSharedValue(0); // Start transparent

  /**
   * Trigger reveal sequence.
   * Can be called from DeskScreen after mount.
   *
   * Example usage (future):
   * ```
   * useEffect(() => {
   *   if (shouldShowIntro) {
   *     startReveal();
   *     setIntroShownToday();
   *   }
   * }, []);
   * ```
   */
  const startReveal = async () => {
    // Placeholder sequence. Implementation would:
    // 1. Fade in background
    // 2. Stagger card reveals (plan, task, sticky, note)
    // 3. Animate card scale and opacity
    // 4. Transition to normal desk view

    // For now, just jump to final state
    revealProgress.value = 1;
    cardScale.value = 1;
    cardOpacity.value = 1;
  };

  return {
    revealProgress,
    cardScale,
    cardOpacity,
    startReveal,
  };
}

/**
 * DeskRevealShell Component (placeholder).
 *
 * Future: Replace with actual animated reveal overlay.
 * For now, this is a structural container with no UI.
 *
 * When implementing:
 * - Create overlay View with absolute positioning
 * - Use Animated.View for card stagger
 * - Coordinate with useDeskRevealAnimation hook
 * - Fire startReveal() after DeskScreen mounts
 */
export function DeskRevealShell({ enabled, onComplete }: { enabled: boolean; onComplete: () => void }) {
  // TODO: Implement reveal animation UI
  // For now, just call onComplete immediately
  React.useEffect(() => {
    onComplete();
  }, [onComplete]);

  return null; // No UI rendered yet
}

/**
 * Example integration point (for reference):
 *
 * In DeskScreen, after layout:
 * ```
 * const [showIntro, setShowIntro] = useState(false);
 * const reveal = useDeskRevealAnimation();
 *
 * useEffect(() => {
 *   shouldShowIntro(enabledFlag).then(should => {
 *     if (should) {
 *       setShowIntro(true);
 *       reveal.startReveal();
 *       setIntroShownToday();
 *     }
 *   });
 * }, []);
 *
 * return (
 *   <>
 *     {showIntro && <DeskRevealShell enabled onComplete={() => setShowIntro(false)} />}
 *     <DeskContent />
 *   </>
 * );
 * ```
 */

// Silent import of React for the comments above
import React from 'react';
