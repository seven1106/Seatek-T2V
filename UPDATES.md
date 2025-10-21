# 🎉 New Features - Multi-Server Support with Cost Tracking

## ✨ What's New

### 1. **Multi-Server Support**
- **RunwayML** - Premium quality video generation
- **Runware** - Cost-effective alternative with multiple models

### 2. **Dynamic Model Selection**
The app now automatically loads available models based on the selected server:

**RunwayML Models:**
- Veo 3.1 (Text-to-Video) - $0.125/sec
- Gen-4 Turbo (Image-to-Video) - $0.10/sec

**Runware Models:**
- Runway Gen-3 Alpha Turbo - $0.05/sec
- Luma Dream Machine - $0.04/sec
- Kling v1 - $0.06/sec
- MiniMax Video-01 - $0.03/sec

### 3. **Real-Time Cost Display**
- **Estimated Cost** shown before generation
- **Actual Cost** displayed after completion
- **Cost Breakdown** with detailed pricing info

### 4. **Smart Model Configuration**
- Each model has its own supported aspect ratios
- Dynamic duration options based on model
- Automatic defaults when switching models

## 🚀 How to Use

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure API Keys
Create a `.env` file with your API keys:
```bash
RUNWAYML_API_SECRET=sk-your-runway-api-key
RUNWARE_API_KEY=your-runware-api-key
```

**Note:** You can use one or both services. The app will work with whichever keys you provide.

### Step 3: Start the Application

**Terminal 1 - Start Server:**
```bash
npm run server
```

**Terminal 2 - Start Frontend:**
```bash
npm run dev
```

### Step 4: Generate Videos

1. **Select Server** - Choose between RunwayML or Runware
2. **Select Model** - Pick from available models (automatically filtered by server)
3. **Configure Settings** - Aspect ratio and duration adjust based on model
4. **See Estimated Cost** - Cost is calculated before generation
5. **Generate** - Create your video
6. **View Final Cost** - See actual cost after completion

## 💰 Cost Comparison

| Model | Server | Type | Cost/sec | 5sec Video |
|-------|--------|------|----------|------------|
| Veo 3.1 | RunwayML | Text-to-Video | $0.125 | $0.50 |
| Gen-4 Turbo | RunwayML | Image-to-Video | $0.10 | $0.50 |
| Runway Gen-3 | Runware | Both | $0.05 | $0.25 |
| Luma Dream | Runware | Both | $0.04 | $0.20 |
| Kling v1 | Runware | Both | $0.06 | $0.30 |
| MiniMax | Runware | Text-to-Video | $0.03 | $0.18 |

## 🔧 Technical Changes

### New Files
- `server/models-config.js` - Model configurations and pricing
- `src/types.ts` - Updated TypeScript types

### Updated Files
- `server/index.js` - Multi-server support
- `src/components/TextToVideo.tsx` - Server selection & cost display
- `src/components/ImageToVideo.tsx` - Server selection & cost display
- `package.json` - Added Runware SDK

### New API Endpoints
- `GET /api/servers` - Get available servers
- `GET /api/servers/:serverId/models` - Get models for a server
- `POST /api/text-to-video` - Updated with server parameter
- `POST /api/image-to-video` - Updated with server parameter
- `GET /api/task/:taskId` - Updated with cost information

## 📊 Features

✅ Server selection (RunwayML / Runware)  
✅ Dynamic model loading  
✅ Automatic aspect ratio filtering  
✅ Automatic duration options  
✅ Real-time cost estimation  
✅ Final cost display  
✅ Cost breakdown details  
✅ Model-specific configurations  
✅ Backward compatible with existing code  

## 🎨 UI Improvements

- **Server Selection Cards** - Visual server picker with model count
- **Cost Badge** - Green gradient badge showing estimated cost
- **Final Cost Display** - Prominent cost display after generation
- **Model Dropdown** - Shows price per second for each model
- **Smart Defaults** - Automatically selects best options

## 🐛 Troubleshooting

**"Server not configured" error:**
- Make sure you have the API key for the selected server in your `.env` file
- Restart the server after adding API keys

**Models not loading:**
- Check that the server is running
- Verify API keys are correct
- Check browser console for errors

**Cost showing as $0.00:**
- This is normal for models without pricing configured
- Check `server/models-config.js` to add pricing

## 📝 Notes

- Runware integration uses their SDK which requires async connection
- Cost calculations are estimates based on configured pricing
- Actual costs may vary based on server pricing changes
- Old backup files are saved as `*-old.tsx` and `*-old.js`

## 🔮 Future Enhancements

- [ ] Add more Runware models
- [ ] Webhook support for faster status updates
- [ ] Cost history tracking
- [ ] Batch video generation
- [ ] Custom model parameters
- [ ] Video preview before download

---

**Enjoy your new multi-server video generation app! 🎬✨**
