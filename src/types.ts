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
  promptText?: string
  model: string
  ratio: string
  duration?: number
}

export interface TaskCostBreakdown {
  model: string
  duration: number
  pricePerSecond: number
  total: number
}

export interface TaskStatus {
  id: string
  server: ServerType
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED'
  model?: string
  duration?: number
  progress?: number
  output?: string[]
  error?: string
  estimatedCost?: number
  cost?: number
  costBreakdown?: TaskCostBreakdown
}

export interface ServerConfig {
  id: ServerType
  name: string
  models: VideoModel[]
}
