export type ServerType = 'runway' | 'runware'

export interface VideoModel {
  id: string
  name: string
  server: ServerType
  type: 'text-to-video' | 'image-to-video' | 'both'
  supportedRatios: string[]
  supportedDurations?: number[]
  costPerSecond?: number
}

export interface TextToVideoRequest {
  server: ServerType
  promptText: string
  model: string
  ratio: string
  duration: number
}

export interface ImageToVideoRequest {
  server: ServerType
  promptImage: string
  model: string
  ratio: string
  duration?: number
}

export interface TaskStatus {
  id: string
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED'
  progress?: number
  output?: string[]
  error?: string
  cost?: number
  costBreakdown?: {
    model: string
    duration: number
    pricePerSecond: number
    total: number
  }
}

export interface ServerConfig {
  id: ServerType
  name: string
  models: VideoModel[]
}
