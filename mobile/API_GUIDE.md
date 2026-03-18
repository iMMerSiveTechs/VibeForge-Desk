/**
 * VibeForge Desk - Complete API & Integration Guide
 *
 * This document covers all APIs, services, and integration points.
 */

// =============================================================================
// GOOGLE CLOUD VISION OCR
// =============================================================================

/**
 * SERVICE: ocrGoogleVision.ts
 *
 * Converts images to text using Google Cloud Vision API
 */

// SETUP:
// 1. Create Google Cloud project
// 2. Enable Cloud Vision API
// 3. Create API key (restricted to Vision API)
// 4. Set EXPO_PUBLIC_GOOGLE_VISION_KEY environment variable

// USAGE:
// import { extractTextFromImage } from '@/lib/services/ocrGoogleVision';
//
// const base64Image = await getBase64FromUri(uri);
// const result = await extractTextFromImage(base64Image);
// if (result.ok) {
//   console.log('OCR Text:', result.text);
//   console.log('Confidence:', result.confidence);
// } else {
//   console.error('OCR Error:', result.error);
// }

// API ENDPOINT:
// POST https://vision.googleapis.com/v1/images:annotate?key={API_KEY}

// REQUEST:
// {
//   "requests": [{
//     "image": {
//       "content": "BASE64_ENCODED_IMAGE"
//     },
//     "features": [{
//       "type": "DOCUMENT_TEXT_DETECTION"
//     }],
//     "imageContext": {
//       "languageHints": ["en"]
//     }
//   }]
// }

// RESPONSE:
// {
//   "responses": [{
//     "fullTextAnnotation": {
//       "text": "...",
//       "confidence": 0.95,
//       "pages": [...]
//     }
//   }]
// }

// =============================================================================
// AI ENHANCE SERVICE
// =============================================================================

/**
 * SERVICE: aiEnhance.ts
 *
 * Structures raw OCR text using an AI model
 * CRITICAL: Uses JSON sanitizer + validator for safety
 */

// SETUP (OPTIONAL):
// 1. Create an API endpoint that accepts:
//    POST {
//      "text": "raw ocr text",
//      "preferredKind": "plan" | "task" | "note" | etc
//    }
// 2. Endpoint should return JSON matching LlmExtract schema
// 3. Set EXPO_PUBLIC_AI_ENHANCE_URL environment variable

// USAGE:
// import { enhanceWithAi } from '@/lib/services/aiEnhance';
//
// const result = await enhanceWithAi(ocrText, 'plan');
// if (result.ok && result.extract) {
//   console.log('Enhanced:', result.extract);
//   // Safe to use - already validated through sanitizer
//   createItem(result.extract.kind, result.extract);
// } else {
//   console.error('AI Error:', result.error);
//   // Fallback to raw OCR text
// }

// EXPECTED RESPONSE FORMAT (LlmExtract):
// {
//   "kind": "plan",
//   "title": "...",
//   "body": "...",
//   "tags": ["tag1", "tag2"],
//   "taskData": {
//     "date": "2025-02-18",
//     "tasks": [
//       { "text": "Do thing", "done": false }
//     ],
//     "important": "...",
//     "tomorrow": "...",
//     "gratitude": "...",
//     "notes": "..."
//   }
// }

// QUOTAS:
// - Free tier: 10/month
// - Pro: unlimited
// - Check with canMakeAiCall() before calling

// =============================================================================
// JSON SANITIZER + VALIDATOR PIPELINE
// =============================================================================

/**
 * SERVICES: json/sanitize.ts, json/validate.ts, json/schema.ts, json/index.ts
 *
 * CRITICAL: All AI outputs must pass through this pipeline
 */

// STEP 1: SANITIZE (extractLikelyJson)
// import { extractLikelyJson } from '@/lib/services/json/sanitize';
//
// const rawText = `
//   Here's the JSON:
//   \`\`\`json
//   { "kind": "plan", "title": "..." }
//   \`\`\`
// `;
// const jsonStr = extractLikelyJson(rawText);
// // Returns: '{ "kind": "plan", "title": "..." }'

// STEP 2: VALIDATE (safeParseAndValidateLlmJson)
// import { safeParseAndValidateLlmJson } from '@/lib/services/json/validate';
//
// const extract = safeParseAndValidateLlmJson(jsonStr, 'plan');
// // Returns: LlmExtract | null
// // Ensures all required fields exist and have correct types

// STEP 3: FULL PIPELINE (parseLlmExtract)
// import { parseLlmExtract } from '@/lib/services/json';
//
// const extract = parseLlmExtract(rawModelOutput, 'plan');
// if (extract) {
//   // Safe to use
//   createItem(extract.kind, extract);
// } else {
//   // Fall back to raw OCR
// }

// SCHEMA VALIDATION:
// - kind: must be valid ItemKind
// - title: string (max 200 chars)
// - body: string
// - tags: array of strings (max 20)
// - taskData: optional, validated if present

// =============================================================================
// SCAN TO DESK PIPELINE
// =============================================================================

/**
 * SERVICE: scanToDesk.ts
 *
 * Complete pipeline: pick → preprocess → OCR → preview → create
 */

// ENTRY POINTS:
// 1. Desk home "Scan to Desk" button
// 2. Tool headers "Scan" button
// 3. Editors "Attach Photo" button

// USAGE:
// import { handleScanCapture } from '@/lib/services/scanToDesk';
//
// const result = await handleScanCapture('camera'); // or 'library'
// if (result.ok) {
//   console.log('Photos:', result.photos);
//   console.log('OCR Text:', result.ocrText);
//   console.log('Confidence:', result.confidence);
//   // Show preview modal and let user create item or enhance with AI
// } else {
//   console.error('Scan Error:', result.error);
// }

// PIPELINE STEPS:
// 1. Check quota (canMakeOcrCall)
// 2. Pick image (expo-image-picker camera/library)
// 3. Preprocess (expo-image-manipulator resize + compress)
// 4. OCR (Google Cloud Vision)
// 5. Return photos + text

// IMAGE PREPROCESSING:
// - Max edge: 1280px
// - Format: JPEG
// - Quality: 0.7 (70%)
// - Storage: FileSystem.documentDirectory + "vf_photos/"

// QUOTA:
// - Free tier: 200/month (unlimited with pro)
// - Incremented only on successful OCR

// =============================================================================
// PHOTO MANAGEMENT SERVICE
// =============================================================================

/**
 * SERVICE: photos.ts
 *
 * Manage photo attachments locally
 */

// API:
// - ensurePhotosFolder() → void
// - savePhotoLocally(uri, source) → VFPhoto | null
// - deletePhotoLocally(photo) → boolean
// - getPhotoStorageUsage() → number (bytes)
// - clearPhotoCache() → void

// USAGE:
// import { savePhotoLocally, getPhotoStorageUsage } from '@/lib/services/photos';
//
// const photo = await savePhotoLocally(uri, 'camera');
// if (photo) {
//   item.photos.push(photo);
//   upsertItem(item);
// }
//
// const usage = await getPhotoStorageUsage();
// console.log('Photos use:', (usage / 1024 / 1024).toFixed(2), 'MB');

// STORAGE LOCATION:
// FileSystem.documentDirectory + "vf_photos/"
// e.g., /data/data/com.example.app/files/vf_photos/

// =============================================================================
// EXPORT SERVICE
// =============================================================================

/**
 * SERVICE: export.ts
 *
 * Export items in multiple formats
 */

// API:
// - exportItemsAsJson(items) → ExportResult
// - exportItemsAsMarkdown(items) → ExportResult
// - exportItemsAsText(items) → ExportResult
// - importItemsFromJson(jsonString) → VFItem[]

// USAGE:
// import { exportItemsAsJson } from '@/lib/services/export';
// import * as Sharing from 'expo-sharing';
//
// const items = store.getItemsByKind('plan');
// const result = exportItemsAsJson(items);
//
// await Sharing.shareAsync('file://' + result.filename, {
//   mimeType: result.mimeType,
//   dialogTitle: 'Export Items',
// });

// OUTPUT FORMATS:
// - JSON: Full item objects with all metadata
// - Markdown: Human-readable with item details
// - Text: Plain text with key information

// =============================================================================
// JOURNAL SERVICE
// =============================================================================

/**
 * SERVICE: journal.ts
 *
 * Journal entry helpers
 */

// PROMPTS:
// const JOURNAL_PROMPTS = [
//   { key: 'wins', label: 'Wins', placeholder: 'What went well today?' },
//   { key: 'lessons', label: 'Lessons', placeholder: 'What did you learn?' },
//   { key: 'mood', label: 'Mood', placeholder: 'How do you feel right now?' },
//   { key: 'intent', label: 'Intent', placeholder: 'What do you want to focus on tomorrow?' },
//   { key: 'gratitude', label: 'Gratitude', placeholder: 'What are you grateful for?' },
// ]

// API:
// - parseJournalEntry(item) → JournalEntry
// - formatJournalEntry(entry) → string (for item.body)
// - groupJournalsByMonth(items) → Record<string, VFItem[]>
// - calculateStreak(items) → number

// USAGE:
// import { groupJournalsByMonth, calculateStreak } from '@/lib/services/journal';
//
// const byMonth = groupJournalsByMonth(store.getItemsByKind('journal'));
// const streak = calculateStreak(store.getItemsByKind('journal'));
// console.log('Streak:', streak, 'days');

// =============================================================================
// QUOTA MANAGER SERVICE
// =============================================================================

/**
 * SERVICE: quotaManager.ts
 *
 * Track monthly usage limits
 */

// LIMITS:
// - OCR: 200/month (free tier)
// - AI: 10/month (free tier)
// - Pro: unlimited

// API:
// - canMakeOcrCall() → boolean
// - incrementOcrCall() → void
// - canMakeAiCall() → boolean
// - incrementAiCall() → void
// - getRemainingQuotas() → { ocrRemaining, aiRemaining, pro }

// USAGE:
// import { canMakeOcrCall, getRemainingQuotas } from '@/lib/services/quotaManager';
//
// const allowed = await canMakeOcrCall();
// if (!allowed) {
//   Alert.alert('Quota Exceeded', 'Please try again next month');
//   return;
// }
//
// const quotas = await getRemainingQuotas();
// console.log('AI uses remaining this month:', quotas.aiRemaining);

// STORAGE:
// AsyncStorage key: '@vf_quota_tracker'
// Resets on calendar month boundary

// =============================================================================
// STORE API
// =============================================================================

/**
 * STATE: store.ts (Zustand)
 *
 * Central state management
 */

// ITEM MANAGEMENT:
// - upsertItem(item) → void
// - deleteItem(id) → void
// - getItemById(id) → VFItem | undefined
// - getItemsByKind(kind) → VFItem[]
// - searchItems(query) → VFItem[]
// - convertItem(id, toKind) → void

// PIN MANAGEMENT (Pinboard):
// - addPin(pin) → void
// - updatePin(id, updates) → void
// - removePin(id) → void

// GOAL MANAGEMENT:
// - setGoalStatus(goalId, status) → void
// - linkItemToGoal(goalId, itemId) → void
// - unlinkItemFromGoal(goalId, itemId) → void

// WORK SESSIONS:
// - addWorkSession(itemId, note?) → void

// THEME & DESIGN:
// - setTheme(themeId) → void
// - setColorPack(packId?) → void

// ACTIVITY:
// - logActivity(msg) → void

// USAGE:
// import useDeskStore from '@/lib/state/store';
//
// // In component:
// const items = useDeskStore((s) => s.getItemsByKind('plan'));
// const upsertItem = useDeskStore((s) => s.upsertItem);

// PERSISTENCE:
// Automatically saved to AsyncStorage
// Key: 'vf-desk-storage'

// =============================================================================
// THEME SYSTEM
// =============================================================================

/**
 * SERVICES: theme/tokens.ts, theme/themes.ts, ThemeContext.tsx
 *
 * 18 themes with data-driven tokens
 */

// TOKENS PER THEME:
// - desk: Main background
// - surface: Card/container
// - paper: Text input background
// - ink: Primary text
// - border: Dividers
// - accent: Action highlights
// - shadows: Shadow color

// USAGE:
// import { useTheme } from '@/lib/theme/ThemeContext';
//
// const theme = useTheme();
// const containerStyle = {
//   backgroundColor: theme.desk,
//   borderColor: theme.border,
// };

// ALL 18 THEMES:
// 1. stealth-founder (dark cyan)
// 2. marble-classic (light blue)
// 3. midnight-terminal (dark gray with blue)
// 4. warm-studio (warm beige)
// 5. arctic-minimal (light blue)
// 6. noir-brass (dark with gold)
// 7. neon-nightshift (dark with neon)
// 8. sandstone-paper (warm sand)
// 9. forest-ledger (dark green)
// 10. violet-ink (dark purple)
// 11. leather-executive (warm brown)
// 12. blueprint-engineer (blue engineering)
// 13. ash-ember (warm gray orange)
// 14. ocean-quartz (cool blue)
// 15. mono-graphite (true grayscale)
// 16. cherry-blossom-office (light pink)
// 17. copper-circuit (warm copper)
// 18. alpine-slate (cool blue-gray)

// =============================================================================
// DESIGN PACKS
// =============================================================================

/**
 * SERVICE: theme/designPacks.ts
 *
 * 8 design packs that modify UI appearance
 */

// 8 PACKS:
// 1. metallic (reflective, strong shadows)
// 2. neon (vibrant, glowing)
// 3. flat (minimal, no shadows)
// 4. pastel (soft, subtle textures)
// 5. vintage-typewriter (retro, serif)
// 6. blueprint-grid (technical, grid)
// 7. minimal-ink (pure B&W, fine lines)
// 8. high-contrast (accessibility, high contrast)

// MODIFIERS:
// - accentColor: Accent color override
// - paperTexture: smooth, linen, kraft, glass
// - ruleStyle: steno, ruled, dotgrid, blueprint, minimal
// - cardShadow: flat, lifted, cinematic
// - iconSetKey: vintage, engineering, playful, modern, minimal, natural, bold

// USAGE:
// const pack = designPacks['metallic'];
// // Apply to all tools or specific tool via store.setColorPack()

// =============================================================================
// ENVIRONMENT VARIABLES
// =============================================================================

// REQUIRED:
// EXPO_PUBLIC_GOOGLE_VISION_KEY
//   - Google Cloud Vision API key
//   - Enable Cloud Vision API in Google Cloud Console
//   - Restrict to Vision API only

// OPTIONAL:
// EXPO_PUBLIC_AI_ENHANCE_URL
//   - Your AI enhancement endpoint
//   - If not set, AI enhance is disabled

// EXPO_PUBLIC_BACKEND_URL
//   - Backend API URL (if using backend)
//   - For future integration

// =============================================================================
// ERROR HANDLING
// =============================================================================

// ALL SERVICES ARE FAIL-SAFE:
// - Never crashes the app
// - Returns error in result object
// - User can fall back to manual input
// - Quota errors are user-friendly

// EXAMPLE ERROR HANDLING:
// const result = await enhanceWithAi(text, 'plan');
// if (!result.ok) {
//   // Show fallback UI
//   setRawText(text);
//   showAlert(result.error);
// }

// =============================================================================
// TESTING CHECKLIST
// =============================================================================

export const TESTING_CHECKLIST = [
  '[ ] Create items in all 8 tool types',
  '[ ] Upload photos from camera and library',
  '[ ] View photos in PhotoViewerModal',
  '[ ] Test scan with Google Cloud Vision',
  '[ ] Test AI enhance (if endpoint configured)',
  '[ ] Export items as JSON/Markdown/TXT',
  '[ ] Create and manage goals',
  '[ ] Create journal entries with prompts',
  '[ ] Check journal streak counter',
  '[ ] Switch between all 18 themes',
  '[ ] Apply all 8 design packs',
  '[ ] Test pinboard drag & drop',
  '[ ] Global search functionality',
  '[ ] Archive/unarchive items',
  '[ ] Tag items and filter by tags',
  '[ ] Log work sessions',
  '[ ] Check quota status',
  '[ ] Test vault export/import',
  '[ ] Clear photos cache',
  '[ ] Convert items between types',
];

export const IMPLEMENTATION_COMPLETE = true;
