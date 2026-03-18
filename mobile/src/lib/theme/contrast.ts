/**
 * Lightweight WCAG contrast helpers — no dependencies, pure math.
 * Used to ensure theme surfaces never blend into the desk background.
 */

/** Parse a 6-digit hex string → [r, g, b] in 0–1 range */
function hexToLinear(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return [toLinear(r), toLinear(g), toLinear(b)];
}

/** Relative luminance per WCAG 2.1 */
export function relativeLuminance(hex: string): number {
  try {
    const [r, g, b] = hexToLinear(hex);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  } catch {
    return 0;
  }
}

/** Contrast ratio between two hex colors (1–21) */
export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Lighten or darken a hex color by a percentage (-1 to +1).
 * Positive = lighter, negative = darker.
 */
export function adjustLightness(hex: string, amount: number): string {
  try {
    const h = hex.replace('#', '');
    let r = parseInt(h.slice(0, 2), 16);
    let g = parseInt(h.slice(2, 4), 16);
    let b = parseInt(h.slice(4, 6), 16);
    const factor = amount > 0 ? 255 : 0;
    const abs = Math.abs(amount);
    r = Math.round(r + (factor - r) * abs);
    g = Math.round(g + (factor - g) * abs);
    b = Math.round(b + (factor - b) * abs);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  } catch {
    return hex;
  }
}

/**
 * Ensure deskHl (card surface) has at least minRatio contrast vs desk background.
 * Returns a corrected deskHl string if needed, otherwise returns the original.
 */
export function ensureSurfaceContrast(
  deskBg: string,
  surface: string,
  minRatio: number = 1.3,
): string {
  const ratio = contrastRatio(deskBg, surface);
  if (ratio >= minRatio) return surface;

  // Try to push surface lighter or darker to hit the target
  const bgLum = relativeLuminance(deskBg);
  // For dark desks: lighten surface; for light desks: darken surface
  const direction = bgLum < 0.18 ? 0.15 : -0.15;
  let candidate = adjustLightness(surface, direction);
  // If still not enough, push harder
  if (contrastRatio(deskBg, candidate) < minRatio) {
    candidate = adjustLightness(surface, direction * 2.5);
  }
  return candidate;
}

/**
 * Ensure text has sufficient contrast against its background.
 * Returns corrected text color if needed.
 */
export function ensureTextContrast(
  bg: string,
  text: string,
  minRatio: number = 4.0,
): string {
  const ratio = contrastRatio(bg, text);
  if (ratio >= minRatio) return text;
  const bgLum = relativeLuminance(bg);
  // For dark bg: make text lighter; for light bg: make text darker
  const direction = bgLum < 0.18 ? 0.6 : -0.6;
  return adjustLightness(text, direction);
}

/**
 * Returns '#000000' or '#FFFFFF' — whichever has higher contrast against bgColor.
 * Use this wherever text or an icon sits directly on a colored accent background.
 * Accepts 6-digit hex strings (e.g. '#2ECC71').
 */
export function getReadableTextColor(bgColor: string): '#000000' | '#FFFFFF' {
  const lum = relativeLuminance(bgColor);
  // White on dark, black on light — standard WCAG threshold
  return lum < 0.179 ? '#FFFFFF' : '#000000';
}

/**
 * Full theme safety pass — enforces surface/background separation,
 * text contrast, and border visibility across all theme color roles.
 *
 * Non-destructive: only adjusts surface, surface2(deskHl), border,
 * textOnDesk, muted — never changes brand/accent identity colors.
 */
export function applyThemeSafetyPass(colors: import('./themes').ThemeColors): import('./themes').ThemeColors {
  let result = { ...colors };

  // 1. Surface separation: deskHl (card surface) vs desk (background)
  //    Require contrast ratio of at least 1.35
  const deskHl = ensureSurfaceContrast(result.desk, result.deskHl, 1.35);
  if (deskHl !== result.deskHl) result = { ...result, deskHl };

  // 2. plannerPaper vs desk — journal/note cards must be distinct
  const plannerPaper = ensureSurfaceContrast(result.desk, result.plannerPaper, 1.4);
  if (plannerPaper !== result.plannerPaper) result = { ...result, plannerPaper };

  // 3. textOnDesk must be readable on desk background (min 3.5:1)
  const textOnDesk = ensureTextContrast(result.desk, result.textOnDesk, 3.5);
  if (textOnDesk !== result.textOnDesk) result = { ...result, textOnDesk };

  // 4. ink must be readable on plannerPaper (min 4.0:1)
  const ink = ensureTextContrast(result.plannerPaper, result.ink, 4.0);
  if (ink !== result.ink) result = { ...result, ink };

  // 5. muted text must have at least 2.0:1 contrast on deskHl
  const muted = ensureTextContrast(result.deskHl, result.muted, 2.0);
  if (muted !== result.muted) result = { ...result, muted };

  // 6. Border visibility: border must have at least 1.15:1 on deskHl surface
  //    (borders are hairlines, low requirement, but must be non-invisible)
  //    For rgba borders, skip (they handle their own opacity)
  if (!result.border.startsWith('rgba')) {
    const border = ensureSurfaceContrast(result.deskHl, result.border, 1.15);
    if (border !== result.border) result = { ...result, border };
  }

  return result;
}
