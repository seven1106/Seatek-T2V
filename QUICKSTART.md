# Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure API Key
Create a `.env` file and add your RunwayML API key:
```bash
echo "RUNWAYML_API_SECRET=your_api_key_here" > .env
```

Get your API key from: https://runwayml.com

### 3. Run the Application

**Terminal 1 - Start the API Server:**
```bash
npm run server
```

**Terminal 2 - Start the Frontend:**
```bash
npm run dev
```

Then open your browser to: **http://localhost:3000**

---

## 📖 How to Use

### Text to Video
1. Click on the "Text to Video" tab
2. Enter a description of the video you want to generate
3. Select aspect ratio (16:9, 9:16, 4:3, 3:4, 1:1, or 21:9)
4. Choose duration (4 or 8 seconds)
5. Click "Generate Video"
6. Wait for the video to be generated
7. Download your video!

### Image to Video
1. Click on the "Image to Video" tab
2. Upload an image (PNG, JPG, WEBP)
3. Select aspect ratio
4. Click "Generate Video"
5. Wait for the video to be generated
6. Download your video!

---

## 🎯 Example Prompts

**Text to Video Examples:**
- "A serene sunset over the ocean with waves gently crashing"
- "A bustling city street at night with neon lights"
- "A peaceful forest with sunlight filtering through the trees"
- "A rocket launching into space with dramatic clouds"

---

## ⚙️ Technical Details

**Frontend:** React + TypeScript + Vite + TailwindCSS  
**Backend:** Express.js + RunwayML SDK  
**Port:** Frontend on 3000, API on 3001

---

## 🐛 Troubleshooting

**"API key not found" error:**
- Make sure you created the `.env` file
- Verify your API key is correct
- Restart the server after adding the key

**CORS errors:**
- Make sure both frontend and backend are running
- Check that ports 3000 and 3001 are not in use

**File upload errors:**
- Ensure the `uploads` folder exists
- Check file size is under 10MB
- Only image files are supported

---

## 📚 API Documentation

### Text to Video API
```javascript
POST http://localhost:3001/api/text-to-video

{
  "promptText": "Your video description",
  "model": "veo3.1",
  "ratio": "1280:720",
  "duration": 4
}
```

### Image to Video API
```javascript
POST http://localhost:3001/api/image-to-video

FormData:
- image: [File]
- model: "gen4_turbo"
- ratio: "1280:768"
```

### Check Task Status
```javascript
GET http://localhost:3001/api/task/:taskId
```

---

## 🎨 Customization

Edit these files to customize:
- `src/App.tsx` - Main layout and navigation
- `src/components/TextToVideo.tsx` - Text to video UI
- `src/components/ImageToVideo.tsx` - Image to video UI
- `tailwind.config.js` - Styling and colors

---

## 📝 License

MIT
