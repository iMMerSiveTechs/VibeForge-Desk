/**
 * Extracts likely JSON from raw LLM output that may contain markdown fences,
 * preamble text, or trailing garbage.
 */
export function extractLikelyJson(raw: string): string {
  // Strip markdown code fences
  let cleaned = raw.trim();

  // Try to extract from ```json ... ``` blocks
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch?.[1]) {
    cleaned = fenceMatch[1].trim();
  }

  // Find the first { or [ and the last } or ]
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');

  let start = -1;
  let endChar = '';

  if (firstBrace === -1 && firstBracket === -1) {
    return cleaned; // No JSON structure found, return as-is
  }

  if (firstBrace === -1) {
    start = firstBracket;
    endChar = ']';
  } else if (firstBracket === -1) {
    start = firstBrace;
    endChar = '}';
  } else {
    start = Math.min(firstBrace, firstBracket);
    endChar = start === firstBrace ? '}' : ']';
  }

  const lastEnd = cleaned.lastIndexOf(endChar);
  if (lastEnd > start) {
    cleaned = cleaned.slice(start, lastEnd + 1);
  } else {
    cleaned = cleaned.slice(start);
  }

  return cleaned;
}
