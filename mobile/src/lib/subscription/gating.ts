// All gating driven by isPro boolean. No scattered if(isPro) elsewhere.

export const FREE_THEME_IDS = ['stealth', 'marble', 'midnight', 'warm', 'arctic', 'noir'];
export const FREE_PACK_IDS = ['metallic', 'neon'];
export const FREE_TEMPLATE_CATEGORIES = ['Daily', 'Weekly', 'Personal'];

export function canUseTheme(themeId: string, isPro: boolean): boolean {
  return isPro || FREE_THEME_IDS.includes(themeId);
}

export function canUseDesignPack(packId: string | undefined, isPro: boolean): boolean {
  if (!packId) return true; // "No pack" always free
  return isPro || FREE_PACK_IDS.includes(packId);
}

export function canUseTemplate(templateCategory: string, isPro: boolean): boolean {
  return isPro || FREE_TEMPLATE_CATEGORIES.includes(templateCategory);
}

export function canUseVaultFeature(featureKey: 'context_packs' | 'generators', isPro: boolean): boolean {
  return isPro;
}

export function canUseCalendarFeature(featureKey: 'bulk_add', isPro: boolean): boolean {
  return isPro;
}

export function canUseCommandBar(isPro: boolean): boolean {
  return isPro;
}

export function canUseQuickShelf(isPro: boolean): boolean {
  return isPro;
}

// ---------------------------------------------------------------------------
// Enforcement helpers
// ---------------------------------------------------------------------------

const FEATURE_LABELS: Record<string, string> = {
  theme: 'this theme',
  pack: 'this design pack',
  template: 'this template category',
  context_packs: 'Context Packs',
  generators: 'Generators',
  bulk_add: 'Bulk Add',
  command_bar: 'the Command Bar',
  quick_shelf: 'Quick Shelf',
};

/**
 * Returns true if the feature is accessible (i.e. the user is Pro or the
 * feature is free-tier). Returns false if blocked.
 */
export function requirePro(feature: string, isPro: boolean): boolean {
  if (isPro) return true;

  // Check against known free-tier lists
  if (FREE_THEME_IDS.includes(feature)) return true;
  if (FREE_PACK_IDS.includes(feature)) return true;
  if (FREE_TEMPLATE_CATEGORIES.includes(feature)) return true;

  return false;
}

/**
 * Returns a user-friendly message explaining why a feature is locked.
 */
export function getLockedMessage(feature: string): string {
  const label = FEATURE_LABELS[feature] ?? feature;
  return `Upgrade to Pro to unlock ${label}. Pro gives you access to every theme, pack, template, and power feature.`;
}
