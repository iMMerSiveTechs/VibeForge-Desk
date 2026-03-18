# VibeForge Desk — Ship Notes & Checklist

---

## 1. RevenueCat Keys (exact locations)

| Key | File | Env var name |
|-----|------|-------------|
| Test/sandbox key | `.env` (Vibecode ENV tab) | `EXPO_PUBLIC_VIBECODE_REVENUECAT_TEST_KEY` |
| iOS production key | `.env` (Vibecode ENV tab) | `EXPO_PUBLIC_VIBECODE_REVENUECAT_APPLE_KEY` |
| Android production key | `.env` (Vibecode ENV tab) | `EXPO_PUBLIC_VIBECODE_REVENUECAT_GOOGLE_KEY` |

These are read in `mobile/src/lib/revenuecatClient.ts`. The client auto-selects test key in `__DEV__`, and platform key in production. No code changes needed — just paste keys in the Vibecode ENV tab.

---

## 2. Store Setup Steps

### RevenueCat (done via MCP — already configured)
- Project: `proj5120ad17` (VibeForge Desk)
- Entitlement: `pro`
- Offering: `default` (is_current: true)
- Packages: `$rc_monthly` → `desk_pro_monthly`, `$rc_annual` → `desk_pro_yearly`
- Products created for: Test Store, App Store (iOS), Play Store (Android)
- Test Store prices: Monthly $4.99 / Yearly $49.99

### App Store Connect (manual steps)
1. Log in to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Create a new app with bundle ID `com.vibeforge.desk`
3. Go to **Features → In-App Purchases** → Create two subscriptions:
   - Product ID: `desk_pro_monthly` | Price: $4.99/month | Reference name: VibeForge Desk Pro Monthly
   - Product ID: `desk_pro_yearly` | Price: $49.99/year | Reference name: VibeForge Desk Pro Yearly
4. Submit both for review (they'll be reviewed alongside the app)
5. In RevenueCat dashboard → VibeForge Desk project → App Store app → paste your **P8 key file, Key ID, and Issuer ID** from App Store Connect → Keys section

### Google Play (manual steps)
1. Create app in Google Play Console with package `com.vibeforge.desk`
2. Go to **Monetize → Subscriptions** → Create:
   - Product ID: `desk_pro_monthly:monthly` | Price: $4.99/month
   - Product ID: `desk_pro_yearly:yearly` | Price: $49.99/year
3. In RevenueCat dashboard → link your Google Play service account credentials

---

## 3. EAS Build + Submit Commands

```bash
# Step 1: Link to EAS project (run once)
cd mobile
eas init
# This auto-patches app.json with your real projectId

# Step 2: Build for TestFlight (iOS internal testing)
eas build --platform ios --profile preview

# Step 3: Build production (iOS + Android)
eas build --platform all --profile production

# Step 4: Submit to App Store (after production build)
# Fill in eas.json submit section first (REPLACE_ME values)
eas submit --platform ios --latest

# Step 5: Submit to Google Play
eas submit --platform android --latest
```

Before running submit, update `mobile/eas.json`:
```json
"submit": {
  "production": {
    "ios": {
      "appleId": "YOUR_APPLE_ID_EMAIL",
      "ascAppId": "YOUR_NUMERIC_APP_ID_FROM_ASC",
      "appleTeamId": "YOUR_TEAM_ID"
    }
  }
}
```

---

## 4. App Store Connect Metadata Checklist

### Privacy Questionnaire answers
- [ ] **Purchases**: Yes — `desk_pro_monthly`, `desk_pro_yearly` in-app purchases
- [ ] **Data collected**: None (local-first, no user accounts, no analytics)
- [ ] **Tracking**: No — does not track users across apps/websites
- [ ] **Camera**: Yes — used to scan/attach photos to items (not for tracking)
- [ ] **Photo Library**: Yes — used to attach images to items (not for tracking)

### Required metadata
- [ ] **App Name**: VibeForge Desk
- [ ] **Subtitle**: Your local-first desk OS
- [ ] **Description**: A digital desk operating system. Capture stickies, plans, tasks, notes, journals, and goals — all local, all yours. No account needed.
- [ ] **Keywords**: productivity, notes, planner, journal, sticky notes, tasks, local, desk
- [ ] **Support URL**: https://vibeforgedesk.com/support (replace with your URL)
- [ ] **Privacy Policy URL**: https://vibeforgedesk.com/privacy (replace with your URL)
- [ ] **Marketing URL**: https://vibeforgedesk.com (optional)

### Screenshots required (per device)
- [ ] iPhone 6.7" (iPhone 15 Pro Max) — 5 screenshots minimum
- [ ] iPhone 6.5" (iPhone 14 Plus) — same or reuse
- [ ] iPad 12.9" — if supportsTablet is true (it is)

### App Review notes
Add in the "Notes for Reviewer" field:
> This app is local-first with no user accounts. All data is stored on-device using AsyncStorage. The camera and photo library permissions are used only when the user explicitly taps "Scan to Desk" to attach a photo to an item. No OCR or network calls are made in the scan flow. Subscriptions (Pro) unlock themes, design packs, templates, and power tools.

---

## 5. Scan Flow — Offline Confirmation (Privacy Review)

The Scan to Desk feature is **100% offline/local** for App Review purposes:
- `mobile/src/lib/services/scanToDesk.ts` — only calls `expo-image-picker`, no network
- `mobile/src/app/scan-preview.tsx` — no `runOCR` or network calls (removed for V1)
- `mobile/src/lib/services/ocrGoogleVision.ts` — exists but is **not called** anywhere in V1
- No `EXPO_PUBLIC_GOOGLE_VISION_KEY` is required or used

Reviewer can verify: tap "Scan to Desk" → take photo → item is created locally with photo attached. No network activity.

---

## 6. EAS Project ID (set before building)

```bash
cd mobile && eas init
```

EAS will auto-patch `app.json → extra.eas.projectId`. Currently set to `"REPLACE_ME"`.

---

## 7. Assets (replace before production build)

Placeholder dark/VFD-mark PNGs are in `mobile/assets/`:
- `assets/icon.png` — 1024×1024 (replace with final icon)
- `assets/splash.png` — 2048×2048 (replace with final splash)
- `assets/adaptive-icon.png` — 1024×1024 (Android, replace with final)

---

## 8. eas.json Submit Placeholders

Fill in `mobile/eas.json` before `eas submit`:
- `REPLACE_ME_APPLE_ID` → your Apple ID email
- `REPLACE_ME_ASC_APP_ID` → numeric App ID from App Store Connect app page
- `REPLACE_ME_TEAM_ID` → Apple Developer Team ID (found at developer.apple.com/account)
