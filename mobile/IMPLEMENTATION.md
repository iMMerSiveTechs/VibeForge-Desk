# VibeForge Desk - Complete Implementation

A comprehensive productivity app with 8 tools, 18 themes, smart scanning, and AI enhancement.

## Features

### 8 Desk Tools (Exactly as Specified)
1. **Master Plan** (Stack) - Strategic planning with work sessions
2. **Task Planner** (Stack) - Daily tasks with status tracking
3. **Stickies** (Stack) - Quick capture with color options
4. **Steno Notebook** (Stack) - Refined note-taking
5. **Pinboard** (Tool) - Freeform canvas with draggable pins
6. **Vault** (Tool) - Export/Import, Snapshots, Storage Health, Privacy Controls
7. **Journal** (Tool) - Daily entries, Prompts, Timeline, Streak Counter
8. **Goals** (Tool) - Goal tracking with status and linked items

### Vault & Journal - Hard Separation
- **Vault**: Archive management, export/import JSON/Markdown/TXT, snapshots + restore, storage health, privacy controls (clear data, photos cache, reset quotas)
- **Journal**: New entry (today), optional prompts (Wins/Lessons/Mood/Intent/Gratitude), today view, timeline, calendar/streak, "Convert to Desk Note" action
- Completely different UIs and workflows - no accidental cloning

### 18 Themes (Data-Driven Tokens)
Each theme provides: desk, surface, paper, ink, border, accent, shadows

**Original 10:**
- Stealth Founder, Marble Classic, Midnight Terminal, Warm Studio, Arctic Minimal
- Noir Brass, Neon Nightshift, Sandstone Paper, Forest Ledger, Violet Ink

**NEW 8:**
- Leather Executive, Blueprint Engineer, Ash & Ember, Ocean Quartz
- Mono Graphite, Cherry Blossom Office, Copper Circuit, Alpine Slate

### 8 Design Packs
Apply globally or per-tool (tool overrides). Modify: accent channel, paper texture, rule style, shadow style, icon family.
- Metallic, Neon, Flat, Pastel, Vintage Typewriter, Blueprint Grid, Minimal Ink, High Contrast

### Smart Hybrid Scan
- Entry points: Desk home "Scan to Desk", tool headers "Scan", editors "Attach Photo"
- Pick: expo-image-picker camera + library with crop
- Preprocess: expo-image-manipulator resize to max 1280px, JPEG 0.7
- Store: FileSystem.documentDirectory + "vf_photos/"
- OCR: Google Cloud Vision (DOCUMENT_TEXT_DETECTION)
- Preview Modal: thumbnails, detect kind, extracted fields, "Create Item" + "Enhance with AI" + "Cancel"
- AI Enhance: LLM stub with sanitizer/validator pipeline

### Photo Attachments Everywhere
- Type: `photos?: Array<{ id, uri, addedAt, source, width?, height? }>`
- ItemCard shows badge, PhotoStrip in editors, PhotoViewerModal (swipe close)

### Pinboard (Freeform)
- Canvas pins existing items (reference by itemId)
- Drag to reposition, tap pin → edit
- State: `pins: Array<{ id, itemId, x, y, w, h, z }>`

### Studio Screen
- **Themes tab**: 18 themes, data-driven tokens
- **Design Packs tab**: 8 packs, "Apply to All" or "Apply only to [tool]"
- **Templates tab**: Daily/Weekly/Project/Personal/Pro, search, favorites, recents (~38 templates)

### Search + Tags + Export
- Global search across title/body/tags AND taskData fields
- Tag chips in editor
- Export/Import: JSON, Markdown, TXT via expo-sharing

### Work Sessions (Master Plan)
- PlanEditor shows collapsible Work Sessions list (timestamps + note)
- "Log Work Session" button (manual)

### Goals Tool
- List with title, status (active/paused/done), notes, links to items
- "Create goal from item" action

### JSON Sanitizer + Validator
- `/src/services/json/sanitize.ts`: extractLikelyJson()
- `/src/services/json/schema.ts`: DeskKind, LlmExtract, LlmTaskData
- `/src/services/json/validate.ts`: safeParseAndValidateLlmJson()
- `/src/services/json/index.ts`: parseLlmExtract()
- AI Enhance MUST use this; fallback to raw OCR on validation failure

### DeskRevealShell Foundation (Dormant)
- Checks lastIntroDate in AsyncStorage
- When enabled (future flag), runs 2s sequence:
  - felt texture fade
  - camera drop
  - stacks settle
- Uses Lottie JSON placeholder (no assets shipped)

### Quotas
- OCR: unlimited (optional cap)
- AI Enhance: free tier = 10/month
- Stored in AsyncStorage with monthly reset

## Setup

### 1. Install Dependencies
All packages are pre-installed. The following are already included:
- Expo SDK 53, React Native 0.76.7
- React Query, NativeWind, Tailwind, Reanimated, Gesture Handler
- expo-camera, expo-image-picker, expo-image-manipulator
- expo-file-system, expo-sharing
- AsyncStorage, zustand, zod
- lucide-react-native icons

### 2. Environment Variables
Set in Vibecode ENV tab:

```
EXPO_PUBLIC_GOOGLE_VISION_KEY=your_google_cloud_vision_api_key
EXPO_PUBLIC_AI_ENHANCE_URL=https://your-ai-service.com/enhance  (optional)
```

### 3. Google Cloud Vision Setup
1. Create a Google Cloud project
2. Enable Cloud Vision API
3. Create an API key (restricted to Vision API)
4. Copy key to EXPO_PUBLIC_GOOGLE_VISION_KEY

### 4. Test OCR
```bash
curl -X POST 'https://vision.googleapis.com/v1/images:annotate?key=YOUR_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "requests":[{
      "image":{"content":"BASE64_IMAGE_HERE"},
      "features":[{"type":"DOCUMENT_TEXT_DETECTION"}]
    }]
  }'
```

### 5. AI Enhance Setup (Optional)
If using AI enhancement, set EXPO_PUBLIC_AI_ENHANCE_URL to an endpoint that:
- Accepts POST request: `{ text: string, preferredKind: ItemKind }`
- Returns JSON matching LlmExtract schema
- The app automatically sanitizes/validates response with JSON validator

### 6. Run the App
```bash
cd mobile
bun start
```

## File Structure

```
/src
  /app                          # Expo Router screens
    _layout.tsx                 # Root with Stack + Query + Theme
    (tabs)/                     # Tab shell
      _layout.tsx
      index.tsx                 # Desk home
      settings.tsx
    editor.tsx                  # Item editor modal
    search.tsx                  # Global search modal
    tool-list.tsx               # Tool picker
    pinboard.tsx                # Pinboard canvas
    studio.tsx                  # Themes/Packs/Templates
    themes.tsx                  # Theme picker
    vault.tsx                   # Vault screen
    journal.tsx                 # Journal screen
    goals.tsx                   # Goals screen
    scan-preview.tsx            # OCR preview
    activity.tsx                # Activity log
    export-panel.tsx            # Export/Import

  /components                   # Reusable components
    Themed.tsx
    (Custom components)

  /lib
    /theme
      tokens.ts                 # 18 themes + tokens
      designPacks.ts            # 8 design packs
      themes.ts                 # ThemeColors type
      ThemeContext.tsx          # Context provider
    /state
      store.ts                  # Zustand store
    /services
      photos.ts                 # Photo management
      ocrGoogleVision.ts        # OCR
      aiEnhance.ts              # AI pipeline
      export.ts                 # Export service
      journal.ts                # Journal helpers
      quotaManager.ts           # Quotas
      deskReveal.ts             # Intro sequence
      scanToDesk.ts             # Scan pipeline
      /json
        sanitize.ts
        validate.ts
        schema.ts
        index.ts
    constants.ts                # Types + constants
```

## API Integration

### Google Cloud Vision
The app sends base64-encoded images to Google Cloud Vision API for OCR.

**Request:**
```json
{
  "requests":[{
    "image":{"content":"BASE64_STRING"},
    "features":[{"type":"DOCUMENT_TEXT_DETECTION"}],
    "imageContext":{"languageHints":["en"]}
  }]
}
```

**Response:**
```json
{
  "responses":[{
    "fullTextAnnotation":{
      "text":"...",
      "confidence":0.95,
      "pages":[...]
    }
  }]
}
```

### AI Enhance (Optional)
If configured, the app calls your AI endpoint to structure OCR text.

**Request:**
```json
{
  "text":"Raw OCR text here",
  "preferredKind":"plan"
}
```

**Response (must match LlmExtract schema):**
```json
{
  "kind":"plan",
  "title":"...",
  "body":"...",
  "tags":["..."],
  "taskData":{...}
}
```

The response is automatically validated through the JSON sanitizer pipeline.

## Quotas

Free tier limits:
- **OCR**: Unlimited (optional cap)
- **AI Enhance**: 10 per month

Reset monthly based on calendar month. Pro users get unlimited.

Quota data stored in AsyncStorage at: `@vf_quota_tracker`

## Themes & Design Packs

All 18 themes have complete token definitions in `src/lib/theme/tokens.ts`.

All 8 design packs modifiable in `src/lib/theme/designPacks.ts`.

Apply themes globally via Studio screen. Design packs can be applied to all tools or individual tools.

## Testing Checklist

- [ ] Create items in all 8 tool types
- [ ] Upload photos and view in PhotoViewerModal
- [ ] Test scan with Google Cloud Vision (needs API key)
- [ ] Test AI enhance (if endpoint configured)
- [ ] Export items as JSON/Markdown/TXT
- [ ] Create and manage goals
- [ ] Test journal with daily prompts
- [ ] Try all 18 themes
- [ ] Switch between design packs
- [ ] Test pinboard drag & drop
- [ ] Global search functionality
- [ ] Archive/unarchive items
- [ ] Tag and filter items
- [ ] Work session logging (Master Plan)
- [ ] Journal streak counter

## Deployment

For production deployment:
1. Set proper environment variables
2. Build with `eas build`
3. Submit to App Store/Play Store
4. Monitor quota usage
5. Consider implementing pro tier system

## Support

For issues:
1. Check console logs in Vibecode LOGS tab
2. Verify environment variables are set
3. Test API connectivity
4. Check quota limits
5. Review error messages in scan-preview modal
