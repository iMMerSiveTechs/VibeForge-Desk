import type { ItemKind } from '../constants';
import { canMakeAiCall, incrementAiCall } from './quotaManager';
import { parseLlmExtract } from './json';
import type { LlmExtract } from './json';

export interface AiEnhanceResult {
  ok: boolean;
  extract?: LlmExtract;
  error?: string;
}

/**
 * AI Enhance: takes raw OCR text and structures it into a clean desk item.
 * This is a STUB — replace the fetch URL with your actual AI endpoint.
 * Uses the JSON sanitizer pipeline to safely parse AI output.
 */
export async function enhanceWithAi(
  rawText: string,
  preferredKind: ItemKind,
): Promise<AiEnhanceResult> {
  const allowed = await canMakeAiCall();
  if (!allowed) {
    return {
      ok: false,
      error: 'Monthly AI enhance quota reached. Try again next month.',
    };
  }

  try {
    // STUB: Replace this URL with your actual AI endpoint
    // The endpoint should accept { text, preferredKind } and return JSON matching LlmExtract schema
    const AI_ENDPOINT = process.env.EXPO_PUBLIC_AI_ENHANCE_URL ?? '';

    if (!AI_ENDPOINT) {
      return {
        ok: false,
        error: 'AI enhance endpoint not configured. Set EXPO_PUBLIC_AI_ENHANCE_URL.',
      };
    }

    const response = await fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: rawText, preferredKind }),
    });

    if (!response.ok) {
      return { ok: false, error: 'AI service returned an error.' };
    }

    const rawOutput = await response.text();

    // CRITICAL: Never trust raw AI output. Always sanitize + validate.
    const extract = parseLlmExtract(rawOutput, preferredKind);

    if (!extract) {
      return { ok: false, error: 'AI returned invalid data. Using raw text instead.' };
    }

    await incrementAiCall();
    return { ok: true, extract };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Network error during AI enhance';
    return { ok: false, error: msg };
  }
}
