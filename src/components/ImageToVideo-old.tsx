import { useState, useRef } from 'react'
import { Loader2, Upload, Download, AlertCircle, X } from 'lucide-react'
import axios from 'axios'
import type { TaskStatus } from '../types'

function ImageToVideo() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [ratio, setRatio] = useState<'1280:720' | '720:1280' | '1104:832' | '832:1104' | '960:960' | '1584:672'>('1280:720')
  const [loading, setLoading] = useState(false)
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file')
        return
      }
      setSelectedImage(file)
      setPreviewUrl(URL.createObjectURL(file))
      setError(null)
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleGenerate = async () => {
    if (!selectedImage) {
      setError('Please select an image')
      return
    }

    setLoading(true)
    setError(null)
    setTaskStatus(null)

    try {
      const formData = new FormData()
      formData.append('image', selectedImage)
      formData.append('model', 'gen4_turbo')
      formData.append('ratio', ratio)

      const response = await axios.post<TaskStatus>('http://localhost:3001/api/image-to-video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
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
              <p className="text-gray-600 font-medium mb-2">Click to upload an image</p>
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

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={loading || !selectedImage}
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

export default ImageToVideo
