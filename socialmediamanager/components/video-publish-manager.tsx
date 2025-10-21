"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Loader2, Upload, Youtube } from "lucide-react"

type Publish = {
  id: string
  status: string
  socialAccount: {
    id: string
    platform: string
    platformUsername: string | null
  }
}

type VideoPublishManagerProps = {
  publishes: Publish[]
  onRefresh?: () => void
}

export function VideoPublishManager({ publishes, onRefresh }: VideoPublishManagerProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isApproving, setIsApproving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const pendingPublishes = publishes.filter((p) => p.status === "pending_approval")

  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleToggleAll = () => {
    if (selectedIds.length === pendingPublishes.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(pendingPublishes.map((p) => p.id))
    }
  }

  const handleApprove = async () => {
    if (selectedIds.length === 0) {
      setError("Please select at least one channel to approve")
      return
    }

    setIsApproving(true)
    setError(null)

    try {
      const response = await fetch("/api/video-generator/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publishIds: selectedIds }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setSelectedIds([])
        setTimeout(() => {
          setSuccess(false)
          if (onRefresh) onRefresh()
        }, 2000)
      } else {
        setError(data.error || "Failed to approve publishes")
      }
    } catch (err: any) {
      setError(err.message || "Failed to approve publishes")
    } finally {
      setIsApproving(false)
    }
  }

  if (pendingPublishes.length === 0) {
    return (
      <Alert>
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription>
          No pending approvals. All channels are approved or already published.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Approvals</CardTitle>
        <CardDescription>
          Approve channels to publish the generated video
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950/50">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Publishing to selected channels...
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
            <Checkbox
              checked={selectedIds.length === pendingPublishes.length}
              onCheckedChange={handleToggleAll}
              disabled={isApproving}
            />
            <span className="text-sm font-medium">
              Select All ({pendingPublishes.length} channels)
            </span>
          </div>

          {pendingPublishes.map((publish) => (
            <div
              key={publish.id}
              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <Checkbox
                checked={selectedIds.includes(publish.id)}
                onCheckedChange={() => handleToggle(publish.id)}
                disabled={isApproving}
              />
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-600 text-white flex-shrink-0">
                <Youtube className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {publish.socialAccount.platformUsername || "YouTube Channel"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {publish.socialAccount.platform}
                </p>
              </div>
              <Badge variant="secondary">Pending</Badge>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleApprove}
            disabled={isApproving || selectedIds.length === 0}
            className="flex-1"
          >
            {isApproving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Upload className="mr-2 h-4 w-4" />
            Approve Selected ({selectedIds.length})
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
