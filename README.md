# RunwayML Video Generator

A modern web application for generating videos from text prompts and images using the RunwayML API.

## Features

- 🎬 **Text to Video**: Generate videos from text descriptions using Veo 3.1 model
- 🖼️ **Image to Video**: Animate static images using Gen-4 Turbo model
- 🎨 **Beautiful UI**: Modern, responsive interface built with React and TailwindCSS
- ⚡ **Real-time Updates**: Live progress tracking for video generation
- 📱 **Multiple Aspect Ratios**: Support for landscape, portrait, and square formats

## Prerequisites

- Node.js 18+ installed
- RunwayML API key ([Get one here](https://runwayml.com))

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your RunwayML API key:
   ```
   RUNWAYML_API_SECRET=your_api_key_here
   ```

## Usage

### Development Mode

1. **Start the API server:**
   ```bash
   npm run server
   ```
   The server will run on `http://localhost:3001`

2. **Start the frontend (in a new terminal):**
   ```bash
   npm run dev
   ```
   The app will open at `http://localhost:3000`

### Production Build

```bash
npm run build
npm run preview
```

## API Endpoints

### Text to Video
```
POST /api/text-to-video
Content-Type: application/json

{
  "promptText": "A serene sunset over the ocean",
  "model": "veo3.1",
  "ratio": "1280:720",
  "duration": 4
}
```

### Image to Video
```
POST /api/image-to-video
Content-Type: multipart/form-data

image: [file]
model: "gen4_turbo"
ratio: "1280:720"
```

### Get Task Status
```
GET /api/task/:taskId
```

## Configuration Options

### Text to Video
- **Model**: `veo3.1`
- **Aspect Ratios**: 
  - `1280:720` (16:9 Landscape)
  - `720:1280` (9:16 Portrait)
  - `1104:832` (4:3 Landscape)
  - `832:1104` (3:4 Portrait)
  - `960:960` (1:1 Square)
  - `1584:672` (21:9 Ultrawide)
- **Duration**: `4` or `8` seconds

### Image to Video
- **Model**: `gen4_turbo`
- **Aspect Ratios**: 
  - `1280:720` (16:9 Landscape)
  - `720:1280` (9:16 Portrait)
  - `1104:832` (4:3 Landscape)
  - `832:1104` (3:4 Portrait)
  - `960:960` (1:1 Square)
  - `1584:672` (21:9 Ultrawide)

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── TextToVideo.tsx    # Text to video component
│   │   └── ImageToVideo.tsx   # Image to video component
│   ├── App.tsx                # Main app component
│   ├── main.tsx               # App entry point
│   ├── types.ts               # TypeScript types
│   └── index.css              # Global styles
├── server/
│   └── index.js               # Express API server
├── uploads/                   # Temporary image uploads
├── package.json
└── README.md
```

## Technologies Used

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: TailwindCSS
- **Icons**: Lucide React
- **Backend**: Express.js
- **API**: RunwayML SDK
- **File Upload**: Multer

## Security Notes

- Never commit your `.env` file or API keys to version control
- The API key is stored server-side only and never exposed to the client
- Uploaded images are automatically deleted after processing

## Troubleshooting

### API Key Issues
Make sure your `RUNWAYML_API_SECRET` is set correctly in the `.env` file and the server is restarted after changes.

### CORS Errors
The server is configured to accept requests from any origin in development. For production, update the CORS configuration in `server/index.js`.

### File Upload Errors
Ensure the `uploads` directory exists and has proper write permissions.

## License

MIT

## Support

For issues with the RunwayML API, visit [RunwayML Documentation](https://docs.runwayml.com)
