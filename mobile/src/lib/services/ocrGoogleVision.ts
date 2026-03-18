// Google Cloud Vision OCR Service
// API key should be set via environment variable EXPO_PUBLIC_GOOGLE_VISION_KEY
// or hardcoded here during development

const GOOGLE_VISION_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_VISION_KEY ?? '';
const VISION_ENDPOINT = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`;

export interface OcrResult {
  ok: boolean;
  text?: string;
  confidence?: number;
  error?: string;
}

function cleanBase64(base64String: string): string {
  return base64String.replace(/^data:image\/[a-z]+;base64,/, '');
}

export async function extractTextFromImage(base64Image: string): Promise<OcrResult> {
  if (!GOOGLE_VISION_API_KEY) {
    return { ok: false, error: 'Google Vision API key not configured. Set EXPO_PUBLIC_GOOGLE_VISION_KEY in your environment.' };
  }

  try {
    const rawBase64 = cleanBase64(base64Image);

    const payload = {
      requests: [
        {
          image: { content: rawBase64 },
          features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
          imageContext: { languageHints: ['en'] },
        },
      ],
    };

    const response = await fetch(VISION_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return { ok: false, error: data?.error?.message ?? 'Google Vision API error' };
    }

    const annotation = data?.responses?.[0]?.fullTextAnnotation;
    const extractedText = annotation?.text ?? '';

    if (!extractedText) {
      return { ok: false, error: 'No text detected in the image.' };
    }

    // Confidence from first page if available
    const confidence = annotation?.pages?.[0]?.confidence;

    return { ok: true, text: extractedText, confidence };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Network error during OCR';
    return { ok: false, error: msg };
  }
}
