import { useState } from 'react'
import { Loader2, Sparkles, Download, AlertCircle } from 'lucide-react'
import axios from 'axios'
import type { TaskStatus } from '../types'

function TextToVideo() {
  const [promptText, setPromptText] = useState('')
  const [ratio, setRatio] = useState<'1280:720' | '720:1280' | '1104:832' | '832:1104' | '960:960' | '1584:672'>('1280:720')
  const [duration, setDuration] = useState<4 | 8>(4)
  const [loading, setLoading] = useState(false)
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!promptText.trim()) {
      setError('Please enter a prompt')
      return
    }

    setLoading(true)
    setError(null)
    setTaskStatus(null)

    try {
      const response = await axios.post<TaskStatus>('http://localhost:3001/api/text-to-video', {
        promptText,
        model: 'veo3.1',
        ratio,
        duration,
      })

      setTaskStatus(response.data)
      pollTaskStatus(response.data.id)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate video')
      setLoading(false)
    }
  }

  const pollTaskStatus = async (taskId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get<TaskStatus>(`http://localhost:3001/api/task/${taskId}`)
        setTaskStatus(response.data)

        if (response.data.status === 'SUCCEEDED' || response.data.status === 'FAILED') {
          clearInterval(interval)
          setLoading(false)
          
          if (response.data.status === 'FAILED') {
            setError(response.data.error || 'Video generation failed')
          }
        }
      } catch (err: any) {
        clearInterval(interval)
        setError('Failed to check task status')
        setLoading(false)
      }
    }, 2000)
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="space-y-6">
        {/* Prompt Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Video Prompt
          </label>
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="Describe the video you want to generate... (e.g., 'A serene sunset over the ocean with waves gently crashing')"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none resize-none transition-colors"
            rows={4}
          />
        </div>

        {/* Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Aspect Ratio
            </label>
            <select
              value={ratio}
              onChange={(e) => setRatio(e.target.value as any)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
            >
              <option value="1280:720">16:9 Landscape (1280:720)</option>
              <option value="720:1280">9:16 Portrait (720:1280)</option>
              <option value="1104:832">4:3 Landscape (1104:832)</option>
              <option value="832:1104">3:4 Portrait (832:1104)</option>
              <option value="960:960">1:1 Square (960:960)</option>
              <option value="1584:672">21:9 Ultrawide (1584:672)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value) as any)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
            >
              <option value={4}>4 seconds</option>
              <option value={8}>8 seconds</option>
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={loading || !promptText.trim()}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
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
              <span className="text-sm font-semibold text-gray-700">Status:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                taskStatus.status === 'SUCCEEDED' ? 'bg-green-100 text-green-800' :
                taskStatus.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {taskStatus.status}
              </span>
            </div>

            {taskStatus.progress !== undefined && (
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

            {taskStatus.status === 'SUCCEEDED' && taskStatus.output && taskStatus.output.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700">Generated Video:</p>
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
  )
}

export default TextToVideo
