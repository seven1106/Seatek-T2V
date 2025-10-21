// Configuration for available models on each server

export const RUNWAY_MODELS = [
  {
    id: "veo3.1",
    name: "Veo 3.1 (Text to Video)",
    server: "runway",
    type: "text-to-video",
    supportedRatios: [
      "1280:720",
      "720:1280",
      "1104:832",
      "832:1104",
      "960:960",
      "1584:672",
    ],
    supportedDurations: [4, 8],
    costPerSecond: 0.125, // $0.50 for 4 seconds = $0.125/sec
  },
  {
    id: "gen4_turbo",
    name: "Gen-4 Turbo (Image to Video)",
    server: "runway",
    type: "image-to-video",
    supportedRatios: [
      "1280:720",
      "720:1280",
      "1104:832",
      "832:1104",
      "960:960",
      "1584:672",
    ],
    supportedDurations: [5, 10],
    costPerSecond: 0.1, // $0.50 for 5 seconds = $0.1/sec
  },
];

export const RUNWARE_MODELS = [
  // KlingAI Models
  {
    id: "klingai:3@1",
    name: "KlingAI 1.6 Standard",
    server: "runware",
    type: "both",
    supportedRatios: ["1280:720", "720:720", "720:1280"],
    supportedDurations: [5, 10],
    costPerSecond: 0.045,
  },
  {
    id: "klingai:4@3",
    name: "KlingAI 2.0 Master",
    server: "runware",
    type: "both",
    supportedRatios: ["1280:720", "720:720", "720:1280"],
    supportedDurations: [5, 10],
    costPerSecond: 0.06,
  },
  {
    id: "klingai:5@3",
    name: "KlingAI 2.1 Master (Best Quality)",
    server: "runware",
    type: "both",
    supportedRatios: ["1920:1080", "1080:1080", "1080:1920"],
    supportedDurations: [5, 10],
    costPerSecond: 0.08,
  },
  {
    id: "klingai:6@1",
    name: "KlingAI 2.5 Turbo Pro",
    server: "runware",
    type: "both",
    supportedRatios: ["1280:720", "720:720", "720:1280"],
    supportedDurations: [5, 10],
    costPerSecond: 0.055,
  },
  // MiniMax Models
  {
    id: "minimax:1@1",
    name: "MiniMax Video-01 Base",
    server: "runware",
    type: "both",
    supportedRatios: ["1366:768"],
    supportedDurations: [6],
    costPerSecond: 0.03,
  },
  {
    id: "minimax:2@1",
    name: "MiniMax Video-01 Director",
    server: "runware",
    type: "both",
    supportedRatios: ["1366:768"],
    supportedDurations: [6],
    costPerSecond: 0.04,
  },
  {
    id: "minimax:2@3",
    name: "MiniMax Video-01 Live (Image Only)",
    server: "runware",
    type: "image-to-video",
    supportedRatios: ["1366:768"],
    supportedDurations: [6],
    costPerSecond: 0.035,
  },
  //SORA 2
  {
    id: "openai:3@1",
    name: "SORA 2",
    server: "runware",
    type: "text-to-video",
    supportedRatios: ["1280:720", "720:1280"],
    supportedDurations: [4, 8, 12],
    costPerSecond: 0.1,
  },
];

export const SERVER_CONFIGS = [
  {
    id: "runway",
    name: "RunwayML",
    models: RUNWAY_MODELS,
  },
  {
    id: "runware",
    name: "Runware",
    models: RUNWARE_MODELS,
  },
];

// Helper function to get models by server and type
export function getModelsByServer(serverId, type = null) {
  const config = SERVER_CONFIGS.find((s) => s.id === serverId);
  if (!config) return [];

  if (!type) return config.models;

  return config.models.filter((m) => m.type === type || m.type === "both");
}

// Helper function to get model config
export function getModelConfig(serverId, modelId) {
  const config = SERVER_CONFIGS.find((s) => s.id === serverId);
  if (!config) return null;

  return config.models.find((m) => m.id === modelId);
}

// Calculate cost
export function calculateCost(serverId, modelId, duration) {
  const model = getModelConfig(serverId, modelId);
  if (!model || !model.costPerSecond) return 0;

  return model.costPerSecond * duration;
}
