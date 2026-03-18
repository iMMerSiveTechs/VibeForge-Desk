import type { ItemKind } from '../../constants';
import { extractLikelyJson } from './sanitize';
import { safeParseAndValidateLlmJson } from './validate';
import type { LlmExtract } from './schema';

export type { LlmExtract };

/**
 * Full pipeline: sanitize raw model output -> parse -> validate.
 * Never crashes. Returns null on failure so the caller can fall back gracefully.
 */
export function parseLlmExtract(
  rawModelOutput: string,
  fallbackKind: ItemKind,
): LlmExtract | null {
  const sanitized = extractLikelyJson(rawModelOutput);
  return safeParseAndValidateLlmJson(sanitized, fallbackKind);
}
