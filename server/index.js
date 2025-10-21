import express from "express";
import cors from "cors";
import multer from "multer";
import RunwayML from "@runwayml/sdk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import chalk from "chalk"; // để log màu, cài thêm: npm i chalk

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

const RUNWAY_KEY = process.env.RUNWAYML_API_SECRET;

if (!RUNWAY_KEY) {
  console.log(chalk.red.bold("\n❌ RUNWAYML_API_SECRET chưa được thiết lập!"));
  console.log(chalk.yellow("➡️  Hãy thêm vào file .env dòng sau:"));
  console.log(chalk.cyan("RUNWAYML_API_SECRET=sk-your-runway-api-key\n"));
  console.log(
    chalk.gray(
      "Hoặc export thủ công: export RUNWAYML_API_SECRET=sk-your-runway-api-key"
    )
  );
}

// ✅ Khởi tạo client an toàn
const client = new RunwayML({
  apiKey: RUNWAY_KEY || "sk-placeholder-key", // fallback để không crash
});

// Store active tasks
const tasks = new Map();

// Text to Video endpoint
app.post("/api/text-to-video", async (req, res) => {
  try {
    const { promptText, model, ratio, duration } = req.body;

    if (!promptText) {
      return res.status(400).json({ error: "promptText is required" });
    }

    console.log("Creating text-to-video task:", {
      promptText,
      model,
      ratio,
      duration,
    });

    const task = await client.textToVideo.create({
      promptText,
      model: model || "veo3.1",
      ratio: ratio || "1280:720",
      duration: duration || 4,
    });

    tasks.set(task.id, task);

    res.json({
      id: task.id,
      status: task.status,
      progress: task.progress,
    });

    // Start polling in background
    pollTask(task.id);
  } catch (error) {
    console.error("Error creating text-to-video task:", error);
    res.status(500).json({
      error: error.message || "Failed to create text-to-video task",
    });
  }
});

// Image to Video endpoint
app.post("/api/image-to-video", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    const { model, ratio } = req.body;
    const imagePath = req.file.path;

    console.log("Creating image-to-video task:", { imagePath, model, ratio });

    // Read image file and convert to base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = `data:${
      req.file.mimetype
    };base64,${imageBuffer.toString("base64")}`;

    const task = await client.imageToVideo.create({
      promptImage: base64Image,
      model: model || "gen4_turbo",
      ratio: ratio || "1280:720",
    });

    tasks.set(task.id, task);

    // Clean up uploaded file
    fs.unlinkSync(imagePath);

    res.json({
      id: task.id,
      status: task.status,
      progress: task.progress,
    });

    // Start polling in background
    pollTask(task.id);
  } catch (error) {
    console.error("Error creating image-to-video task:", error);

    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: error.message || "Failed to create image-to-video task",
    });
  }
});

// Get task status endpoint
app.get("/api/task/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;

    let task = tasks.get(taskId);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Fetch latest status from RunwayML
    task = await client.tasks.retrieve(taskId);
    tasks.set(taskId, task);

    res.json({
      id: task.id,
      status: task.status,
      progress: task.progress,
      output: task.output,
      error: task.failure ? task.failure.message : undefined,
    });
  } catch (error) {
    console.error("Error retrieving task:", error);
    res.status(500).json({
      error: error.message || "Failed to retrieve task status",
    });
  }
});

// Background polling function
async function pollTask(taskId) {
  try {
    let task = tasks.get(taskId);

    while (task && !["SUCCEEDED", "FAILED"].includes(task.status)) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      task = await client.tasks.retrieve(taskId);
      tasks.set(taskId, task);

      console.log(
        `Task ${taskId} status:`,
        task.status,
        `Progress: ${task.progress || 0}`
      );
    }

    if (task) {
      console.log(`Task ${taskId} completed:`, task.status);
      if (task.status === "SUCCEEDED") {
        console.log("Output:", task.output);
      } else if (task.failure) {
        console.log("Error:", task.failure.message);
      }
    }
  } catch (error) {
    console.error(`Error polling task ${taskId}:`, error);
  }
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("Make sure to set RUNWAYML_API_SECRET environment variable");
});
