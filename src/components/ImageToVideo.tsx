import { useState, useRef, useEffect } from "react";
import {
  Loader2,
  Upload,
  Download,
  AlertCircle,
  X,
  DollarSign,
  Server,
} from "lucide-react";
import type {
  TaskStatus,
  ServerConfig,
  VideoModel,
  ServerType,
} from "../types";
import { SERVER_CONFIGS, getModelsByServer } from "../config/models";
import {
  createImageToVideoTask,
  refreshTaskStatus,
} from "../services/videoTasks";

function ImageToVideo() {
  const [servers] = useState<ServerConfig[]>(SERVER_CONFIGS);
  const [selectedServer, setSelectedServer] = useState<ServerType>("runway");
  const [availableModels, setAvailableModels] = useState<VideoModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<VideoModel | null>(null);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [promptText, setPromptText] = useState("");
  const [ratio, setRatio] = useState("");
  const [duration, setDuration] = useState(5);
  const [loading, setLoading] = useState(false);
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (selectedServer) {
      loadModels(selectedServer);
    }
  }, [selectedServer]);

  // Update ratio and duration when model changes
  useEffect(() => {
    if (selectedModel) {
      setRatio(selectedModel.supportedRatios[0] || "");
      setDuration(selectedModel.supportedDurations?.[0] || 5);
    }
  }, [selectedModel]);

  const loadModels = (serverId: ServerType) => {
    const models = getModelsByServer(serverId, "image-to-video");
    setAvailableModels(models);
    if (models.length > 0) {
      setSelectedModel(models[0]);
    }
  };

  const estimatedCost =
    selectedModel && selectedModel.costPerSecond
      ? (selectedModel.costPerSecond * duration).toFixed(4)
      : "0.00";

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file");
        return;
      }
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleGenerate = async () => {
    if (!selectedImage) {
      setError("Please select an image");
      return;
    }

    if (!selectedModel) {
      setError("Please select a model");
      return;
    }

    if (!promptText.trim() && selectedServer === "runware") {
      setError("Please enter a prompt");
      return;
    }

    setLoading(true);
    setError(null);
    setTaskStatus(null);
    clearPolling();

    try {
      const imageBase64 = await fileToDataUrl(selectedImage);

      const task = await createImageToVideoTask({
        server: selectedServer,
        imageBase64,
        modelId: selectedModel.id,
        ratio,
        duration,
        promptText: promptText.trim() || undefined,
      });

      setTaskStatus(task);

      if (task.server === "runway" && !isFinalStatus(task.status)) {
        startPolling(task);
      } else {
        setLoading(false);
        if (task.status === "FAILED" && task.error) {
          setError(task.error);
        }
      }
    } catch (err: any) {
      const message = err?.message || (typeof err === "string" ? err : "Failed to generate video");
      setError(message);
      setLoading(false);
    }
  };

  const clearPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const startPolling = (initialTask: TaskStatus) => {
    clearPolling();
    let currentTask = initialTask;

    pollingRef.current = setInterval(async () => {
      try {
        const updatedTask = await refreshTaskStatus(currentTask);
        currentTask = updatedTask;
        setTaskStatus(updatedTask);

        if (isFinalStatus(updatedTask.status)) {
          clearPolling();
          setLoading(false);

          if (updatedTask.status === "FAILED") {
            setError(updatedTask.error || "Video generation failed");
          }
        }
      } catch (err) {
        clearPolling();
        setError("Failed to check task status");
        setLoading(false);
      }
    }, 2000);
  };

  const isFinalStatus = (status: TaskStatus["status"]) =>
    status === "SUCCEEDED" || status === "FAILED";

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          resolve(result);
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };
      reader.readAsDataURL(file);
    });

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="space-y-6">
        {/* Server Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <Server className="w-4 h-4 inline mr-1" />
            Select Server
          </label>
          <div className="grid grid-cols-2 gap-3">
            {servers.map((server) => (
              <button
                key={server.id}
                onClick={() => setSelectedServer(server.id)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedServer === server.id
                    ? "border-purple-500 bg-purple-50 shadow-md"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-semibold text-gray-800">{server.name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {
                    server.models.filter(
                      (m) => m.type === "image-to-video" || m.type === "both"
                    ).length
                  }{" "}
                  models
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Model Selection */}
        {availableModels.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Model
            </label>
            <select
              value={selectedModel?.id || ""}
              onChange={(e) => {
                const model = availableModels.find(
                  (m) => m.id === e.target.value
                );
                setSelectedModel(model || null);
              }}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
            >
              {availableModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}{" "}
                  {model.costPerSecond ? `($${model.costPerSecond}/sec)` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Prompt Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Video Prompt (optional for Runway)
          </label>
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="Describe the motion or scene you want in the video..."
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none resize-none transition-colors"
            rows={3}
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Source Image
          </label>

          {!previewUrl ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all duration-200"
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium mb-2">
                Click to upload an image
              </p>
              <p className="text-sm text-gray-500">PNG, JPG, WEBP up to 10MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="relative">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full rounded-xl shadow-md"
              />
              <button
                onClick={handleRemoveImage}
                className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>

        {/* Settings */}
        {selectedModel && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Aspect Ratio
              </label>
              <select
                value={ratio}
                onChange={(e) => setRatio(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
              >
                {selectedModel.supportedRatios.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {selectedModel.supportedDurations &&
              selectedModel.supportedDurations.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Duration
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                  >
                    {selectedModel.supportedDurations.map((d) => (
                      <option key={d} value={d}>
                        {d} seconds
                      </option>
                    ))}
                  </select>
                </div>
              )}
          </div>
        )}

        {/* Estimated Cost */}
        {selectedModel && selectedModel.costPerSecond && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-gray-700">
                  Estimated Cost:
                </span>
              </div>
              <span className="text-2xl font-bold text-green-600">
                ${estimatedCost}
              </span>
            </div>
            <div className="text-xs text-gray-600 mt-2">
              {duration} seconds × ${selectedModel.costPerSecond}/sec
            </div>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={loading || !selectedImage || !selectedModel}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Generate Video
            </>
          )}
        </button>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Task Status */}
        {taskStatus && (
          <div className="bg-gray-50 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">
                Status:
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  taskStatus.status === "SUCCEEDED"
                    ? "bg-green-100 text-green-800"
                    : taskStatus.status === "FAILED"
                    ? "bg-red-100 text-red-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {taskStatus.status}
              </span>
            </div>

            {taskStatus.progress !== undefined && taskStatus.server === "runway" && (
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{Math.round(taskStatus.progress * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${taskStatus.progress * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Cost Display */}
            {taskStatus.cost !== undefined && (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-700">
                    💰 Total Cost:
                  </span>
                  <span className="text-2xl font-bold text-green-600">
                    ${taskStatus.cost.toFixed(4)}
                  </span>
                </div>
                {taskStatus.costBreakdown && (
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>Model: {taskStatus.costBreakdown.model}</div>
                    <div>
                      Duration: {taskStatus.costBreakdown.duration}s × $
                      {taskStatus.costBreakdown.pricePerSecond.toFixed(4)}/s
                    </div>
                  </div>
                )}
              </div>
            )}

            {taskStatus.status === "SUCCEEDED" &&
              taskStatus.output &&
              taskStatus.output.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-700">
                    Generated Video:
                  </p>
                  <video
                    src={taskStatus.output[0]}
                    controls
                    className="w-full rounded-lg shadow-md"
                  />
                  <a
                    href={taskStatus.output[0]}
                    download
                    className="flex items-center justify-center gap-2 bg-gray-800 text-white font-semibold py-3 px-6 rounded-xl hover:bg-gray-900 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    Download Video
                  </a>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ImageToVideo;
