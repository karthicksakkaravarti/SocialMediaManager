"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react"

type VideoConfigFormProps = {
  brandId: string
}

export function VideoConfigForm({ brandId }: VideoConfigFormProps) {
  const [requireApproval, setRequireApproval] = useState(true)
  const [autoPublish, setAutoPublish] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [brandId])

  const fetchConfig = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/video-generator/config?brandId=${brandId}`)
      const data = await response.json()

      if (response.ok && data.config) {
        setRequireApproval(data.config.requireApproval ?? true)
        setAutoPublish(data.config.autoPublish ?? false)
      }
    } catch (err: any) {
      setError(err.message || "Failed to load configuration")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch("/api/video-generator/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId,
          requireApproval,
          autoPublish,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(data.error || "Failed to save configuration")
      }
    } catch (err: any) {
      setError(err.message || "Failed to save configuration")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Publishing Configuration</CardTitle>
        <CardDescription>
          Configure how generated videos are published to your channels
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950/50">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Configuration saved successfully!
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {/* Require Approval */}
          <div className="flex items-start justify-between space-x-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor="require-approval" className="text-base">
                Require Approval
              </Label>
              <p className="text-sm text-muted-foreground">
                Manually approve each video before publishing to channels. When disabled, videos
                will be published immediately after generation.
              </p>
            </div>
            <Switch
              id="require-approval"
              checked={requireApproval}
              onCheckedChange={setRequireApproval}
              disabled={isSaving}
            />
          </div>

          {/* Auto Publish */}
          <div className="flex items-start justify-between space-x-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor="auto-publish" className="text-base">
                Auto-Publish on Completion
              </Label>
              <p className="text-sm text-muted-foreground">
                Automatically publish to all channels when video generation completes. Only works
                when "Require Approval" is disabled.
              </p>
            </div>
            <Switch
              id="auto-publish"
              checked={autoPublish}
              onCheckedChange={setAutoPublish}
              disabled={isSaving || requireApproval}
            />
          </div>
        </div>

        {requireApproval && autoPublish && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Auto-publish is disabled when approval is required. Disable "Require Approval" to
              enable auto-publishing.
            </AlertDescription>
          </Alert>
        )}

        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Configuration
        </Button>
      </CardContent>
    </Card>
  )
}
