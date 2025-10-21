export interface TextToVideoRequest {
  promptText: string
  model: 'veo3.1'
  ratio: '1280:720' | '720:1280' | '1104:832' | '832:1104' | '960:960' | '1584:672'
  duration: 4 | 8
}

export interface ImageToVideoRequest {
  promptImage: string
  model: 'gen4_turbo'
  ratio: '1280:720' | '720:1280' | '1104:832' | '832:1104' | '960:960' | '1584:672'
}

export interface TaskStatus {
  id: string
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED'
  progress?: number
  output?: string[]
  error?: string
}
