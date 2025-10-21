"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2, XCircle, Play, Download, Upload } from "lucide-react"

type VideoJobStatusProps = {
  scriptId: string
  jobId: string
  autoRefresh?: boolean
  onPublish?: () => void
}

export function VideoJobStatus({
  scriptId,
  jobId,
  autoRefresh = true,
  onPublish,
}: VideoJobStatusProps) {
  const [job, setJob] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchJobStatus = async () => {
    try {
      const response = await fetch(`/api/video-generator/jobs/${jobId}`)
      const data = await response.json()

      if (response.ok) {
        setJob(data.job)
        setError(null)
      } else {
        setError(data.error || "Failed to fetch job status")
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch job status")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchJobStatus()

    // Auto-refresh every 5 seconds if job is processing
    if (autoRefresh) {
      const interval = setInterval(() => {
        if (job?.status === "processing" || job?.status === "pending") {
          fetchJobStatus()
        }
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [jobId, autoRefresh, job?.status])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error || !job) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>{error || "Job not found"}</AlertDescription>
      </Alert>
    )
  }

  const getStatusIcon = () => {
    switch (job.status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case "failed":
        return <XCircle className="h-5 w-5 text-destructive" />
      case "processing":
      case "pending":
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />
      default:
        return <Play className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStatusBadge = () => {
    const statusConfig: Record<string, { variant: any; label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      processing: { variant: "default", label: "Processing" },
      completed: { variant: "default", label: "Completed" },
      failed: { variant: "destructive", label: "Failed" },
      cancelled: { variant: "secondary", label: "Cancelled" },
    }

    const config = statusConfig[job.status] || { variant: "secondary", label: job.status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <CardTitle className="text-lg">Video Generation</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        <CardDescription>Job ID: {jobId}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        {(job.status === "processing" || job.status === "pending") && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(job.progress || 0)}%</span>
            </div>
            <Progress value={job.progress || 0} />
            {job.currentScene && job.totalScenes && (
              <p className="text-xs text-muted-foreground">
                Scene {job.currentScene} of {job.totalScenes}
              </p>
            )}
          </div>
        )}

        {/* Error Message */}
        {job.status === "failed" && job.errorMessage && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{job.errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Completed Video */}
        {job.status === "completed" && job.videoUrl && (
          <div className="space-y-3">
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/50">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Video generated successfully!
                {job.duration && ` Duration: ${Math.round(job.duration)}s`}
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <a href={job.videoUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Download Video
                </a>
              </Button>
              {onPublish && (
                <Button onClick={onPublish}>
                  <Upload className="h-4 w-4 mr-2" />
                  Publish to Channels
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Created: {new Date(job.createdAt).toLocaleString()}</p>
          <p>Updated: {new Date(job.updatedAt).toLocaleString()}</p>
        </div>
      </CardContent>
    </Card>
  )
}
