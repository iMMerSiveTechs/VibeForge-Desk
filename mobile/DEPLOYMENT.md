# VibeForge Desk - Deployment Guide

## Pre-Launch Checklist

### 1. Environment Variables
Set these in Vibecode ENV tab or .env.local:

```bash
EXPO_PUBLIC_GOOGLE_VISION_KEY=your_google_cloud_vision_api_key
EXPO_PUBLIC_AI_ENHANCE_URL=https://your-ai-service.com/enhance  # Optional
EXPO_PUBLIC_BACKEND_URL=https://api.yourdomain.com              # Optional
```

### 2. Google Cloud Vision Setup
1. Go to Google Cloud Console
2. Create a new project
3. Enable Cloud Vision API
4. Create an API key:
   - Go to Credentials
   - Create credentials → API key
   - Restrict to Cloud Vision API
   - Copy the key

### 3. Test Google Cloud Vision
```bash
curl -X POST 'https://vision.googleapis.com/v1/images:annotate?key=YOUR_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "requests":[{
      "image":{"content":"BASE64_IMAGE_DATA"},
      "features":[{"type":"DOCUMENT_TEXT_DETECTION"}],
      "imageContext":{"languageHints":["en"]}
    }]
  }'
```

### 4. AI Enhance Endpoint (Optional)
If implementing AI enhancement:

**POST /enhance**
```json
{
  "text": "raw ocr text here",
  "preferredKind": "plan"
}
```

Response must match LlmExtract schema:
```json
{
  "kind": "plan",
  "title": "...",
  "body": "...",
  "tags": ["tag1", "tag2"],
  "taskData": {
    "date": "2025-02-18",
    "tasks": [
      {"text": "Do thing", "done": false}
    ],
    "important": "...",
    "tomorrow": "...",
    "gratitude": "...",
    "notes": "..."
  }
}
```

### 5. Run Development Server
```bash
cd /home/user/workspace/mobile
bun start
# or: npm start
```

### 6. Test All Features

#### Core Functionality
- [ ] Create items in all 8 tool types
- [ ] Edit items and save changes
- [ ] Delete items
- [ ] Archive and unarchive items
- [ ] Search items globally
- [ ] Pin/unpin items

#### Photos
- [ ] Take a photo with camera
- [ ] Pick a photo from library
- [ ] View photos in PhotoViewerModal
- [ ] Delete photos
- [ ] Check photo storage usage

#### Scanning (requires Google Cloud Vision key)
- [ ] Scan document with camera
- [ ] Scan image from library
- [ ] Verify OCR text is extracted
- [ ] Create item from scan

#### AI Enhancement (requires endpoint)
- [ ] Test AI enhance on scanned text
- [ ] Verify response is validated
- [ ] Check quota tracking
- [ ] Verify fallback to raw text if AI fails

#### Themes
- [ ] Switch to each of 18 themes
- [ ] Verify colors apply correctly
- [ ] Check all theme tokens (desk, surface, paper, ink, border, accent, shadows)

#### Design Packs
- [ ] Apply metallic pack
- [ ] Apply neon pack
- [ ] Apply flat pack
- [ ] Apply pastel pack
- [ ] Apply vintage typewriter pack
- [ ] Apply blueprint grid pack
- [ ] Apply minimal ink pack
- [ ] Apply high contrast pack

#### Tools
- [ ] Master Plan: Create item, log work session
- [ ] Task Planner: Create item with tasks, mark done
- [ ] Stickies: Create items with different colors
- [ ] Steno Notebook: Create note items
- [ ] Pinboard: Create pin, drag pin, edit item
- [ ] Vault: View archived items, check storage
- [ ] Journal: Create entry with prompts, check streak
- [ ] Goals: Create goal, set status, link items

#### Export/Import
- [ ] Export items as JSON
- [ ] Export items as Markdown
- [ ] Export items as Text
- [ ] Import JSON items

#### Search & Tags
- [ ] Add tags to items
- [ ] Search by title
- [ ] Search by body
- [ ] Search by tag
- [ ] Search by task text

#### Work Sessions
- [ ] Log work session on Master Plan item
- [ ] Verify session timestamp

#### Goals
- [ ] Create goal
- [ ] Change goal status (active/paused/done)
- [ ] Link item to goal
- [ ] Unlink item from goal

#### Journal
- [ ] Create today's entry
- [ ] Fill in prompts (Wins, Lessons, Mood, Intent, Gratitude)
- [ ] View timeline
- [ ] Check streak counter
- [ ] Convert journal entry to desk note

## Monitoring

### Check Logs
Open Vibecode LOGS tab to see:
- API responses
- Error messages
- OCR results
- AI responses
- Quota usage

### Monitor Quotas
- OCR calls remain: checked before scan
- AI enhance calls remain: checked before enhancement
- Resets monthly on calendar boundary

### Performance
- Monitor for jank during animations
- Check for memory leaks with photos
- Verify storage cleanup after delete

## Troubleshooting

### OCR Not Working
1. Check if EXPO_PUBLIC_GOOGLE_VISION_KEY is set
2. Verify API key is valid and has Cloud Vision enabled
3. Test with curl command above
4. Check image quality and size

### AI Enhance Not Working
1. Check if EXPO_PUBLIC_AI_ENHANCE_URL is set
2. Verify endpoint returns valid JSON
3. Check endpoint response matches LlmExtract schema
4. Review response validation in sanitize.ts

### Photos Not Saving
1. Check camera/library permissions
2. Verify FileSystem access
3. Check device storage space
4. Review logs in LOGS tab

### Themes Not Applying
1. Verify theme ID matches tokens.ts
2. Check ThemeContext.tsx provider is wrapping app
3. Restart app if cached

### Design Packs Not Applying
1. Verify pack ID matches designPacks.ts
2. Check pack modifier functions
3. Clear app cache and restart

## Performance Optimization

### Before Release
1. Profile with React DevTools
2. Optimize heavy lists with FlatList
3. Memoize expensive components
4. Lazy load templates
5. Compress images

### Monitoring
- Monitor app size (target < 100MB)
- Track memory usage during scanning
- Check animation frame rate (target 60fps)
- Monitor network requests

## Security

### API Keys
- Never commit EXPO_PUBLIC_GOOGLE_VISION_KEY to git
- Use .env.local or Vibecode ENV tab
- Rotate keys regularly
- Monitor API usage for unusual activity

### Data
- Photos stored locally in app sandbox
- No data sent to unknown servers
- All LLM responses validated
- No sensitive data in logs

## Post-Launch

### Week 1
- Monitor crash reports
- Check for common errors
- Verify quota system working
- Monitor API performance

### Month 1
- Analyze user behavior
- Identify UX improvements
- Plan feature updates
- Optimize slow screens

### Ongoing
- Update dependencies
- Monitor for security issues
- Track API deprecations
- Maintain quota limits

## Rollback Plan

If critical issue:
1. Stop deployment
2. Revert to previous version
3. Investigate root cause
4. Fix and test thoroughly
5. Re-deploy

## Support Resources

### Documentation
- /home/user/workspace/mobile/SETUP.md
- /home/user/workspace/mobile/IMPLEMENTATION.md
- /home/user/workspace/mobile/API_GUIDE.md
- /home/user/workspace/mobile/FEATURES_CHECKLIST.md

### Environment
- Vibecode ENV tab: Set variables
- Vibecode LOGS tab: View logs
- Vibecode API tab: Monitor requests

### Testing
- Use Vibecode App for testing
- Emulator/Simulator for development
- Physical device for final testing

## Contact

For questions about:
- **Setup**: Check SETUP.md
- **API Integration**: Check API_GUIDE.md
- **Features**: Check FEATURES_CHECKLIST.md
- **Implementation**: Check IMPLEMENTATION.md
