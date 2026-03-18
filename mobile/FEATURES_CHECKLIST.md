/**
 * VibeForge Desk - Feature Validation Checklist
 *
 * This file documents all implemented features and their locations
 */

// =============================================================================
// REQUIREMENT 1: Hard-Separate Vault and Journal
// =============================================================================

// ✓ VAULT (HARD SEPARATION)
// Location: /src/app/vault.tsx
// Features:
//   - Export/Import JSON/Markdown/TXT (/src/lib/services/export.ts)
//   - Snapshots + Restore (implemented via archived items + JSON import)
//   - Storage Health (getPhotoStorageUsage in /src/lib/services/photos.ts)
//   - Privacy Controls:
//     * Clear data (deleteItem in store)
//     * Clear photos cache (clearPhotoCache in /src/lib/services/photos.ts)
//     * Reset quotas (in AsyncStorage)
// UI: Tabs for archived items, exports, storage, privacy

// ✓ JOURNAL (HARD SEPARATION)
// Location: /src/app/journal.tsx
// Features:
//   - New Entry (Today) button
//   - Optional Prompts: Wins, Lessons, Mood, Intent, Gratitude
//   - Today View (separate from timeline)
//   - Timeline (groupJournalsByMonth in /src/lib/services/journal.ts)
//   - Calendar/Streak (calculateStreak in /src/lib/services/journal.ts)
//   - "Convert to Desk Note" (convertItem in store)
// UI: Completely different from Vault - no risk of cloning

// =============================================================================
// REQUIREMENT 2: Expand to Exactly 8 Desk Tools
// =============================================================================

// 1. Master Plan (Stack)
//    Location: /src/app/(tabs)/index.tsx as stack card
//    Features: Work Sessions (store.addWorkSession)
//    Kind: 'plan'

// 2. Task Planner (Stack)
//    Location: /src/app/(tabs)/index.tsx as stack card
//    Kind: 'task'
//    Features: Task rows, important, tomorrow, gratitude, notes

// 3. Stickies (Stack)
//    Location: /src/app/(tabs)/index.tsx as stack card
//    Kind: 'sticky'
//    Features: Color options (yellow/green via stickyMeta)

// 4. Steno Notebook (Stack)
//    Location: /src/app/(tabs)/index.tsx as stack card
//    Kind: 'note'

// 5. Pinboard (Tool)
//    Location: /src/app/pinboard.tsx
//    Features: Drag pins, edit items
//    Data: PinboardData with pins array (x, y, w, h, z)

// 6. Vault (Tool)
//    Location: /src/app/vault.tsx
//    Features: See HARD-SEPARATE VAULT above

// 7. Journal (Tool)
//    Location: /src/app/journal.tsx
//    Features: See HARD-SEPARATE JOURNAL above

// 8. Goals (Tool)
//    Location: /src/app/goals.tsx
//    Features: Status (active/paused/done), linked items, notes
//    Data: goalMeta with status and linkedItemIds

// All 8 tools accessible from home screen

// =============================================================================
// REQUIREMENT 3: Implement 18 Themes
// =============================================================================

// Location: /src/lib/theme/tokens.ts
// All 18 themes defined with complete tokens: desk, surface, paper, ink, border, accent, shadows

// Original 10:
//   1. stealth-founder
//   2. marble-classic
//   3. midnight-terminal
//   4. warm-studio
//   5. arctic-minimal
//   6. noir-brass
//   7. neon-nightshift
//   8. sandstone-paper
//   9. forest-ledger
//  10. violet-ink

// NEW 8:
//  11. leather-executive
//  12. blueprint-engineer
//  13. ash-ember
//  14. ocean-quartz
//  15. mono-graphite
//  16. cherry-blossom-office
//  17. copper-circuit
//  18. alpine-slate

// Applied via:
//   - ThemeProvider (/src/lib/theme/ThemeContext.tsx)
//   - Studio screen (/src/app/studio.tsx)
//   - Store.setTheme (state management)

// =============================================================================
// REQUIREMENT 4: Implement 8 Design Packs
// =============================================================================

// Location: /src/lib/theme/designPacks.ts
// All 8 packs defined with modifiers for:
//   - accentColor
//   - paperTexture
//   - ruleStyle
//   - cardShadow
//   - iconSetKey

// 1. metallic - Shiny, reflective surfaces with strong shadows
// 2. neon - Vibrant, glowing accents with high contrast
// 3. flat - Minimal, no shadows, pure colors
// 4. pastel - Soft, muted colors with subtle textures
// 5. vintage-typewriter - Retro feel with serif fonts and paper texture
// 6. blueprint-grid - Technical grid overlay with engineering aesthetic
// 7. minimal-ink - Pure black and white with fine lines
// 8. high-contrast - Accessibility-focused with maximum contrast

// Applied via:
//   - designPackResolver (/src/lib/services/designPackResolver.ts)
//   - Studio screen Design Packs tab (/src/app/studio.tsx)
//   - Per-tool override support via store.currentColorPack

// =============================================================================
// REQUIREMENT 5: Implement Smart Hybrid Scan
// =============================================================================

// Location: /src/lib/services/scanToDesk.ts (main pipeline)
// Entry points:
//   - Desk home "Scan to Desk" button
//   - Tool headers "Scan" button
//   - Editors "Attach Photo" button

// Pipeline:
//   1. Pick (expo-image-picker): camera + library with crop
//   2. Preprocess (expo-image-manipulator): resize to 1280px max, JPEG 0.7
//   3. Store (expo-file-system): FileSystem.documentDirectory + "vf_photos/"
//   4. OCR (Google Cloud Vision): DOCUMENT_TEXT_DETECTION
//   5. Preview Modal (/src/app/scan-preview.tsx):
//      - Thumbnails, detect kind, extracted fields
//      - "Create Item" button
//      - "Enhance with AI" button (if quota available)
//      - "Cancel" button
//   6. AI Enhance (aiEnhance.ts): Optional LLM structuring with sanitizer

// All implemented: handleScanCapture in scanToDesk.ts
// Quota checking: quotaManager.ts (canMakeOcrCall, canMakeAiCall)

// =============================================================================
// REQUIREMENT 6: Photo Attachments Everywhere
// =============================================================================

// Type: VFPhoto interface
//   {
//     id: string
//     uri: string
//     addedAt: string
//     source: 'camera' | 'library'
//     width?: number
//     height?: number
//   }

// Features implemented:
//   - ItemCard shows badge (/src/app/tool-list.tsx)
//   - PhotoStrip in editors (/src/app/editor.tsx)
//   - PhotoViewerModal with swipe close (/src/app/editor.tsx)
//   - Photo storage management (/src/lib/services/photos.ts)
//   - Automatic cleanup on item deletion

// VFItem.photos: VFPhoto[] (all items have photos array)

// =============================================================================
// REQUIREMENT 7: Pinboard (Freeform-like)
// =============================================================================

// Location: /src/app/pinboard.tsx
// Features:
//   - Canvas pins existing items (reference by itemId)
//   - Drag to reposition (Reanimated animations)
//   - Tap pin → edit (routes to editor)

// Data structure:
//   PinboardPin {
//     id: string
//     itemId: string
//     x: number
//     y: number
//     w: number
//     h: number
//     z: number
//   }

// State: pinboard: PinboardData { pins: PinboardPin[] }
// Actions: addPin, updatePin, removePin

// =============================================================================
// REQUIREMENT 8: Studio Screen
// =============================================================================

// Location: /src/app/studio.tsx
// Three tabs:

// 1. THEMES TAB
//    - Display all 18 themes (from tokens.ts)
//    - Data-driven token display
//    - "Apply" button sets store.currentTheme
//    - Preview with sample content

// 2. DESIGN PACKS TAB
//    - Display all 8 packs (from designPacks.ts)
//    - "Apply to All" button
//    - "Apply only to [tool]" dropdown selector
//    - Visual preview of pack effects

// 3. TEMPLATES TAB
//    - Browse ~38 templates (/src/lib/templates.ts)
//    - Tabs: Daily, Weekly, Project, Personal, Pro
//    - Search functionality
//    - Favorites and recents tracking
//    - "Use Template" button creates item from template

// =============================================================================
// REQUIREMENT 9: Search + Tags + Export
// =============================================================================

// GLOBAL SEARCH
// Location: /src/app/search.tsx
// Features:
//   - Search across: title, body, tags, AND taskData fields
//   - Implemented in store.searchItems()
//   - Results sorted by relevance
//   - Real-time as user types

// TAGS
// Location: /src/app/editor.tsx (TagEditor component)
// Features:
//   - Tag chips in editor
//   - Add tags via input field
//   - Remove tags by tapping chip
//   - Auto-complete from existing tags (optional enhancement)
//   - Stored in item.tags: string[]

// EXPORT/IMPORT
// Location: /src/lib/services/export.ts
// Formats:
//   - exportItemsAsJson() → JSON
//   - exportItemsAsMarkdown() → Markdown
//   - exportItemsAsText() → Plain text
//   - importItemsFromJson() → Parse JSON
// UI: /src/app/export-panel.tsx (formSheet)
// Features:
//   - Select items to export
//   - Choose format
//   - Share via expo-sharing

// =============================================================================
// REQUIREMENT 10: Work Sessions (Master Plan)
// =============================================================================

// Location: /src/app/editor.tsx (when editing 'plan' kind)
// Features:
//   - Show collapsible Work Sessions list (timestamps + note)
//   - "Log Work Session" button (manual, not auto)
//   - Each session: { ts: string, note?: string }
//   - Store method: addWorkSession(itemId, note)

// Data: workSessions?: WorkSession[] on VFItem

// =============================================================================
// REQUIREMENT 11: Goals Tool
// =============================================================================

// Location: /src/app/goals.tsx
// Features:
//   - Goals list with title, status, notes
//   - Status: active | paused | done
//   - Link to items (display linkedItemIds)
//   - "Create goal from item" action (convertItem to 'goal')

// Data: goalMeta?: GoalMeta { status, linkedItemIds }
// Store methods:
//   - setGoalStatus(goalId, status)
//   - linkItemToGoal(goalId, itemId)
//   - unlinkItemFromGoal(goalId, itemId)

// =============================================================================
// REQUIREMENT 12: JSON Sanitizer + Validator
// =============================================================================

// Location: /src/lib/services/json/
// Files:
//   - sanitize.ts: extractLikelyJson() - strips markdown, finds JSON structure
//   - validate.ts: safeParseAndValidateLlmJson() - validates against LlmExtract
//   - schema.ts: LlmExtract, LlmTaskData types
//   - index.ts: parseLlmExtract() - full pipeline

// Used by:
//   - aiEnhance.ts: MUST use parseLlmExtract for safety
//   - scan-preview.tsx: Validates AI responses before creating items
//   - Fallback: If validation fails, use raw OCR text

// =============================================================================
// REQUIREMENT 13: DeskRevealShell Foundation (Dormant)
// =============================================================================

// Location: /src/lib/services/deskReveal.ts
// Features:
//   - checkAndMarkIntroShown() - checks lastIntroDate in AsyncStorage
//   - resetIntroState() - for testing
//   - REVEAL_ANIMATION_CONFIG - phases:
//     * texturePhase: felt texture fade (0-500ms)
//     * cameraDropPhase: camera drop (500-1500ms)
//     * stackSettlePhase: stacks settle (1500-3500ms)
//   - Lottie JSON placeholder comment (no assets shipped)

// Future implementation:
//   - Enable with flag in store
//   - Use actual Lottie files when assets available
//   - Call checkAndMarkIntroShown on first app launch

// =============================================================================
// REQUIREMENT 14: Required File Structure
// =============================================================================

// ✓ /App.tsx - handled by Expo Router
// ✓ /src/theme/tokens.ts → /src/lib/theme/tokens.ts
// ✓ /src/theme/themes.ts → /src/lib/theme/themes.ts
// ✓ /src/theme/designPacks.ts → /src/lib/theme/designPacks.ts
// ✓ /src/theme/resolver.ts → /src/lib/theme/ThemeResolver.ts
// ✓ /src/theme/ThemeProvider.tsx → /src/lib/theme/ThemeContext.tsx
// ✓ /src/screens/* → /src/app/*
// ✓ /src/components/* → exists with modular components
// ✓ /src/services/* → /src/lib/services/*
// ✓ /src/utils/id.ts → built into store.ts (uid function)
// ✓ /src/utils/date.ts → built into store.ts (fmtDate, fmtDay, fmtCreatedAt)

// =============================================================================
// REQUIREMENT 15: Quotas
// =============================================================================

// Location: /src/lib/services/quotaManager.ts
// Features:
//   - ocrCallsThisMonth: unlimited (optional cap at 200)
//   - aiEnhancesThisMonth: 10/month free tier
//   - lastResetMonth: tracks monthly boundary
//   - Pro tier: unlimited for both

// API:
//   - canMakeOcrCall() → boolean
//   - incrementOcrCall() → void
//   - canMakeAiCall() → boolean
//   - incrementAiCall() → void
//   - getRemainingQuotas() → { ocrRemaining, aiRemaining, pro }

// Used by:
//   - scanToDesk.ts (before OCR)
//   - aiEnhance.ts (before AI enhancement)
//   - activity log shows quota usage

// =============================================================================
// COMPLETE FILE LISTING
// =============================================================================

export const COMPLETE_FILE_LIST = {
  'src/app/_layout.tsx': 'Root layout with Stack, QueryClient, ThemeProvider',
  'src/app/(tabs)/_layout.tsx': 'Tabs layout (Desk home)',
  'src/app/(tabs)/index.tsx': 'Desk home with 8 tool cards/stacks',
  'src/app/(tabs)/settings.tsx': 'App settings',
  'src/app/editor.tsx': 'Item editor (modal) with photos, tags, task data, work sessions',
  'src/app/search.tsx': 'Global search (modal)',
  'src/app/tool-list.tsx': 'Tool items list (card) for each kind',
  'src/app/pinboard.tsx': 'Pinboard canvas (card) with draggable pins',
  'src/app/studio.tsx': 'Studio: Themes, Design Packs, Templates (card)',
  'src/app/themes.tsx': 'Theme picker (formSheet)',
  'src/app/vault.tsx': 'Vault: Exports, Privacy, Storage (card)',
  'src/app/journal.tsx': 'Journal: Entries, Timeline, Streak (card)',
  'src/app/goals.tsx': 'Goals: List, Status, Links (card)',
  'src/app/scan-preview.tsx': 'Scan OCR preview (modal)',
  'src/app/activity.tsx': 'Activity log (formSheet)',
  'src/app/export-panel.tsx': 'Export/Import (formSheet)',
  'src/lib/theme/tokens.ts': '18 theme definitions with tokens',
  'src/lib/theme/designPacks.ts': '8 design pack definitions',
  'src/lib/theme/themes.ts': 'ThemeColors type + color helpers',
  'src/lib/theme/ThemeContext.tsx': 'Theme context provider',
  'src/lib/theme/ThemeResolver.ts': 'Theme resolver utility',
  'src/lib/state/store.ts': 'Zustand store (items, goals, pinboard, quotas)',
  'src/lib/services/photos.ts': 'Photo management (save, delete, cache)',
  'src/lib/services/ocrGoogleVision.ts': 'Google Cloud Vision OCR',
  'src/lib/services/aiEnhance.ts': 'AI enhance with sanitizer pipeline',
  'src/lib/services/export.ts': 'JSON/Markdown/TXT export',
  'src/lib/services/journal.ts': 'Journal helpers (prompts, streak, timeline)',
  'src/lib/services/quotaManager.ts': 'Monthly quotas (OCR, AI)',
  'src/lib/services/deskReveal.ts': 'Intro sequence foundation',
  'src/lib/services/scanToDesk.ts': 'Scan capture + preprocess pipeline',
  'src/lib/services/json/sanitize.ts': 'extractLikelyJson()',
  'src/lib/services/json/validate.ts': 'safeParseAndValidateLlmJson()',
  'src/lib/services/json/schema.ts': 'LlmExtract, LlmTaskData types',
  'src/lib/services/json/index.ts': 'parseLlmExtract() pipeline',
  'src/lib/constants.ts': 'ItemKind, KINDS definitions',
};

export const SETUP_COMPLETE = true;
