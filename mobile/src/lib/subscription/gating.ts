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
