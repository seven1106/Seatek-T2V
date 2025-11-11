import type { ServerType, VideoModel } from '../types'

type ModelType = 'text-to-video' | 'image-to-video' | 'both'

type SupportedModel = VideoModel & { type: ModelType }

export const RUNWAY_MODELS: SupportedModel[] = [
  {
    id: 'veo3.1',
    name: 'Veo 3.1 (Text to Video)',
    server: 'runway',
    type: 'text-to-video',
    supportedRatios: [
      '1280:720',
      '720:1280',
      '1104:832',
      '832:1104',
      '960:960',
      '1584:672',
    ],
    supportedDurations: [4, 8],
    costPerSecond: 0.125,
  },
  {
    id: 'gen4_turbo',
    name: 'Gen-4 Turbo (Image to Video)',
    server: 'runway',
    type: 'image-to-video',
    supportedRatios: [
      '1280:720',
      '720:1280',
      '1104:832',
      '832:1104',
      '960:960',
      '1584:672',
    ],
    supportedDurations: [5, 10],
    costPerSecond: 0.1,
  },
]

export const RUNWARE_MODELS: SupportedModel[] = [
  {
    id: 'klingai:3@1',
    name: 'KlingAI 1.6 Standard',
    server: 'runware',
    type: 'both',
    supportedRatios: ['1280:720', '720:720', '720:1280'],
    supportedDurations: [5, 10],
    costPerSecond: 0.045,
  },
  {
    id: 'klingai:4@3',
    name: 'KlingAI 2.0 Master',
    server: 'runware',
    type: 'both',
    supportedRatios: ['1280:720', '720:720', '720:1280'],
    supportedDurations: [5, 10],
    costPerSecond: 0.06,
  },
  {
    id: 'klingai:5@3',
    name: 'KlingAI 2.1 Master (Best Quality)',
    server: 'runware',
    type: 'both',
    supportedRatios: ['1920:1080', '1080:1080', '1080:1920'],
    supportedDurations: [5, 10],
    costPerSecond: 0.08,
  },
  {
    id: 'klingai:6@1',
    name: 'KlingAI 2.5 Turbo Pro',
    server: 'runware',
    type: 'both',
    supportedRatios: ['1280:720', '720:720', '720:1280'],
    supportedDurations: [5, 10],
    costPerSecond: 0.055,
  },
  {
    id: 'minimax:1@1',
    name: 'MiniMax Video-01 Base',
    server: 'runware',
    type: 'both',
    supportedRatios: ['1366:768'],
    supportedDurations: [6],
    costPerSecond: 0.03,
  },
  {
    id: 'minimax:2@1',
    name: 'MiniMax Video-01 Director',
    server: 'runware',
    type: 'both',
    supportedRatios: ['1366:768'],
    supportedDurations: [6],
    costPerSecond: 0.04,
  },
  {
    id: 'minimax:2@3',
    name: 'MiniMax Video-01 Live (Image Only)',
    server: 'runware',
    type: 'image-to-video',
    supportedRatios: ['1366:768'],
    supportedDurations: [6],
    costPerSecond: 0.035,
  },
  {
    id: 'openai:3@1',
    name: 'SORA 2',
    server: 'runware',
    type: 'text-to-video',
    supportedRatios: ['1280:720', '720:1280'],
    supportedDurations: [4, 8, 12],
    costPerSecond: 0.1,
  },
]

export const SERVER_CONFIGS = [
  {
    id: 'runway' as ServerType,
    name: 'RunwayML',
    models: RUNWAY_MODELS,
  },
  {
    id: 'runware' as ServerType,
    name: 'Runware',
    models: RUNWARE_MODELS,
  },
]

type ModelFilter = 'text-to-video' | 'image-to-video' | null

export function getModelsByServer(serverId: ServerType, type: ModelFilter = null) {
  const config = SERVER_CONFIGS.find((server) => server.id === serverId)
  if (!config) return []

  if (!type) {
    return config.models
  }

  return config.models.filter((model) => model.type === type || model.type === 'both')
}

export function getModelConfig(serverId: ServerType, modelId: string) {
  const config = SERVER_CONFIGS.find((server) => server.id === serverId)
  if (!config) return null

  return config.models.find((model) => model.id === modelId) ?? null
}

export function calculateCost(serverId: ServerType, modelId: string, duration: number) {
  const model = getModelConfig(serverId, modelId)
  if (!model?.costPerSecond) return 0

  return model.costPerSecond * duration
}
