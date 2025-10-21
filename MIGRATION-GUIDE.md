# 🔄 Migration Guide - Upgrading to Multi-Server Version

## Quick Start

### 1. Install New Dependencies
```bash
npm install
```

This will install the new `@runware/sdk-js` package.

### 2. Update Environment Variables

**Old `.env`:**
```
RUNWAYML_API_SECRET=sk-your-api-key
```

**New `.env`:**
```
RUNWAYML_API_SECRET=sk-your-runway-api-key
RUNWARE_API_KEY=your-runware-api-key
```

**Note:** Both keys are optional. You can use just one service if you prefer.

### 3. Restart Your Server

Stop the old server (Ctrl+C) and start the new one:
```bash
npm run server
```

You should see:
```
🚀 Server running on http://localhost:3001
📡 Available servers:
  - Runway: ✓ Connected
  - Runware: ✓ Connected
```

### 4. Refresh Your Browser

The frontend will automatically detect the new API and show the server selection UI.

## What Changed?

### API Request Format

**Old Format (Text-to-Video):**
```javascript
{
  "promptText": "A sunset",
  "model": "veo3.1",
  "ratio": "1280:720",
  "duration": 4
}
```

**New Format (Text-to-Video):**
```javascript
{
  "server": "runway",        // NEW: server selection
  "promptText": "A sunset",
  "model": "veo3.1",
  "ratio": "1280:720",
  "duration": 4
}
```

### API Response Format

**Old Response:**
```javascript
{
  "id": "task-123",
  "status": "PENDING",
  "progress": 0
}
```

**New Response:**
```javascript
{
  "id": "task-123",
  "status": "PENDING",
  "progress": 0,
  "estimatedCost": 0.50      // NEW: cost estimation
}
```

**Completed Task Response:**
```javascript
{
  "id": "task-123",
  "status": "SUCCEEDED",
  "progress": 1,
  "output": ["https://..."],
  "cost": 0.50,              // NEW: actual cost
  "costBreakdown": {         // NEW: detailed breakdown
    "model": "veo3.1",
    "duration": 4,
    "pricePerSecond": 0.125,
    "total": 0.50
  }
}
```

## New API Endpoints

### Get Available Servers
```bash
GET http://localhost:3001/api/servers
```

**Response:**
```json
[
  {
    "id": "runway",
    "name": "RunwayML",
    "models": [...]
  },
  {
    "id": "runware",
    "name": "Runware",
    "models": [...]
  }
]
```

### Get Models for Server
```bash
GET http://localhost:3001/api/servers/runway/models?type=text-to-video
```

**Response:**
```json
[
  {
    "id": "veo3.1",
    "name": "Veo 3.1 (Text to Video)",
    "server": "runway",
    "type": "text-to-video",
    "supportedRatios": ["1280:720", "720:1280", ...],
    "supportedDurations": [4, 8],
    "costPerSecond": 0.125
  }
]
```

## UI Changes

### Before (Old UI)
```
┌─────────────────────────────────┐
│ Text to Video | Image to Video  │
├─────────────────────────────────┤
│ Prompt: [____________]          │
│ Aspect Ratio: [16:9 ▼]         │
│ Duration: [4 sec ▼]             │
│ [Generate Video]                │
└─────────────────────────────────┘
```

### After (New UI)
```
┌─────────────────────────────────┐
│ Text to Video | Image to Video  │
├─────────────────────────────────┤
│ Select Server:                  │
│ [RunwayML] [Runware]           │
│                                 │
│ Model: [Veo 3.1 ($0.125/sec) ▼]│
│ Prompt: [____________]          │
│ Aspect Ratio: [16:9 ▼]         │
│ Duration: [4 sec ▼]             │
│                                 │
│ 💰 Estimated Cost: $0.50        │
│                                 │
│ [Generate Video]                │
└─────────────────────────────────┘
```

## Backward Compatibility

The old files are backed up:
- `server/index-old.js` - Original server
- `src/components/TextToVideo-old.tsx` - Original component
- `src/components/ImageToVideo-old.tsx` - Original component

If you need to rollback:
```bash
cd server
mv index.js index-new.js
mv index-old.js index.js

cd ../src/components
mv TextToVideo.tsx TextToVideo-new.tsx
mv TextToVideo-old.tsx TextToVideo.tsx
mv ImageToVideo.tsx ImageToVideo-new.tsx
mv ImageToVideo-old.tsx ImageToVideo.tsx
```

## Testing the New Features

### Test 1: Server Selection
1. Open the app
2. You should see two server options: RunwayML and Runware
3. Click each to see different models load

### Test 2: Cost Estimation
1. Select a server and model
2. Adjust duration
3. Watch the estimated cost update in real-time

### Test 3: Video Generation
1. Generate a video
2. Wait for completion
3. Check that the final cost is displayed
4. Verify cost breakdown shows correct calculation

### Test 4: Model Switching
1. Select RunwayML → Veo 3.1
2. Note the available aspect ratios
3. Switch to Runware → Luma Dream Machine
4. Note that aspect ratios change automatically

## Common Issues

### Issue: "Server not configured"
**Solution:** Add the API key for that server to your `.env` file

### Issue: Models not loading
**Solution:** 
1. Check server console for errors
2. Verify API keys are correct
3. Restart the server

### Issue: Cost showing $0.00
**Solution:** This is normal for models without pricing configured in `models-config.js`

### Issue: Runware connection failed
**Solution:** Runware SDK requires async initialization. Check server logs for connection status.

## Configuration

### Adding Custom Models

Edit `server/models-config.js`:

```javascript
export const RUNWARE_MODELS = [
  // Add your custom model
  {
    id: 'my-custom-model',
    name: 'My Custom Model',
    server: 'runware',
    type: 'both',
    supportedRatios: ['1280:720', '720:1280'],
    supportedDurations: [5, 10],
    costPerSecond: 0.05
  },
  // ... existing models
];
```

### Updating Pricing

Edit the `costPerSecond` value in `models-config.js` for any model.

## Support

If you encounter issues:
1. Check the server console for errors
2. Check the browser console for errors
3. Verify all API keys are correct
4. Try with just one server first
5. Check the UPDATES.md file for known issues

---

**Happy video generating! 🎬**
