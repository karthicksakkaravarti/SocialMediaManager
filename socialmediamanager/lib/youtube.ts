import { google, youtube_v3 } from "googleapis"
import { prisma } from "./prisma"
import { decrypt } from "./encryption"

/**
 * Get authenticated YouTube client for a brand
 */
export async function getYouTubeClient(brandId: string) {
  // Get brand with credentials and social account
  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    include: {
      socialAccounts: {
        where: { platform: "youtube" },
      },
    },
  })

  if (!brand) {
    throw new Error("Brand not found")
  }

  if (!brand.youtubeClientId || !brand.youtubeClientSecret) {
    throw new Error("YouTube credentials not configured")
  }

  const youtubeAccount = brand.socialAccounts[0]
  if (!youtubeAccount) {
    throw new Error("YouTube account not connected")
  }

  // Decrypt client secret
  const clientSecret = decrypt(brand.youtubeClientSecret)

  // Create OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    brand.youtubeClientId,
    clientSecret,
    `${process.env.NEXTAUTH_URL}/api/social/youtube/callback`
  )

  // Set credentials
  oauth2Client.setCredentials({
    access_token: youtubeAccount.accessToken,
    refresh_token: youtubeAccount.refreshToken || undefined,
    expiry_date: youtubeAccount.expiresAt
      ? new Date(youtubeAccount.expiresAt).getTime()
      : undefined,
  })

  // Handle token refresh
  oauth2Client.on("tokens", async (tokens) => {
    if (tokens.refresh_token) {
      // Update refresh token if provided
      await prisma.socialAccount.update({
        where: { id: youtubeAccount.id },
        data: {
          accessToken: tokens.access_token!,
          refreshToken: tokens.refresh_token,
          expiresAt: tokens.expiry_date
            ? new Date(tokens.expiry_date)
            : null,
        },
      })
    } else if (tokens.access_token) {
      // Update just access token
      await prisma.socialAccount.update({
        where: { id: youtubeAccount.id },
        data: {
          accessToken: tokens.access_token,
          expiresAt: tokens.expiry_date
            ? new Date(tokens.expiry_date)
            : null,
        },
      })
    }
  })

  return google.youtube({ version: "v3", auth: oauth2Client })
}

/**
 * Get channel information
 */
export async function getChannelInfo(brandId: string) {
  const youtube = await getYouTubeClient(brandId)

  const response = await youtube.channels.list({
    part: ["snippet", "statistics", "brandingSettings"],
    mine: true,
  })

  const channel = response.data.items?.[0]
  if (!channel) {
    throw new Error("No channel found")
  }

  return {
    id: channel.id!,
    title: channel.snippet?.title,
    description: channel.snippet?.description,
    customUrl: channel.snippet?.customUrl,
    thumbnails: channel.snippet?.thumbnails,
    subscriberCount: parseInt(channel.statistics?.subscriberCount || "0"),
    videoCount: parseInt(channel.statistics?.videoCount || "0"),
    viewCount: parseInt(channel.statistics?.viewCount || "0"),
    bannerImageUrl: channel.brandingSettings?.image?.bannerExternalUrl,
  }
}

/**
 * List videos from channel
 */
export async function listVideos(
  brandId: string,
  options?: {
    pageToken?: string
    maxResults?: number
    search?: string
  }
) {
  const youtube = await getYouTubeClient(brandId)

  const searchResponse = await youtube.search.list({
    part: ["snippet"],
    forMine: true,
    type: ["video"],
    maxResults: options?.maxResults || 50,
    pageToken: options?.pageToken,
    q: options?.search,
    order: "date",
  })

  const videoIds =
    searchResponse.data.items?.map((item) => item.id?.videoId!).filter(Boolean) ||
    []

  if (videoIds.length === 0) {
    return {
      videos: [],
      nextPageToken: null,
      totalResults: 0,
    }
  }

  // Get detailed video information
  const videosResponse = await youtube.videos.list({
    part: ["snippet", "statistics", "contentDetails", "status"],
    id: videoIds,
  })

  const videos =
    videosResponse.data.items?.map((video) => ({
      id: video.id!,
      title: video.snippet?.title,
      description: video.snippet?.description,
      thumbnails: video.snippet?.thumbnails,
      publishedAt: video.snippet?.publishedAt,
      channelTitle: video.snippet?.channelTitle,
      tags: video.snippet?.tags,
      categoryId: video.snippet?.categoryId,
      viewCount: parseInt(video.statistics?.viewCount || "0"),
      likeCount: parseInt(video.statistics?.likeCount || "0"),
      commentCount: parseInt(video.statistics?.commentCount || "0"),
      duration: video.contentDetails?.duration,
      privacyStatus: video.status?.privacyStatus,
      uploadStatus: video.status?.uploadStatus,
    })) || []

  return {
    videos,
    nextPageToken: searchResponse.data.nextPageToken || null,
    totalResults: searchResponse.data.pageInfo?.totalResults || 0,
  }
}

/**
 * Get video details
 */
export async function getVideoDetails(brandId: string, videoId: string) {
  const youtube = await getYouTubeClient(brandId)

  const response = await youtube.videos.list({
    part: ["snippet", "statistics", "contentDetails", "status"],
    id: [videoId],
  })

  const video = response.data.items?.[0]
  if (!video) {
    throw new Error("Video not found")
  }

  return {
    id: video.id!,
    title: video.snippet?.title,
    description: video.snippet?.description,
    thumbnails: video.snippet?.thumbnails,
    publishedAt: video.snippet?.publishedAt,
    channelTitle: video.snippet?.channelTitle,
    tags: video.snippet?.tags,
    categoryId: video.snippet?.categoryId,
    viewCount: parseInt(video.statistics?.viewCount || "0"),
    likeCount: parseInt(video.statistics?.likeCount || "0"),
    commentCount: parseInt(video.statistics?.commentCount || "0"),
    duration: video.contentDetails?.duration,
    privacyStatus: video.status?.privacyStatus,
    uploadStatus: video.status?.uploadStatus,
  }
}

/**
 * Update video metadata
 */
export async function updateVideo(
  brandId: string,
  videoId: string,
  updates: {
    title?: string
    description?: string
    tags?: string[]
    categoryId?: string
    privacyStatus?: "public" | "private" | "unlisted"
  }
) {
  const youtube = await getYouTubeClient(brandId)

  const response = await youtube.videos.update({
    part: ["snippet", "status"],
    requestBody: {
      id: videoId,
      snippet: {
        title: updates.title,
        description: updates.description,
        tags: updates.tags,
        categoryId: updates.categoryId,
      },
      status: {
        privacyStatus: updates.privacyStatus,
      },
    },
  })

  return response.data
}

/**
 * Delete video
 */
export async function deleteVideo(brandId: string, videoId: string) {
  const youtube = await getYouTubeClient(brandId)

  await youtube.videos.delete({
    id: videoId,
  })

  return { success: true }
}

/**
 * Get channel statistics and analytics
 */
export async function getChannelStatistics(brandId: string) {
  const youtube = await getYouTubeClient(brandId)

  const response = await youtube.channels.list({
    part: ["statistics"],
    mine: true,
  })

  const stats = response.data.items?.[0]?.statistics

  return {
    subscriberCount: parseInt(stats?.subscriberCount || "0"),
    videoCount: parseInt(stats?.videoCount || "0"),
    viewCount: parseInt(stats?.viewCount || "0"),
    // Note: YouTube API v3 doesn't provide watch time or detailed analytics
    // For advanced analytics, you'd need YouTube Analytics API
  }
}

// Re-export utility functions from youtube-utils
export { parseDuration, formatDuration, formatViewCount } from "./youtube-utils"
