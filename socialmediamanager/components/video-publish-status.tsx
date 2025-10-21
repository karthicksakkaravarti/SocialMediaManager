"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Youtube, CheckCircle2, XCircle, Clock, ExternalLink, Loader2, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Publish = {
  id: string
  status: string
  youtubeVideoId?: string | null
  publishedAt?: Date | string | null
  errorMessage?: string | null
  socialAccount: {
    id: string
    platform: string
    platformUsername: string | null
  }
}

type VideoPublishStatusProps = {
  publishes: Publish[]
  onRefresh?: () => void
}

export function VideoPublishStatus({ publishes, onRefresh }: VideoPublishStatusProps) {
  const { toast } = useToast()
  const [retrying, setRetrying] = useState<Set<string>>(new Set())
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "published":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case "failed":
        return <XCircle className="h-5 w-5 text-destructive" />
      case "publishing":
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />
      case "pending_approval":
        return <Clock className="h-5 w-5 text-amber-600" />
      case "approved":
        return <Clock className="h-5 w-5 text-blue-600" />
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; label: string }> = {
      pending_approval: { variant: "secondary", label: "Pending Approval" },
      approved: { variant: "default", label: "Approved" },
      publishing: { variant: "default", label: "Publishing" },
      published: { variant: "default", label: "Published" },
      failed: { variant: "destructive", label: "Failed" },
    }

    const config = statusConfig[status] || { variant: "secondary", label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const handleRetry = async (publishId: string) => {
    setRetrying((prev) => new Set(prev).add(publishId))

    try {
      const response = await fetch("/api/video-generator/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publishIds: [publishId] }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Retry Started",
          description: "Re-uploading video to YouTube channel...",
        })

        // Refresh data after a short delay
        setTimeout(() => {
          onRefresh?.()
        }, 2000)
      } else {
        toast({
          title: "Retry Failed",
          description: data.error || "Failed to retry upload",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to retry upload",
        variant: "destructive",
      })
    } finally {
      setRetrying((prev) => {
        const next = new Set(prev)
        next.delete(publishId)
        return next
      })
    }
  }

  if (publishes.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No publish records found
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Publish Status</CardTitle>
        <CardDescription>Status for each connected YouTube channel</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {publishes.map((publish) => (
          <div
            key={publish.id}
            className="flex items-start gap-3 p-4 border rounded-lg"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-600 text-white flex-shrink-0 mt-1">
              <Youtube className="h-5 w-5" />
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {publish.socialAccount.platformUsername || "YouTube Channel"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {publish.socialAccount.platform}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {getStatusIcon(publish.status)}
                  {getStatusBadge(publish.status)}
                </div>
              </div>

              {/* Published Video Link */}
              {publish.status === "published" && publish.youtubeVideoId && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a
                      href={`https://youtube.com/watch?v=${publish.youtubeVideoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View on YouTube
                    </a>
                  </Button>
                  {publish.publishedAt && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(publish.publishedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              )}

              {/* Error Message with Retry Button */}
              {publish.status === "failed" && (
                <div className="space-y-2">
                  {publish.errorMessage && (
                    <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                      {publish.errorMessage}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRetry(publish.id)}
                    disabled={retrying.has(publish.id)}
                  >
                    {retrying.has(publish.id) ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Retry Upload
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Pending/Approved States */}
              {(publish.status === "pending_approval" || publish.status === "approved") && (
                <p className="text-xs text-muted-foreground">
                  {publish.status === "pending_approval"
                    ? "Waiting for approval to publish"
                    : "Approved - will publish shortly"}
                </p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
