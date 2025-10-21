import { useState } from 'react'
import { Video, Image, Sparkles } from 'lucide-react'
import TextToVideo from './components/TextToVideo'
import ImageToVideo from './components/ImageToVideo'

type Tab = 'text-to-video' | 'image-to-video'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('text-to-video')

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-10 h-10 text-purple-600 mr-3" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              RunwayML Video Generator
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Create stunning videos from text prompts or images using AI
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-2 flex gap-2">
            <button
              onClick={() => setActiveTab('text-to-video')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === 'text-to-video'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Video className="w-5 h-5" />
              Text to Video
            </button>
            <button
              onClick={() => setActiveTab('image-to-video')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === 'image-to-video'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Image className="w-5 h-5" />
              Image to Video
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          {activeTab === 'text-to-video' ? <TextToVideo /> : <ImageToVideo />}
        </div>
      </div>
    </div>
  )
}

export default App
