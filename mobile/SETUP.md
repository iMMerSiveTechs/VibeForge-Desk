/**
 * VibeForge Desk - Complete app setup guide
 *
 * IMPORTANT: This file contains setup instructions for API keys and environment variables
 */

// ENVIRONMENT VARIABLES (.env.local or Vibecode ENV tab):
// EXPO_PUBLIC_BACKEND_URL=https://api.yourdomain.com  (if using backend)
// EXPO_PUBLIC_GOOGLE_VISION_KEY=your_google_vision_api_key
// EXPO_PUBLIC_AI_ENHANCE_URL=https://your-ai-service.com/enhance (optional)

// FEATURES IMPLEMENTED:
// ✓ 8 Desk Tools (Master Plan, Task Planner, Stickies, Steno Notebook, Pinboard, Vault, Journal, Goals)
// ✓ Hard Vault/Journal separation (different UIs and workflows)
// ✓ 18 Themes (10 original + 8 new) with data-driven tokens
// ✓ 8 Design Packs (Metallic, Neon, Flat, Pastel, Vintage, Blueprint, Minimal Ink, High Contrast)
// ✓ Smart hybrid scan (camera + library, crop, OCR, preview modal)
// ✓ Photo attachments everywhere (ItemCard badge, PhotoStrip, PhotoViewerModal)
// ✓ Pinboard (Freeform-like canvas with draggable pins)
// ✓ Studio screen (Themes, Design Packs, Templates)
// ✓ Search + Tags + Export (JSON/Markdown/TXT)
// ✓ Work Sessions (Master Plan)
// ✓ Goals tool (status, linked items)
// ✓ JSON sanitizer + validator (safe LLM parsing)
// ✓ DeskRevealShell foundation (intro sequence placeholder)
// ✓ Quotas (OCR unlimited, AI Enhance 10/month free)

// FOLDER STRUCTURE:
// src/
//   app/                              # Routes (Expo Router)
//     _layout.tsx                     # Root layout (Stack)
//     (tabs)/                         # Tab routes
//       _layout.tsx
//       index.tsx                     # Desk home
//       settings.tsx
//     editor.tsx                      # Item editor (modal)
//     search.tsx                      # Global search (modal)
//     tool-list.tsx                   # Tool picker (card)
//     pinboard.tsx                    # Pinboard (card)
//     studio.tsx                      # Studio: Themes, Packs, Templates (card)
//     themes.tsx                      # Theme picker (formSheet)
//     vault.tsx                       # Vault: Exports, Privacy, Storage (card)
//     journal.tsx                     # Journal: Entries, Timeline, Streak (card)
//     goals.tsx                       # Goals: List, Status, Links (card)
//     scan-preview.tsx                # Scan OCR preview (modal)
//     activity.tsx                    # Activity log (formSheet)
//     export-panel.tsx                # Export/Import (formSheet)
//
//   components/
//     Themed.tsx                      # Themed container
//     (more components as needed)
//
//   lib/
//     theme/
//       tokens.ts                     # 18 theme token definitions
//       designPacks.ts                # 8 design pack definitions
//       themes.ts                     # ThemeColors type + color helpers
//       ThemeContext.tsx              # Theme context provider
//       ThemeResolver.ts              # Theme resolver utility
//     state/
//       store.ts                      # Zustand store (items, goals, pinboard, etc)
//     services/
//       photos.ts                     # Photo management (save, delete, cache)
//       ocrGoogleVision.ts            # Google Cloud Vision OCR
//       aiEnhance.ts                  # AI enhance pipeline with quotas
//       export.ts                     # JSON/Markdown/TXT export
//       journal.ts                    # Journal helpers (prompts, parsing, streak)
//       quotaManager.ts               # Monthly quotas (OCR, AI)
//       deskReveal.ts                 # Intro sequence foundation
//       scanToDesk.ts                 # Scan capture + preprocess pipeline
//       json/
//         sanitize.ts                 # extractLikelyJson()
//         validate.ts                 # safeParseAndValidateLlmJson()
//         schema.ts                   # LlmExtract, LlmTaskData types
//         index.ts                    # parseLlmExtract() pipeline
//     constants.ts                    # ItemKind, KINDS definitions
//
// SETUP INSTRUCTIONS:

// 1. Set environment variables in Vibecode ENV tab:
//    EXPO_PUBLIC_GOOGLE_VISION_KEY=<your Google Cloud Vision API key>
//    Optional: EXPO_PUBLIC_AI_ENHANCE_URL=<your AI endpoint>

// 2. Test Google Cloud Vision:
//    curl -X POST https://vision.googleapis.com/v1/images:annotate?key=YOUR_KEY \
//      -H "Content-Type: application/json" \
//      -d '{
//        "requests":[{
//          "image":{"content":"<base64-image>"},
//          "features":[{"type":"DOCUMENT_TEXT_DETECTION"}]
//        }]
//      }'

// 3. For AI Enhance, set EXPO_PUBLIC_AI_ENHANCE_URL to your endpoint:
//    POST /enhance
//    Request: { text: string, preferredKind: ItemKind }
//    Response: JSON matching LlmExtract schema

// 4. Start the app:
//    cd mobile && npm start (or bun start)

// APP STRUCTURE:
// - Home (Desk): Shows all 8 tools as stacks/buttons
// - Tool Screens: List items for each kind
// - Editor: Create/edit items with photos, tags, task data, work sessions
// - Scan: Camera + library picker → preprocess → OCR → preview → create item
// - Studio: Theme picker, design pack picker, templates browser
// - Vault: Archived items, exports, privacy controls, storage health
// - Journal: Daily entries with prompts, timeline view, streak counter
// - Goals: Goal management with status and linked items
// - Search: Global search across all items

export const APP_VERSION = '1.0.0';
export const BUILD_DATE = new Date().toISOString();
