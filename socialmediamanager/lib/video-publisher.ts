/**
 * Video Publisher - Multi-Channel Publishing Logic
 * Handles publishing generated videos to all linked social channels
 */

import { prisma } from './prisma'
import { downloadVideo } from './video-generator'
import { getYouTubeClientForAccount } from './youtube'
import { Readable } from 'stream'

export type YouTubeMetadata = {
  title: string
  description: string
  tags: string[]
  privacyStatus: 'public' | 'private' | 'unlisted'
  madeForKids: boolean
  selfDeclaredMadeForKids?: boolean
  containsSyntheticMedia?: boolean // For altered/synthetic content declaration
  categoryId?: string
}

/**
 * Extract YouTube metadata from script JSON
 */
export function extractYouTubeMetadata(scriptJson: any): YouTubeMetadata {
  console.log('=== EXTRACTING YOUTUBE METADATA ===')
  console.log('Script JSON structure:', JSON.stringify(scriptJson, null, 2))

  // Find YouTube metadata in media array
  const youtubeData = scriptJson.media?.find((m: any) => m.youtube)?.youtube
  console.log('Extracted YouTube data:', youtubeData)

  if (!youtubeData) {
    throw new Error('No YouTube metadata found in script')
  }

  // Extract hashtags (remove # symbol for tags)
  const tags = (youtubeData.hashtags || []).map((tag: string) =>
    tag.startsWith('#') ? tag.slice(1) : tag
  )

  // YouTube has strict limits
  const MAX_TITLE_LENGTH = 100
  const MAX_DESCRIPTION_LENGTH = 5000
  const MAX_TAGS = 500
  const MAX_TAG_LENGTH = 30

  // Truncate title if needed
  let title = youtubeData.title || ''
  if (title.length > MAX_TITLE_LENGTH) {
    console.warn(`Title exceeds ${MAX_TITLE_LENGTH} chars (${title.length}). Truncating...`)
    title = title.substring(0, MAX_TITLE_LENGTH - 3) + '...'
  }

  // Truncate description if needed
  let description = youtubeData.description || ''
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    console.warn(`Description exceeds ${MAX_DESCRIPTION_LENGTH} chars. Truncating...`)
    description = description.substring(0, MAX_DESCRIPTION_LENGTH - 3) + '...'
  }

  // Filter and truncate tags
  const validTags = tags
    .filter(tag => tag.length > 0)
    .map(tag => tag.length > MAX_TAG_LENGTH ? tag.substring(0, MAX_TAG_LENGTH) : tag)
    .slice(0, MAX_TAGS)

  const metadata = {
    title: title.trim(),
    description: description.trim(),
    tags: validTags,
    privacyStatus: 'private' as const, // Default to private for safety
    madeForKids: false, // Default: Not made for kids
    selfDeclaredMadeForKids: false, // Explicitly declare it's not for kids
    containsSyntheticMedia: true, // Mark as altered/synthetic content (AI-generated)
    categoryId: '22', // Default to "People & Blogs" category
  }

  console.log('Final metadata object:', metadata)
  console.log('Title value:', metadata.title)
  console.log('Title length:', metadata.title?.length, '/ 100')
  console.log('Description length:', metadata.description?.length, '/ 5000')
  console.log('Tags count:', metadata.tags?.length, '/ 500')
  console.log('Made for kids:', metadata.madeForKids)
  console.log('Contains synthetic media:', metadata.containsSyntheticMedia)

  if (!metadata.title || metadata.title.trim() === '') {
    throw new Error('YouTube title is empty or invalid')
  }

  if (metadata.title.length > MAX_TITLE_LENGTH) {
    throw new Error(`YouTube title is too long: ${metadata.title.length} chars (max ${MAX_TITLE_LENGTH})`)
  }

  return metadata
}

/**
 * Upload video to a specific YouTube channel (social account)
 */
export async function uploadToYouTube(
  socialAccountId: string,
  videoBuffer: Buffer,
  metadata: YouTubeMetadata
): Promise<string> {
  console.log('=== UPLOADING TO YOUTUBE ===')
  console.log('Social Account ID:', socialAccountId)
  console.log('Metadata received:', metadata)
  console.log('Title:', metadata.title)
  console.log('Description:', metadata.description)
  console.log('Tags:', metadata.tags)
  console.log('Video buffer size:', videoBuffer.length)

  // Get YouTube client for this specific channel
  const youtube = await getYouTubeClientForAccount(socialAccountId)
  const stream = Readable.from(videoBuffer)

  const requestBody: any = {
    snippet: {
      title: metadata.title,
      description: metadata.description,
      tags: metadata.tags,
      categoryId: metadata.categoryId || '22', // Default to People & Blogs
    },
    status: {
      privacyStatus: metadata.privacyStatus,
      selfDeclaredMadeForKids: metadata.selfDeclaredMadeForKids ?? false,
      madeForKids: metadata.madeForKids ?? false,
    },
  }

  // Add containsSyntheticMedia if specified (for altered/AI-generated content)
  if (metadata.containsSyntheticMedia !== undefined) {
    requestBody.status.containsSyntheticMedia = metadata.containsSyntheticMedia
  }

  console.log('YouTube API request body:', JSON.stringify(requestBody, null, 2))

  const response = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody,
    media: {
      body: stream,
    },
  })

  console.log('YouTube upload successful. Video ID:', response.data.id)
  return response.data.id!
}

/**
 * Publish video to all approved channels
 */
export async function publishApprovedVideos(
  scriptId: string,
  videoBuffer: Buffer,
  metadata: YouTubeMetadata
) {
  console.log('=== PUBLISHING APPROVED VIDEOS ===')
  console.log('Script ID:', scriptId)
  console.log('Metadata:', metadata)
  console.log('Video buffer size:', videoBuffer.length)

  const publishes = await prisma.videoPublish.findMany({
    where: {
      scriptId,
      status: 'approved',
    },
    include: {
      socialAccount: {
        include: { brand: true },
      },
    },
  })

  console.log(`Found ${publishes.length} approved publishes`)

  for (const publish of publishes) {
    try {
      console.log(`Publishing to channel ${publish.socialAccount.channelTitle} (${publish.socialAccountId})`)

      // Update status to publishing
      await prisma.videoPublish.update({
        where: { id: publish.id },
        data: { status: 'publishing' },
      })

      // Upload to YouTube using this specific channel's credentials
      const youtubeVideoId = await uploadToYouTube(
        publish.socialAccountId,
        videoBuffer,
        metadata
      )

      console.log(`Successfully uploaded to channel ${publish.socialAccount.channelTitle}. Video ID: ${youtubeVideoId}`)

      // Mark as published
      await prisma.videoPublish.update({
        where: { id: publish.id },
        data: {
          status: 'published',
          youtubeVideoId,
          publishedAt: new Date(),
        },
      })
    } catch (error: any) {
      console.error(`Failed to publish to channel ${publish.socialAccountId}:`, error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
      })

      // Mark as failed
      await prisma.videoPublish.update({
        where: { id: publish.id },
        data: {
          status: 'failed',
          errorMessage: error.message,
        },
      })
    }
  }
}

/**
 * Create publish records for all linked YouTube channels
 * Optionally publish immediately if no approval required
 */
export async function publishToAllChannels(scriptId: string) {
  // Get script with brand, channels, and latest completed job
  const script = await prisma.videoScript.findUnique({
    where: { id: scriptId },
    include: {
      brand: {
        include: {
          socialAccounts: {
            where: { platform: 'youtube' },
          },
          publishConfig: true,
        },
      },
      jobs: {
        where: { status: 'completed' },
        orderBy: { updatedAt: 'desc' },
        take: 1,
      },
    },
  })

  if (!script) {
    throw new Error('Script not found')
  }

  if (!script.jobs[0]?.jobId) {
    throw new Error('No completed job found for this script')
  }

  if (script.brand.socialAccounts.length === 0) {
    throw new Error('No YouTube channels linked to this brand')
  }

  const requireApproval = script.brand.publishConfig?.requireApproval ?? true

  // Check if publish records already exist
  const existingPublishes = await prisma.videoPublish.findMany({
    where: { scriptId },
  })

  // Create publish records for channels that don't have one yet
  const existingAccountIds = new Set(existingPublishes.map((p) => p.socialAccountId))
  const newChannels = script.brand.socialAccounts.filter(
    (acc) => !existingAccountIds.has(acc.id)
  )

  if (newChannels.length > 0) {
    await prisma.videoPublish.createMany({
      data: newChannels.map((channel) => ({
        scriptId,
        socialAccountId: channel.id,
        status: requireApproval ? 'pending_approval' : 'approved',
      })),
    })
  }

  // If no approval needed and auto-publish enabled, publish immediately
  if (!requireApproval || script.brand.publishConfig?.autoPublish) {
    const metadata = extractYouTubeMetadata(script.scriptJson)
    const videoBuffer = await downloadVideo(script.jobs[0].jobId)
    await publishApprovedVideos(scriptId, videoBuffer, metadata)
  }

  return {
    requireApproval,
    channelsTotal: script.brand.socialAccounts.length,
    newRecords: newChannels.length,
  }
}

/**
 * Approve specific publish records and trigger upload
 */
export async function approvePublishes(publishIds: string[]) {
  // Update status to approved
  await prisma.videoPublish.updateMany({
    where: {
      id: { in: publishIds },
      status: 'pending_approval',
    },
    data: {
      status: 'approved',
    },
  })

  // Get one of the publishes to find the script
  const samplePublish = await prisma.videoPublish.findFirst({
    where: { id: { in: publishIds } },
    include: {
      script: {
        include: {
          jobs: {
            where: { status: 'completed' },
            orderBy: { updatedAt: 'desc' },
            take: 1,
          },
        },
      },
    },
  })

  if (!samplePublish || !samplePublish.script.jobs[0]) {
    throw new Error('Cannot find script or completed job')
  }

  // Download video and extract metadata
  const metadata = extractYouTubeMetadata(samplePublish.script.scriptJson)
  const videoBuffer = await downloadVideo(samplePublish.script.jobs[0].jobId)

  // Publish to all approved channels for this script
  await publishApprovedVideos(samplePublish.scriptId, videoBuffer, metadata)

  return { published: publishIds.length }
}

/**
 * Retry failed publish records
 * Resets status to approved and triggers upload again
 */
export async function retryFailedPublishes(publishIds: string[]) {
  console.log('=== RETRYING FAILED PUBLISHES ===')
  console.log('Publish IDs:', publishIds)

  // Verify all are in failed state
  const publishes = await prisma.videoPublish.findMany({
    where: {
      id: { in: publishIds },
      status: 'failed',
    },
    include: {
      script: {
        include: {
          jobs: {
            where: { status: 'completed' },
            orderBy: { updatedAt: 'desc' },
            take: 1,
          },
        },
      },
    },
  })

  if (publishes.length === 0) {
    throw new Error('No failed publishes found with the provided IDs')
  }

  if (publishes.length !== publishIds.length) {
    throw new Error('Some publish records are not in failed state')
  }

  // Check if script has completed job
  const script = publishes[0].script
  if (!script.jobs[0]?.jobId) {
    throw new Error('No completed job found for this script')
  }

  // Reset status to approved
  await prisma.videoPublish.updateMany({
    where: {
      id: { in: publishIds },
    },
    data: {
      status: 'approved',
      errorMessage: null,
    },
  })

  console.log(`Reset ${publishIds.length} publishes to approved status`)

  // Download video and extract metadata
  const metadata = extractYouTubeMetadata(script.scriptJson)
  const videoBuffer = await downloadVideo(script.jobs[0].jobId)

  // Retry publishing
  await publishApprovedVideos(script.id, videoBuffer, metadata)

  return { retried: publishIds.length }
}
