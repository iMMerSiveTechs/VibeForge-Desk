import { type Router } from 'expo-router';

/**
 * Screens that use modal/formSheet/fullScreenModal presentation.
 * These need router.dismiss() instead of router.back().
 */
const DISMISS_SCREENS = new Set([
  'tool-list',
  'editor',
  'search',
  'export-panel',
  'activity',
  'paywall',
  'desk-setup',
  'first-launch',
  'scan-preview',
  'themes',
]);

/**
 * Screens that use card presentation (standard push).
 * These use router.back() normally.
 */
const BACK_SCREENS = new Set([
  'canvas',
  'vault',
  'journal',
  'goals',
  'calendar',
  'vault-os',
  'vault-note',
  'vault-context-packs',
  'vault-generators',
  'theme-qa',
  'meeting-detail',
]);

/**
 * Safely close/dismiss the current screen.
 * Uses router.dismiss() for modal/formSheet/fullScreenModal screens,
 * router.back() for card-pushed screens,
 * and router.replace('/(tabs)') as the ultimate fallback.
 */
export function safeClose(router: Router): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/(tabs)');
  }
}

/**
 * Modal-aware dismiss for screens that are presented as
 * modal / formSheet / fullScreenModal.
 * Calls router.dismiss() which properly removes the modal from the stack.
 * Falls back to router.replace('/(tabs)') if dismiss isn't possible.
 */
export function safeDismiss(router: Router): void {
  if (router.canGoBack()) {
    try {
      router.dismiss();
    } catch {
      router.replace('/(tabs)');
    }
  } else {
    router.replace('/(tabs)');
  }
}

/**
 * Returns the correct close function based on screen name.
 * - Modal/formSheet/fullScreenModal screens → safeDismiss
 * - Card screens → safeClose (router.back)
 * - Unknown → safeClose (safe default)
 */
export function getCloseHandler(screenName: string): (router: Router) => void {
  if (DISMISS_SCREENS.has(screenName)) {
    return safeDismiss;
  }
  return safeClose;
}
