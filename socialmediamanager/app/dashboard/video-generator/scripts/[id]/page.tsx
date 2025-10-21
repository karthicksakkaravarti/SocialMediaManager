"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  AlertCircle,
  ArrowLeft,
  Edit,
  Play,
  Upload,
  Loader2,
  Calendar,
  FileJson,
} from "lucide-react"
import { VideoJobStatus } from "@/components/video-job-status"
import { VideoPublishManager } from "@/components/video-publish-manager"
import { VideoPublishStatus } from "@/components/video-publish-status"
import { format } from "date-fns"

export default function ScriptDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const brandId = searchParams.get("brand")
  const { id } = params

  const [script, setScript] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchScript()
  }, [id])

  const fetchScript = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/video-generator/scripts/${id}`)
      const data = await response.json()

      if (response.ok) {
        setScript(data.script)
      } else {
        setError(data.error || "Failed to load script")
      }
    } catch (err: any) {
      setError(err.message || "Failed to load script")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch("/api/video-generator/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptId: id }),
      })

      if (response.ok) {
        await fetchScript()
      }
    } catch (err) {
      console.error("Failed to generate video:", err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePublish = async () => {
    setIsPublishing(true)
    try {
      const response = await fetch("/api/video-generator/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptId: id }),
      })

      if (response.ok) {
        await fetchScript()
      }
    } catch (err) {
      console.error("Failed to publish video:", err)
    } finally {
      setIsPublishing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !script) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Script not found"}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const latestJob = script.jobs?.[0]
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; label: string }> = {
      draft: { variant: "secondary", label: "Draft" },
      scheduled: { variant: "default", label: "Scheduled" },
      processing: { variant: "default", label: "Processing" },
      completed: { variant: "default", label: "Completed" },
      failed: { variant: "destructive", label: "Failed" },
    }

    const config = statusConfig[status] || { variant: "secondary", label: status }
    return <Badge variant={config.variant as any}>{config.label}</Badge>
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b bg-card p-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{script.title}</h1>
              {getStatusBadge(script.status)}
            </div>
            <p className="text-sm text-muted-foreground">
              Created {format(new Date(script.createdAt), "PPp")}
            </p>
          </div>
          <div className="flex gap-2">
            {(script.status === "draft" || script.status === "scheduled") && (
              <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Play className="h-4 w-4 mr-2" />
                Generate Now
              </Button>
            )}
            {script.status === "completed" && (
              <Button onClick={handlePublish} disabled={isPublishing}>
                {isPublishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Upload className="h-4 w-4 mr-2" />
                Publish to Channels
              </Button>
            )}
            <Button variant="outline" asChild>
              <a href={`/dashboard/video-generator/scripts/${id}/edit?brand=${brandId}`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </a>
            </Button>
          </div>
        </div>

        {script.scheduledAt && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Scheduled for {format(new Date(script.scheduledAt), "PPp")}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Latest Job Status */}
          {latestJob && (
            <VideoJobStatus
              scriptId={id}
              jobId={latestJob.jobId}
              onPublish={handlePublish}
            />
          )}

          {/* Publish Management */}
          {script.publishes && script.publishes.length > 0 && (
            <>
              {script.publishes.some((p: any) => p.status === "pending_approval") && (
                <VideoPublishManager
                  publishes={script.publishes}
                  onRefresh={fetchScript}
                />
              )}

              <VideoPublishStatus publishes={script.publishes} onRefresh={fetchScript} />
            </>
          )}

          {/* Script Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileJson className="h-5 w-5" />
                Script Details
              </CardTitle>
              <CardDescription>
                View the complete video generation script
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-96">
                {JSON.stringify(script.scriptJson, null, 2)}
              </pre>
            </CardContent>
          </Card>

          {/* Jobs History */}
          {script.jobs && script.jobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Generation Jobs</CardTitle>
                <CardDescription>History of generation attempts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {script.jobs.map((job: any) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">Job {job.jobId}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(job.createdAt), "PPp")}
                        </p>
                      </div>
                      <Badge variant={job.status === "completed" ? "default" : "secondary"}>
                        {job.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
