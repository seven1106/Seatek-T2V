import express from "express";
import cors from "cors";
import multer from "multer";
import RunwayML from "@runwayml/sdk";
import { Runware } from "@runware/sdk-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import chalk from "chalk";
import {
  SERVER_CONFIGS,
  getModelsByServer,
  getModelConfig,
  calculateCost,
} from "./models-config.js";

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
const RUNWARE_KEY = process.env.RUNWARE_API_KEY;

if (!RUNWAY_KEY) {
  console.log(chalk.yellow("⚠️  RUNWAYML_API_SECRET chưa được thiết lập!"));
}

if (!RUNWARE_KEY) {
  console.log(chalk.yellow("⚠️  RUNWARE_API_KEY chưa được thiết lập!"));
}

// Initialize clients
const runwayClient = new RunwayML({
  apiKey: RUNWAY_KEY || "sk-placeholder-key",
});

let runwareClient = null;
if (RUNWARE_KEY) {
  runwareClient = new Runware({ apiKey: RUNWARE_KEY });
  await runwareClient.connect();
}

// Store active tasks
const tasks = new Map();

// ============ NEW ENDPOINTS ============

// Get available servers and their models
app.get("/api/servers", (req, res) => {
  res.json(SERVER_CONFIGS);
});

// Get models for a specific server
app.get("/api/servers/:serverId/models", (req, res) => {
  const { serverId } = req.params;
  const { type } = req.query;

  const models = getModelsByServer(serverId, type);
  res.json(models);
});

// ============ VIDEO GENERATION ENDPOINTS ============

// Text to Video endpoint (supports both servers)
app.post("/api/text-to-video", async (req, res) => {
  try {
    const { server, promptText, model, ratio, duration } = req.body;

    if (!promptText) {
      return res.status(400).json({ error: "promptText is required" });
    }

    if (!server) {
      return res.status(400).json({ error: "server is required" });
    }

    console.log(chalk.cyan("Creating text-to-video task:"), {
      server,
      promptText: promptText.substring(0, 50) + "...",
      model,
      ratio,
      duration,
    });

    let task;
    const modelConfig = getModelConfig(server, model);
    const estimatedCost = calculateCost(server, model, duration);

    if (server === "runway") {
      if (!RUNWAY_KEY) {
        return res.status(400).json({ error: "Runway API key not configured" });
      }

      const runwayTask = await runwayClient.textToVideo.create({
        promptText,
        model: model || "veo3.1",
        ratio: ratio || "1280:720",
        duration: duration || 4,
      });

      task = {
        id: runwayTask.id,
        server: "runway",
        status: runwayTask.status,
        progress: runwayTask.progress,
        model,
        duration,
        estimatedCost,
      };
    } else if (server === "runware") {
      if (!runwareClient) {
        return res
          .status(400)
          .json({ error: "Runware API key not configured" });
      }

      // Runware returns result directly, not a task to poll
      const runwareResult = await runwareClient.videoInference({
        positivePrompt: promptText,
        model: model,
        height: parseInt(ratio.split(":")[1]),
        width: parseInt(ratio.split(":")[0]),
        duration: duration || 5,
      });

      // Generate a unique task ID
      const taskId = `runware-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      task = {
        id: taskId,
        server: "runware",
        status: runwareResult && runwareResult.length > 0 ? "SUCCEEDED" : "FAILED",
        progress: 1,
        model,
        duration,
        estimatedCost,
        output: runwareResult && runwareResult.length > 0 ? [runwareResult[0].videoURL] : [],
        cost: estimatedCost,
        costBreakdown: {
          model,
          duration,
          pricePerSecond: estimatedCost / duration,
          total: estimatedCost,
        },
      };
    } else {
      return res.status(400).json({ error: "Invalid server" });
    }

    tasks.set(task.id, task);

    res.json({
      id: task.id,
      status: task.status,
      progress: task.progress,
      estimatedCost,
    });

    // Start polling in background (only for Runway)
    if (server === "runway") {
      pollTask(task.id, server);
    }
  } catch (error) {
    console.error(chalk.red("Error creating text-to-video task:"), error);
    res.status(500).json({
      error: error.message || "Failed to create text-to-video task",
    });
  }
});

// Image to Video endpoint (supports both servers)
app.post("/api/image-to-video", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    const { server, model, ratio, duration } = req.body;
    const imagePath = req.file.path;

    if (!server) {
      return res.status(400).json({ error: "server is required" });
    }

    console.log(chalk.cyan("Creating image-to-video task:"), {
      server,
      imagePath,
      model,
      ratio,
    });

    // Read image file and convert to base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = `data:${
      req.file.mimetype
    };base64,${imageBuffer.toString("base64")}`;

    let task;
    const modelConfig = getModelConfig(server, model);
    const estimatedDuration =
      duration || modelConfig?.supportedDurations?.[0] || 5;
    const estimatedCost = calculateCost(server, model, estimatedDuration);

    if (server === "runway") {
      if (!RUNWAY_KEY) {
        fs.unlinkSync(imagePath);
        return res.status(400).json({ error: "Runway API key not configured" });
      }

      const runwayTask = await runwayClient.imageToVideo.create({
        promptImage: base64Image,
        model: model || "gen4_turbo",
        ratio: ratio || "1280:720",
      });

      task = {
        id: runwayTask.id,
        server: "runway",
        status: runwayTask.status,
        progress: runwayTask.progress,
        model,
        duration: estimatedDuration,
        estimatedCost,
      };
    } else if (server === "runware") {
      if (!runwareClient) {
        fs.unlinkSync(imagePath);
        return res
          .status(400)
          .json({ error: "Runware API key not configured" });
      }

      // Runware returns result directly, not a task to poll
      const runwareResult = await runwareClient.videoInference({
        inputImage: base64Image,
        model: model,
        height: parseInt(ratio.split(":")[1]),
        width: parseInt(ratio.split(":")[0]),
        duration: estimatedDuration,
      });

      // Generate a unique task ID
      const taskId = `runware-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      task = {
        id: taskId,
        server: "runware",
        status: runwareResult && runwareResult.length > 0 ? "SUCCEEDED" : "FAILED",
        progress: 1,
        model,
        duration: estimatedDuration,
        estimatedCost,
        output: runwareResult && runwareResult.length > 0 ? [runwareResult[0].videoURL] : [],
        cost: estimatedCost,
        costBreakdown: {
          model,
          duration: estimatedDuration,
          pricePerSecond: estimatedCost / estimatedDuration,
          total: estimatedCost,
        },
      };
    } else {
      fs.unlinkSync(imagePath);
      return res.status(400).json({ error: "Invalid server" });
    }

    tasks.set(task.id, task);

    // Clean up uploaded file
    fs.unlinkSync(imagePath);

    res.json({
      id: task.id,
      status: task.status,
      progress: task.progress,
      estimatedCost,
    });

    // Start polling in background (only for Runway)
    if (server === "runway") {
      pollTask(task.id, server);
    }
  } catch (error) {
    console.error(chalk.red("Error creating image-to-video task:"), error);

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

    // Fetch latest status based on server
    if (task.server === "runway") {
      const runwayTask = await runwayClient.tasks.retrieve(taskId);
      task.status = runwayTask.status;
      task.progress = runwayTask.progress;
      task.output = runwayTask.output;

      if (runwayTask.failure) {
        task.error = runwayTask.failure.message;
      }

      // Calculate actual cost on completion
      if (runwayTask.status === "SUCCEEDED") {
        task.cost = task.estimatedCost;
        task.costBreakdown = {
          model: task.model,
          duration: task.duration,
          pricePerSecond: task.estimatedCost / task.duration,
          total: task.estimatedCost,
        };
      }
    } else if (task.server === "runware") {
      // Runware returns results immediately, no polling needed
      // Task is already complete with output
    }

    tasks.set(taskId, task);

    res.json({
      id: task.id,
      status: task.status,
      progress: task.progress,
      output: task.output,
      error: task.error,
      cost: task.cost,
      costBreakdown: task.costBreakdown,
    });
  } catch (error) {
    console.error(chalk.red("Error retrieving task:"), error);
    res.status(500).json({
      error: error.message || "Failed to retrieve task status",
    });
  }
});

// Background polling function
async function pollTask(taskId, server) {
  try {
    let task = tasks.get(taskId);

    while (task && !["SUCCEEDED", "FAILED"].includes(task.status)) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Only Runway tasks need polling
      const runwayTask = await runwayClient.tasks.retrieve(taskId);
      task.status = runwayTask.status;
      task.progress = runwayTask.progress;
      task.output = runwayTask.output;

      if (runwayTask.failure) {
        task.error = runwayTask.failure.message;
      }

      if (runwayTask.status === "SUCCEEDED") {
        task.cost = task.estimatedCost;
        task.costBreakdown = {
          model: task.model,
          duration: task.duration,
          pricePerSecond: task.estimatedCost / task.duration,
          total: task.estimatedCost,
        };
      }

      tasks.set(taskId, task);

      console.log(
        chalk.blue(`Task ${taskId} [${server}]:`),
        task.status,
        `Progress: ${Math.round((task.progress || 0) * 100)}%`
      );
    }

    if (task) {
      console.log(chalk.green(`✓ Task ${taskId} completed:`), task.status);
      if (task.status === "SUCCEEDED") {
        console.log(chalk.green(`💰 Cost: $${task.cost?.toFixed(4) || "N/A"}`));
        if (task.output) {
          console.log(chalk.gray("Output:"), task.output);
        }
      } else if (task.error) {
        console.log(chalk.red("Error:"), task.error);
      }
    }
  } catch (error) {
    console.error(chalk.red(`Error polling task ${taskId}:`), error);
  }
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    servers: {
      runway: !!RUNWAY_KEY,
      runware: !!RUNWARE_KEY,
    },
  });
});

app.listen(PORT, () => {
  console.log(
    chalk.green.bold(`\n🚀 Server running on http://localhost:${PORT}`)
  );
  console.log(chalk.cyan("📡 Available servers:"));
  console.log(
    chalk.white("  - Runway:"),
    RUNWAY_KEY ? chalk.green("✓ Connected") : chalk.red("✗ Not configured")
  );
  console.log(
    chalk.white("  - Runware:"),
    RUNWARE_KEY ? chalk.green("✓ Connected") : chalk.red("✗ Not configured")
  );
  console.log("");
});
