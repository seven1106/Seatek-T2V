import RunwayML from '@runwayml/sdk'
import { Runware, RunwareClient } from '@runware/sdk-js'
import type { ServerType, TaskCostBreakdown, TaskStatus } from '../types'
import { calculateCost, getModelConfig } from '../config/models'

type RunwareClientInstance = RunwareClient & {
  ensureConnection?: () => Promise<unknown>
}

type RunwareConstructor = new (props: { apiKey: string }) => RunwareClientInstance

type TextToVideoParams = {
  server: ServerType
  promptText: string
  modelId: string
  ratio: string
  duration: number
}

type ImageToVideoParams = {
  server: ServerType
  imageBase64: string
  modelId: string
  ratio: string
  duration?: number
  promptText?: string
}

let runwayClient: RunwayML | null = null
let runwareClient: RunwareClientInstance | null = null

function getRunwayClient(): RunwayML {
  if (runwayClient) {
    return runwayClient
  }

  const apiKey = import.meta.env.VITE_RUNWAYML_API_SECRET

  if (!apiKey) {
    throw new Error('Runway API key is not configured (missing VITE_RUNWAYML_API_SECRET)')
  }

  runwayClient = new RunwayML({ apiKey })
  return runwayClient
}

async function getRunwareClient(): Promise<RunwareClientInstance> {
  if (runwareClient) {
    return runwareClient
  }

  const apiKey = import.meta.env.VITE_RUNWARE_API_KEY

  if (!apiKey) {
    throw new Error('Runware API key is not configured (missing VITE_RUNWARE_API_KEY)')
  }

  const RunwareCtor = Runware as unknown as RunwareConstructor
  const client = new RunwareCtor({ apiKey })

  if (typeof client.ensureConnection === 'function') {
    await client.ensureConnection()
  }

  runwareClient = client
  return client
}

function buildCostBreakdown(
  server: ServerType,
  modelId: string,
  duration: number,
  total: number
): TaskCostBreakdown | undefined {
  const model = getModelConfig(server, modelId)
  const pricePerSecond = model?.costPerSecond

  if (!pricePerSecond) {
    return undefined
  }

  return {
    model: modelId,
    duration,
    pricePerSecond,
    total,
  }
}

function parseRatio(ratio: string): { width: number; height: number } {
  const [w, h] = ratio.split(':').map((value) => Number.parseInt(value, 10))

  const width = Number.isFinite(w) && w > 0 ? w : 1280
  const height = Number.isFinite(h) && h > 0 ? h : 720

  return { width, height }
}

function normalizeStatus(status: string | undefined): TaskStatus['status'] {
  const normalized = (status ?? 'PENDING').toUpperCase()

  if (normalized === 'PENDING' || normalized === 'RUNNING' || normalized === 'SUCCEEDED' || normalized === 'FAILED') {
    return normalized
  }

  return 'PENDING'
}

function extractRunwayOutput(output: unknown): string[] {
  if (!Array.isArray(output)) {
    return []
  }

  const urls: string[] = []

  for (const item of output) {
    if (!item) continue
    if (typeof item === 'string') {
      urls.push(item)
      continue
    }

    if (typeof item === 'object') {
      const record = item as Record<string, unknown>
      const asset = record.asset

      let maybeUrl = record.url ?? record.uri ?? record.href

      if (maybeUrl === undefined && asset && typeof asset === 'object') {
        const assetUrl = (asset as { url?: unknown }).url
        if (typeof assetUrl === 'string') {
          maybeUrl = assetUrl
        }
      }

      if (typeof maybeUrl === 'string') {
        urls.push(maybeUrl)
      }
    }
  }

  return urls
}

export async function createTextToVideoTask(params: TextToVideoParams): Promise<TaskStatus> {
  const { server, promptText, modelId, ratio, duration } = params
  const estimatedCost = calculateCost(server, modelId, duration)

  if (server === 'runway') {
    const client = getRunwayClient()
    const runwayTask = (await client.textToVideo.create({
      promptText,
      model: (modelId || 'veo3.1') as any,
      ratio: ratio as any,
      duration: duration as any,
    })) as any

    const status = normalizeStatus(runwayTask.status as string | undefined)
    const output = extractRunwayOutput(runwayTask.output as unknown)

    const task: TaskStatus = {
      id: runwayTask.id,
      server,
      status,
      model: modelId,
      duration,
      progress: typeof runwayTask.progress === 'number' ? runwayTask.progress : undefined,
      output,
      estimatedCost,
    }

    if (status === 'SUCCEEDED') {
      task.cost = estimatedCost
      const breakdown = buildCostBreakdown(server, modelId, duration, estimatedCost)
      if (breakdown) {
        task.costBreakdown = breakdown
      }
    }

    return task
  }

  if (server === 'runware') {
    const client = await getRunwareClient()
    const { width, height } = parseRatio(ratio)
    const runwareTask = await client.videoInference({
      positivePrompt: promptText,
      model: modelId,
      width,
      height,
      duration,
    } as any)

    const outputs = Array.isArray(runwareTask)
      ? runwareTask.flatMap((item) => (item?.videoURL ? [item.videoURL] : []))
      : runwareTask && typeof runwareTask === 'object' && 'videoURL' in runwareTask && typeof runwareTask.videoURL === 'string'
        ? [runwareTask.videoURL]
        : []

    const status: TaskStatus['status'] = outputs.length > 0 ? 'SUCCEEDED' : 'FAILED'
    const task: TaskStatus = {
      id: `runware-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      server,
      status,
      model: modelId,
      duration,
      output: outputs,
      estimatedCost,
    }

    if (status === 'SUCCEEDED') {
      task.cost = estimatedCost
      const breakdown = buildCostBreakdown(server, modelId, duration, estimatedCost)
      if (breakdown) {
        task.costBreakdown = breakdown
      }
    } else {
      task.error = 'Runware video generation failed'
    }

    return task
  }

  throw new Error(`Unsupported server: ${server}`)
}

export async function createImageToVideoTask(params: ImageToVideoParams): Promise<TaskStatus> {
  const { server, imageBase64, modelId, ratio, duration, promptText } = params
  const modelConfig = getModelConfig(server, modelId)
  const effectiveDuration = duration ?? modelConfig?.supportedDurations?.[0] ?? 5
  const estimatedCost = calculateCost(server, modelId, effectiveDuration)

  if (server === 'runway') {
    const client = getRunwayClient()
    const runwayTask = (await client.imageToVideo.create({
      promptImage: imageBase64,
      model: (modelId || 'gen4_turbo') as any,
      ratio: ratio as any,
      promptText: promptText || undefined,
    })) as any

    const status = normalizeStatus(runwayTask.status as string | undefined)
    const output = extractRunwayOutput(runwayTask.output as unknown)

    const task: TaskStatus = {
      id: runwayTask.id,
      server,
      status,
      model: modelId,
      duration: effectiveDuration,
      progress: typeof runwayTask.progress === 'number' ? runwayTask.progress : undefined,
      output,
      estimatedCost,
    }

    if (status === 'SUCCEEDED') {
      task.cost = estimatedCost
      const breakdown = buildCostBreakdown(server, modelId, effectiveDuration, estimatedCost)
      if (breakdown) {
        task.costBreakdown = breakdown
      }
    }

    return task
  }

  if (server === 'runware') {
    const client = await getRunwareClient()
    const { width, height } = parseRatio(ratio)
    const runwareTask = await client.videoInference({
      inputImage: imageBase64,
      positivePrompt: promptText || 'Image to video generation',
      model: modelId,
      width,
      height,
      duration: effectiveDuration,
    } as any)

    const outputs = Array.isArray(runwareTask)
      ? runwareTask.flatMap((item) => (item?.videoURL ? [item.videoURL] : []))
      : runwareTask && typeof runwareTask === 'object' && 'videoURL' in runwareTask && typeof runwareTask.videoURL === 'string'
        ? [runwareTask.videoURL]
        : []

    const status: TaskStatus['status'] = outputs.length > 0 ? 'SUCCEEDED' : 'FAILED'
    const task: TaskStatus = {
      id: `runware-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      server,
      status,
      model: modelId,
      duration: effectiveDuration,
      output: outputs,
      estimatedCost,
    }

    if (status === 'SUCCEEDED') {
      task.cost = estimatedCost
      const breakdown = buildCostBreakdown(server, modelId, effectiveDuration, estimatedCost)
      if (breakdown) {
        task.costBreakdown = breakdown
      }
    } else {
      task.error = 'Runware video generation failed'
    }

    return task
  }

  throw new Error(`Unsupported server: ${server}`)
}

export async function refreshTaskStatus(task: TaskStatus): Promise<TaskStatus> {
  if (task.server !== 'runway') {
    return task
  }

  const client = getRunwayClient()
  const latest = (await client.tasks.retrieve(task.id)) as any
  const status = normalizeStatus(latest.status as string | undefined)
  const output = extractRunwayOutput(latest.output as unknown)

  const updated: TaskStatus = {
    ...task,
    status,
    progress: typeof latest.progress === 'number' ? latest.progress : task.progress,
    output: output.length > 0 ? output : task.output,
    error: (latest as { failure?: { message?: string } }).failure?.message ?? task.error,
  }

  const duration = task.duration ?? 0
  const estimatedCost =
    task.estimatedCost ?? (task.model ? calculateCost(task.server, task.model, duration) : undefined)

  if (status === 'SUCCEEDED' && estimatedCost !== undefined) {
    updated.cost = estimatedCost
    const breakdown = task.model ? buildCostBreakdown(task.server, task.model, duration, estimatedCost) : undefined
    if (breakdown) {
      updated.costBreakdown = breakdown
    }
  }

  return updated
}
