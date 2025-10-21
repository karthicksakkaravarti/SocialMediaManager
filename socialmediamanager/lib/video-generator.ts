/**
 * Video Generator API Client
 * Integrates with external video generation service
 */

const API_BASE = process.env.VIDEO_GENERATOR_API_URL || 'http://localhost:8080'

export type VideoScene = {
  image: string
  voiceover: string
  zoom?: 'none' | 'in' | 'out' | 'pan_left' | 'pan_right' | 'pan_down'
  zoom_ratio?: number
  watermark?: string
}

export type VideoGenerationRequest = {
  title: string
  scenes: VideoScene[]
  background_music?: string
  watermark?: string
  webhook_url?: string
}

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

export type JobCreateResponse = {
  job_id: string
  status: JobStatus
  message: string
  status_url: string
}

export type JobResponse = {
  job_id: string
  status: JobStatus
  title: string
  created_at: string
  updated_at: string
  progress?: number
  current_scene?: number
  total_scenes?: number
  error_message?: string
  video_url?: string
  video_path?: string
  duration?: number
}

/**
 * Submit a video generation job
 */
export async function submitVideoGeneration(
  request: VideoGenerationRequest
): Promise<JobCreateResponse> {
  const response = await fetch(`${API_BASE}/api/v1/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(error.message || `Failed to submit video generation: ${response.statusText}`)
  }

  return await response.json()
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string): Promise<JobResponse> {
  const response = await fetch(`${API_BASE}/api/v1/status/${jobId}`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(error.message || `Failed to get job status: ${response.statusText}`)
  }

  return await response.json()
}

/**
 * Download generated video as Buffer
 */
export async function downloadVideo(jobId: string): Promise<Buffer> {
  const response = await fetch(`${API_BASE}/api/v1/download/${jobId}`)

  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * List all jobs (optional - for admin)
 */
export async function listJobs(status?: JobStatus, limit = 100) {
  const params = new URLSearchParams()
  if (status) params.append('status', status)
  params.append('limit', limit.toString())

  const response = await fetch(`${API_BASE}/api/v1/jobs?${params}`)

  if (!response.ok) {
    throw new Error(`Failed to list jobs: ${response.statusText}`)
  }

  return await response.json()
}

/**
 * Cancel a running job
 */
export async function cancelJob(jobId: string) {
  const response = await fetch(`${API_BASE}/api/v1/jobs/${jobId}/cancel`, {
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error(`Failed to cancel job: ${response.statusText}`)
  }

  return await response.json()
}

/**
 * Delete a job and its files
 */
export async function deleteJob(jobId: string) {
  const response = await fetch(`${API_BASE}/api/v1/jobs/${jobId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error(`Failed to delete job: ${response.statusText}`)
  }

  return await response.json()
}

/**
 * Extract video generation data from full script JSON
 * (Removes YouTube metadata which is not part of video API)
 */
export function extractVideoGenerationData(scriptJson: any): VideoGenerationRequest {
  return {
    title: scriptJson.title,
    scenes: scriptJson.scenes.map((scene: any) => ({
      image: scene.image,
      voiceover: scene.voiceover,
      zoom: scene.zoom,
      zoom_ratio: scene.zoom_ratio,
      watermark: scene.watermark,
    })),
    background_music: scriptJson.background_music,
    watermark: scriptJson.watermark,
  }
}
