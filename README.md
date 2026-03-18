# VibeForge Desk v1.2 — Hybrid First Launch + Pinboard Hero

## App Store Identity
- **App name**: VibeForge Desk
- **Slug**: vibeforge-desk
- **iOS Bundle ID**: com.vibeforge.desk
- **Android Package**: com.vibeforge.desk
- **Version**: 1.0.0 (build 1)
- **EAS projectId**: Managed by Vibecode platform (removed REPLACE_ME placeholder)

---

# VibeForge Desk

A digital desk operating system. Local-first productivity workspace with a physical desk metaphor. No accounts, no dashboards. Open the app and you're at your desk.

## Core Principles
- **No SaaS bloat** -- No accounts, no onboarding maze. Open app, you're at your desk.
- **Physical workflow** -- Feels like paper, objects on a desk, tactile logic.
- **Local-first** -- All data stored locally via AsyncStorage. Cloud & AI are optional enhancements.
- **Apple-grade clarity** -- Professional, clean, smooth, intentional.

## v1.2 Features

### Hybrid First Launch Flow
- Full-screen `first-launch` modal shown on first app open (controlled by `firstLaunchComplete` flag)
- **Start Empty**: runs Desk Setup Wizard (choose tools → order → layout), then "Create First Pin" prompt before landing on Desk
- **Load Sample Workspace**: seeds sample pins/tasks/notes/stickies, then shows Customize Desk step (optional skip), then lands on Desk
- No "demo" wording anywhere — uses "sample content"

### Pinboard Hero Card
- Pinboard is now the **first and largest card** below the tile grid on the Desk
- Shows up to 4 pin preview chips with titles + pin count badge
- Two action buttons: **Open Pinboard** and **New Pin** (Alert.prompt for iOS title input)
- Always visible (not gated by `showWideCards`)

### Settings: Workspace Management
- **Clear Sample Content** — only visible if `sampleContentLoaded=true`; removes all sample items/pins with single confirm
- **Reset Workspace** — double-confirm dialog; wipes all data and returns to first-launch state
- Settings → "Desk Setup" to re-run anytime
- Screen: `app/desk-setup.tsx` | Route: `/desk-setup` | Presentation: `fullScreenModal`
- Layout presets affect home screen: compact hides scan bar, focus hides wide cards

### Vault Archive Export/Import (.vfdesk format)
- Primary `.vfdesk` archive format: `{ version, exportedAt, items[], metadata }`
- File name pattern: `vibeforge-desk-YYYY-MM-DD.vfdesk`
- Share sheet export + local file save via `expo-sharing`
- Import with validation: file size < 50MB, schema check, item count confirmation
- Inline toast feedback (success/error, fades after 3s)
- "Load Demo Workspace" button seeds 6 sample items for App Review
- Screen: `app/export-panel.tsx` (overhauled)

### Command Bar Enhancements (⌘K)
- Added: New Sticky, New Goal quick actions
- Renamed "Export / Backup" → "Export Vault"
- Full action list: New Note, New Plan, New Task, New Sticky, New Journal, New Goal, Open Pinboard, Open Studio, Switch Theme, Export Vault, Activity Timeline

## Desk Tools (8 Total)

### Core Tools
**1. Master Plan (Strategy)** - Long-form notes with ruled paper aesthetic, tags, work sessions
**2. Task Planner (Daily Log)** - Daily task lists with progress tracking
**3. Stickies (Quick Capture)** - Quick yellow/green notes with tags
**4. Steno Notebook (Refinement)** - Freeform notes with ruled lines and red margin
**5. Pinboard (Canvas)** - Freeform spatial canvas for pinning items

### Expanded Tools (NEW)
**6. Vault** - Archive + export portfolio folder. Searchable archive.
**7. Journal** - Leather-bound daily free-write. One entry per day, auto-dated.
**8. Goals** - OKR/habit board with progress tracking and key results.

### Workspace (Vault OS) - NEW
A local-first Markdown knowledge base with linking, backlinks, and a graph view. Accessible via the QuickShelf "Workspace" shortcut.

## Vault OS Architecture

### Data Layer
- **Store**: `src/lib/state/vaultStore.ts` — Zustand + AsyncStorage (key: `vf-vault-os-storage`)
- **Types**: `VaultMeta`, `VaultFolder`, `VaultNote`, `ContextPack`
- **Wiki-link parser**: `parseWikiLinks(content)` — extracts `[[Target]]` patterns
- **Backlinks index**: `backlinksIndex: Record<noteId, noteId[]>` — rebuilt via `rebuildBacklinks(vaultId)` after every save
- **Generators**: `src/lib/vaultGenerators.ts` — 5 structured note templates

### Screens
| Screen | File | Route |
|--------|------|-------|
| Vault Navigator | `app/vault-os.tsx` | `/vault-os` |
| Note Editor | `app/vault-note.tsx` | `/vault-note?noteId=` |
| Context Packs | `app/vault-context-packs.tsx` | `/vault-context-packs?vaultId=` |
| Generators | `app/vault-generators.tsx` | `/vault-generators?vaultId=` |

### Features
- **Vault creation** auto-creates a `README.md` at root as operating brief
- **Folder tree** with collapsible sections, create/rename/delete
- **Note editor** with 4 tabs: WRITE | PREVIEW | BACKLINKS | GRAPH
- **Wiki-links** `[[Note Title]]` resolve to other notes; missing targets prompt creation
- **Backlinks** show all notes that reference the current note
- **Graph view** SVG circular layout showing the note link graph (capped at 30 nodes)
- **Vault Generators**: Launch Plan, Research Report, Content Script, Ad Concepts, Strategy Memo
- **Context Packs**: Named bundles of notes + operating brief + DO/DON'T rules

### Data Flow
```
User edits note → updateNote() → parseWikiLinks() updates parsedLinks
                               → rebuildBacklinks(vaultId) refreshes index
                               → backlinksIndex updated in store
```

### Design Decisions
- No backend; everything in AsyncStorage via Zustand persist
- Graph layout: circular arrangement, current note centered
- Auto-save: 800ms debounce on content change
- Wiki-links in preview: `[[Target]]` → `[Target](wiki://Target)` before MarkdownDisplay render

### Desk (Home Screen)
- 8 tool cards: 4 core stacks + Pinboard + Vault + Journal + Goals
- Scan to Desk button for OCR capture
- Each stack shows item count and task progress
- Quick search bar spanning all tools
- Activity timeline access
- Haptic feedback on all interactions

## Scan to Desk (Smart OCR Pipeline)

### How it works
1. Tap "Scan to Desk" from home, tool headers, or editors
2. Choose camera or photo library
3. Image resized/compressed via expo-image-manipulator
4. Google Cloud Vision OCR extracts text
5. Preview modal shows editable fields, detected text, and kind selector
6. Create item with photos attached
7. Optional: "Enhance with AI" (user-triggered, consumes quota)

### Smart Features
- **Monthly Quota Manager** -- 300 OCR calls, 10 AI enhancements per month (auto-resets)
- **JSON Sanitizer/Validator** -- Crash-proof AI output handling:
  - Strips code fences, normalizes quotes, removes trailing commas
  - Never crashes state updates, always safe fallback
- **Multi-Photo Support** -- Attach multiple photos to any item
- **AI Enhance Stub** -- Ready for LLM integration (user-triggered only)

### API Keys
- Set `EXPO_PUBLIC_GOOGLE_VISION_KEY` for OCR
- Set `EXPO_PUBLIC_AI_ENHANCE_URL` for AI enhancement (optional)

## Interactions

### Move Mode
- Long-press any item in a tool list
- Item lifts with scale animation and shadow
- Drop bar slides up from bottom with destination kinds
- Tap destination to convert with haptic feedback
- Cancel by tapping outside

### Photo Attachments
- Add photos from camera or library to any item
- Thumbnail strip in editors
- Full-screen photo viewer modal
- Delete photos with confirmation

### Haptic Feedback
- Light impact on card presses
- Success notification on saves
- Medium impact on move mode activation
- Feedback on task toggles and theme changes

## Journal System (Phase 3)

### Journal Pro Pack
6 structured Mental Fitness Journal templates in the new "Journal" category:
- **Daily Check-in** — Mood/Energy/Stress [0-10] + 3 wins + 1 hard thing + 1 next step
- **Gratitude** — 3 specifics + why each mattered + reflection
- **Thought Record** — Situation → automatic thought → feeling → evidence for/against → balanced view
- **Values & Intentions** — Top value today + one aligned action + end-of-day reflection
- **Sleep & Recovery** — Sleep time, wake, quality, caffeine, exercise, clarity scores
- **Weekly Review** — What worked / what didn't / lessons / energy trend / next week intentions

### Archive Clarity
- Vault screen "Archived Items" tab now shows helper text explaining Archive vs Delete
- Each archived item shows "Long-press to restore" hint
- Settings shows "VAULT" section label + clarifying note: Vault = exports/backups, Archive = hidden items

### Journal UI
- Journal Pack CTA banner at top of Journal screen (taps to Studio → Journal templates)
- Past entries show title + stripped body snippet + date
- Today's entry shows actual content preview (not static placeholder)

## Customization & Theming

### 18 Themes (Data-Driven)
**Original 10:**
Stealth Founder, Marble Classic, Midnight Terminal, Warm Studio, Arctic Minimal, Noir Brass, Neon Nightshift, Sandstone Paper, Forest Ledger, Violet Ink

**New 8 Physical/Vibe Themes:**
Leather Executive, Recycled Kraft, Cyber Graphite, Vintage Typewriter, Space White, Oak Workshop, Carbon Fiber, Blueprint Engineer

Themes are fully data-driven JSON. Adding 50+ themes in future is trivial (just array additions).

### Theme-Safe Ruleset (Phase 3)
All themes now pass through `applyThemeSafetyPass()` on load, enforcing 6 non-destructive invariants:
1. Card surface (`deskHl`) vs desk background — min 1.35:1 contrast
2. Journal/note cards (`plannerPaper`) vs desk — min 1.40:1 contrast
3. Primary text (`textOnDesk`) on desk — min 3.5:1 contrast
4. Note ink on note paper (`plannerPaper`) — min 4.0:1 contrast
5. Secondary text (`muted`) on card surface — min 2.0:1 contrast
6. Border hairlines on cards — min 1.15:1 contrast (skipped for rgba, which self-manage)

Blueprint Engineer specific patches: stronger steel-blue card surface, slightly darker secondary surface, stronger gold hairline borders.

### Design Packs System (Full Visual Systems)
Replaces old "Color Packs" with rich design system overlays:
- **Vintage Typewriter Pack** -- Typed paper feel with vintage rules
- **Blueprint Pack** -- Engineering grid aesthetic
- **Sticky Chaos Pack** -- Layered post-its with rotation
- **Glass Morph Pack** -- Frosted glass cards
- **Minimal Ink Pack** -- Stark, high-contrast design
- **Forest Lodge Pack** -- Warm wood and natural textures

Each pack overrides:
- Accent colors
- Paper texture (smooth, linen, kraft, glass)
- Rule style (steno, ruled, dot-grid, blueprint, minimal)
- Card shadow style (flat, lifted, cinematic)
- Icon set key (future extensibility)

**Per-Tool Customization:**
Design packs can be applied globally or per-tool:
- "Apply to All Templates"
- "Apply only to [Master Plan / Task Planner / Stickies / Steno / Pinboard]"
- Tool-specific override wins over global setting

### 37+ Editor Templates (Organized by Category)
**Daily** (4): Daily Review, Habit Tracker, Meal Plan, Mood Check-in
**Weekly** (3): Weekly Review, Shopping List, Workout Log
**Project** (4): Project Brief, Kanban Board, Meeting Minutes, Decision Log
**Personal** (4): Brain Dump, Idea Pitch, Reading Notes, Travel Plan
**Pro** (4): Cornell Notes, Study Sheet, Budget Snapshot, Client Intake
**Journal** (6): Daily Check-in, Gratitude, Thought Record, Values & Intentions, Sleep & Recovery, Weekly Review
**Plus** (10+): Content Calendar, Finance Quick Log, Client Call Notes, Service Quote, Bug Triage, Sprint Plan, Launch Checklist, Daily Wins, Relationship Check-in, Medical Log

Templates pre-fill structure (title, body, task rows) and never break the data model.

### Studio (Primary Tab — Phase 2)
Studio is now a **primary bottom tab** (Desk | Studio | Settings). No longer buried in Settings.
- **THEMES** -- All 18 themes with swatches and active checkmark
- **DESIGN PACKS** -- 6 packs + "No Pack" option, per-tool override controls
- **TEMPLATES** -- Organized by 6 categories, search/filter, icon + description + kind badge

Everything persisted locally via Zustand + AsyncStorage.

## Phase 2B — Home Screen Upgrade (NEW)

### Proper Tool Cards
- Home screen grid now renders only the 4 core paper tools (Plan/Task/Stickies/Notes)
- Vault, Journal, and Goals moved to dedicated full-width feature cards below Pinboard
- **Vault card**: muted accent, shows archived item count, navigates to `/vault`
- **Journal card**: spineAccent accent, lined texture, shows entry count, navigates to `/journal`
- **Goals card**: brandGreen accent, shows goal count + live average progress bar, navigates to `/goals`

## Phase 3 — Polish Pass (NEW)

### Journal Screen
- **Streak counter**: Consecutive-day writing streak shown in header badge
- **Date column cards**: Past entries redesigned with prominent date column (day/month/weekday) + content preview
- **Empty state**: Welcoming "Start your writing practice" message with icon

### Goals Screen
- **Stat bar**: Total / Active / Avg% stat strip below header
- **Premium cards**: Color-coded left accent bar (green=active, gray=paused, blue=completed), thick progress bars with % label, KR count badge
- **Empty state**: "Define what success looks like" with motivational copy

### Settings Screen
- **APP section**: App name + version
- **TOOLS section**: Quick-access rows for each major tool with live item counts
- **DATA section**: Export & Backup, Archived Items (Vault), Activity Timeline
- **APPEARANCE section**: Current theme name, taps to Studio

## Phase 5.1 — iOS Calendar Integration: Read Pipeline (NEW)

### CalendarService (`mobile/src/lib/services/calendar.ts`)
- `CalendarEvent` type: id, title, startDate, endDate, location, notes, calendarId, calendarName, calendarColor, isAllDay
- `requestCalendarPermission()` — requests iOS calendar read permission (only called on entering calendar area)
- `fetchEvents(rangeStart, rangeEnd)` — fetches from expo-calendar, normalizes ISO strings to Date objects, sorts by startDate
- `fetchGroupedEvents()` — returns non-overlapping buckets: **Today** / **This Week** (tomorrow–end of week) / **This Month** (next week–end of month)
- `formatEventTime()` — formats as "9:00 AM – 10:00 AM" or "All Day"
- 500ms module-level debounce to prevent fetch storms

### Calendar Screen (`mobile/src/app/calendar.tsx`)
- Full-screen card presentation, dark iOS-native aesthetic matching desk theme
- `StageSafeHeader` with title "Calendar", back button, and manual refresh button (RotateCcw)
- Three sections: TODAY / THIS WEEK / THIS MONTH — each with count badge
- Event rows: colored left bar (calendar color), time range, title, optional location
- Empty state per section; loading state with ActivityIndicator
- **Permission denied state**: CalendarDays icon + "Enable in Settings > Privacy > Calendars" + "Open Settings" button (`Linking.openSettings()`)
- **Refresh discipline**: mount + `useFocusEffect` + `AppState` "active" + manual button — all debounced at 500ms via `lastFetchRef`

### Home Screen Integration
- New **CalendarCard** wide card on home between GoalsCard and Activity Timeline
- Calendar option added to Quick Shelf (icon: CalendarDays, route: `/calendar`)

## Phase 2A — Desk OS Core (NEW)

### Command Bar (Global ⌘K)
- Full-screen transparent modal overlay — tap the ⌘ button in the Desk header or ⌘K
- Auto-focused search input across all items (title, body, tags, task rows)
- Live results with kind badges as you type
- Quick Actions always visible: New Note/Plan/Task/Journal, Open Studio, Switch Theme, Open Pinboard, Export/Backup, Activity Timeline
- Slides up from bottom with Reanimated fade — dismiss via backdrop tap or X button
- Registered as `transparentModal` so background stays visible

### Quick Shelf (Persistent Shortcuts)
- Horizontal pill-chip row on Home screen, between header and search bar
- Default shelf: Plan, Task, Journal, Studio
- Tap chip → navigates instantly to that tool/screen
- Long-press chip → turns red with remove X (tap to remove from shelf)
- + button at end → picker sheet to add any available shortcut
- Shelf state persisted via Zustand + AsyncStorage (survives restarts)

### Stage Manager-safe Headers (Universal)
- All screens with custom headers now use StageSafeHeader component
- Back buttons clear iPad Stage Manager window controls (20px STAGE_OFFSET on iOS)
- Applies to: goals, scan-preview, editor nav bar, tool-list, vault, journal, pinboard

## Cross-Tool Features
- **Search**: Full-text search across all items (title, body, tags, task data)
- **Tags**: Add tags to any item for organization
- **Pin/Archive**: Pin important items to top, archive old ones
- **Convert**: Move mode with drop bar for item type conversion
- **Export**: JSON vault backup, Markdown, Plain Text
- **Import**: Restore from JSON vault backup
- **Activity Timeline**: Track all actions (max 120 entries)

## Tech Stack
- Expo SDK 53, React Native 0.76.7
- Zustand with AsyncStorage persistence (7 item kinds, theme/design pack settings)
- NativeWind (Tailwind CSS for React Native)
- react-native-reanimated for smooth animations
- react-native-gesture-handler for interactions
- expo-haptics for tactile feedback
- expo-image-picker for camera/library
- expo-image-manipulator for image preprocessing
- lucide-react-native for consistent iconography

## Architecture

### State Management (Zustand)
Single store: `useDeskStore()` manages:
- **Items** -- itemsById + orderByKind (7 kinds: plan, task, sticky, note, vault, journal, goal)
- **Theme** -- currentTheme (18 themes)
- **Design Packs** -- currentDesignPack (global) + designPacksByKind (per-tool overrides)
- **Activity** -- ActivityEntry[] for timeline (max 120 entries)
- **Pinboard** -- pins[{ id, itemId, x, y, w, h, z }]

All persisted via AsyncStorage with Zustand middleware.

### Theming
**ThemeColors interface** defines 21 color channels (desk, paper, ink, stickies, rules, etc.)

**Theme resolvers:**
- `getTheme(id)` -- Load base 18 themes
- `getDesignPackStyles(packId)` -- Load design pack overrides
- `resolveDesignPackStyles(theme, packId)` -- Apply pack overrides to theme
- Per-tool resolver (tool-specific pack > global pack > default theme)

### Templates
- `TEMPLATES[]` -- 30+ templates with category, icon, description, kind
- `getTaskTemplateRows()` -- Prefill task rows for task planner templates
- `getTemplatesByCategory(cat)` -- Filter by Daily/Weekly/Project/Personal/Pro

### Services
- `ocrGoogleVision.ts` -- Google Cloud Vision integration
- `quotaManager.ts` -- Monthly limits tracking
- `aiEnhance.ts` -- LLM enhancement stub (user-triggered)
- `scanToDesk.ts` -- Full capture → resize → OCR → preview flow
- `designPackResolver.ts` -- Apply design pack visual hints
- `json/*` -- Sanitize/validate unsafe LLM outputs

## Project Structure
```
mobile/src/
  app/
    (tabs)/
      index.tsx         - Desk home (8 tool cards + scan)
      studio.tsx        - Studio tab (Themes, Design Packs, Templates)
      settings.tsx      - Settings (Export, Activity — lean after Phase 2)
    studio.tsx          - Studio card-push screen (legacy; tab version in (tabs)/)
    vault.tsx           - Archive + exports (new)
    journal.tsx         - Daily free-write journal (new)
    goals.tsx           - OKR/habit board (new)
    tool-list.tsx       - Item list with move mode + scan
    editor.tsx          - Universal editor (all item kinds)
    scan-preview.tsx    - OCR preview, kind select, create
    pinboard.tsx        - Freeform spatial canvas
    search.tsx          - Full-text search
    themes.tsx          - (legacy; functionality in studio.tsx)
    export-panel.tsx    - Export/import vault
    activity.tsx        - Activity timeline
    calendar.tsx        - iOS Calendar read view (Phase 5.1)
    _layout.tsx         - Router & new screen registration
  lib/
    state/store.ts      - Zustand store (7 kinds, theme/packs)
    theme/
      themes.ts         - 18 themes (data-driven)
      designPacks.ts    - 6 design packs (full visual systems)
      ThemeResolver.ts  - Theme + pack resolver
      ThemeContext.tsx  - React context (with pack support)
    constants.ts        - Item kind, labels, type definitions
    templates.ts        - 30+ templates (6 categories)
    services/
      ocrGoogleVision.ts
      quotaManager.ts
      aiEnhance.ts
      scanToDesk.ts
      calendar.ts         - CalendarService (Phase 5.1)
      designPackResolver.ts (apply pack styles to items)
      json/
        sanitize.ts, schema.ts, validate.ts, index.ts
  experience/
    DeskRevealShell.tsx - Opening animation foundation (dormant)
  components/
    Themed.tsx          - Theme-aware primitives
```
