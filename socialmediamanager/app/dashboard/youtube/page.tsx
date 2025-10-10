"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Youtube,
  Upload,
  Search,
  Users,
  Eye,
  Video,
  TrendingUp,
  Loader2,
  AlertCircle,
  ExternalLink
} from "lucide-react"
import { formatViewCount } from "@/lib/youtube-utils"
import { YouTubeUploadDialog } from "@/components/youtube-upload-dialog"
import { YouTubeVideoDetailsDialog } from "@/components/youtube-video-details-dialog"

type ChannelInfo = {
  id: string
  title: string
  description: string
  customUrl: string
  thumbnails: any
  subscriberCount: number
  videoCount: number
  viewCount: number
  bannerImageUrl: string
}

type VideoItem = {
  id: string
  title: string
  description: string
  thumbnails: any
  publishedAt: string
  viewCount: number
  likeCount: number
  commentCount: number
  duration: string
  privacyStatus: string
}

type Statistics = {
  subscriberCount: number
  videoCount: number
  viewCount: number
}

export default function YouTubePage() {
  const searchParams = useSearchParams()
  const brandId = searchParams.get("brand")

  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null)
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [nextPageToken, setNextPageToken] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null)
  const [showVideoDetailsDialog, setShowVideoDetailsDialog] = useState(false)

  // Fetch channel info and initial data
  useEffect(() => {
    if (!brandId) {
      setError("No brand selected")
      setIsLoading(false)
      return
    }

    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch channel info
        const channelResponse = await fetch(`/api/youtube/channel?brandId=${brandId}`)
        if (!channelResponse.ok) {
          throw new Error("Failed to fetch channel information")
        }
        const channelData = await channelResponse.json()
        setChannelInfo(channelData)

        // Fetch statistics
        const statsResponse = await fetch(`/api/youtube/statistics?brandId=${brandId}`)
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStatistics(statsData)
        }

        // Fetch videos
        const videosResponse = await fetch(`/api/youtube/videos?brandId=${brandId}&maxResults=20`)
        if (videosResponse.ok) {
          const videosData = await videosResponse.json()
          setVideos(videosData.videos)
          setNextPageToken(videosData.nextPageToken)
        }
      } catch (err: any) {
        setError(err.message || "Failed to load YouTube data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [brandId])

  const handleSearch = async (query: string) => {
    if (!brandId) return

    setSearchQuery(query)
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/youtube/videos?brandId=${brandId}&maxResults=20&search=${encodeURIComponent(query)}`
      )
      if (!response.ok) {
        throw new Error("Failed to search videos")
      }
      const data = await response.json()
      setVideos(data.videos)
      setNextPageToken(data.nextPageToken)
    } catch (err: any) {
      setError(err.message || "Failed to search videos")
    } finally {
      setIsLoading(false)
    }
  }

  const loadMore = async () => {
    if (!brandId || !nextPageToken) return

    setIsLoadingMore(true)

    try {
      const response = await fetch(
        `/api/youtube/videos?brandId=${brandId}&maxResults=20&pageToken=${nextPageToken}${
          searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""
        }`
      )
      if (!response.ok) {
        throw new Error("Failed to load more videos")
      }
      const data = await response.json()
      setVideos([...videos, ...data.videos])
      setNextPageToken(data.nextPageToken)
    } catch (err: any) {
      setError(err.message || "Failed to load more videos")
    } finally {
      setIsLoadingMore(false)
    }
  }

  const refreshVideos = async () => {
    if (!brandId) return

    try {
      const videosResponse = await fetch(`/api/youtube/videos?brandId=${brandId}&maxResults=20`)
      if (videosResponse.ok) {
        const videosData = await videosResponse.json()
        setVideos(videosData.videos)
        setNextPageToken(videosData.nextPageToken)
      }

      // Also refresh statistics
      const statsResponse = await fetch(`/api/youtube/statistics?brandId=${brandId}`)
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStatistics(statsData)
      }
    } catch (err) {
      console.error("Failed to refresh videos:", err)
    }
  }

  const handleVideoClick = (videoId: string) => {
    setSelectedVideoId(videoId)
    setShowVideoDetailsDialog(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading YouTube channel...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!channelInfo) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No YouTube channel found. Please connect your YouTube account first.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Upload Dialog */}
      {brandId && (
        <>
          <YouTubeUploadDialog
            brandId={brandId}
            open={showUploadDialog}
            onOpenChange={setShowUploadDialog}
            onSuccess={refreshVideos}
          />
          <YouTubeVideoDetailsDialog
            brandId={brandId}
            videoId={selectedVideoId}
            open={showVideoDetailsDialog}
            onOpenChange={setShowVideoDetailsDialog}
            onSuccess={refreshVideos}
          />
        </>
      )}

      {/* Channel Header */}
      <div className="border-b bg-card">
        {channelInfo.bannerImageUrl && (
          <div
            className="h-32 md:h-48 bg-cover bg-center"
            style={{ backgroundImage: `url(${channelInfo.bannerImageUrl})` }}
          />
        )}
        <div className="p-6">
          <div className="flex items-start gap-4">
            {channelInfo.thumbnails?.default?.url && (
              <img
                src={channelInfo.thumbnails.default.url}
                alt={channelInfo.title}
                className="w-20 h-20 rounded-full border-4 border-background"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold truncate">{channelInfo.title}</h1>
                <a
                  href={`https://youtube.com/${channelInfo.customUrl || `channel/${channelInfo.id}`}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              {channelInfo.customUrl && (
                <p className="text-sm text-muted-foreground mb-2">
                  youtube.com/{channelInfo.customUrl}
                </p>
              )}
              {channelInfo.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {channelInfo.description}
                </p>
              )}
            </div>
            <Button className="flex-shrink-0" onClick={() => setShowUploadDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Video
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3 p-6 border-b">
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
            <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
              <Users className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatViewCount(statistics?.subscriberCount || channelInfo.subscriberCount)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total subscribers
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
              <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatViewCount(statistics?.viewCount || channelInfo.viewCount)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Lifetime views
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Videos</CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
              <Video className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.videoCount || channelInfo.videoCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total videos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Videos Section */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        {videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Youtube className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-muted-foreground">No videos found</p>
            <p className="text-sm text-muted-foreground mt-2">
              {searchQuery ? "Try a different search query" : "Upload your first video to get started"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {videos.map((video) => (
                <Card
                  key={video.id}
                  className="border-0 shadow-sm overflow-hidden group cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleVideoClick(video.id)}
                >
                  <div className="relative aspect-video bg-muted">
                    {video.thumbnails?.medium?.url && (
                      <img
                        src={video.thumbnails.medium.url}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                      {video.duration}
                    </div>
                  </div>
                  <CardHeader className="p-4">
                    <CardTitle className="text-sm line-clamp-2 leading-snug">
                      {video.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {formatViewCount(video.viewCount)}
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {formatViewCount(video.likeCount)}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(video.publishedAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {nextPageToken && (
              <div className="flex justify-center mt-8">
                <Button
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  variant="outline"
                >
                  {isLoadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoadingMore ? "Loading..." : "Load More"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
