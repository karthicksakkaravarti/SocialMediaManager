"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Video, Settings, AlertCircle } from "lucide-react"
import { VideoScriptsTable } from "@/components/video-scripts-table"
import { VideoConfigForm } from "@/components/video-config-form"

export default function VideoGeneratorPage() {
  const searchParams = useSearchParams()
  const brandId = searchParams.get("brand")

  const [scripts, setScripts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (brandId) {
      fetchScripts()
    }
  }, [brandId])

  const fetchScripts = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/video-generator/scripts?brandId=${brandId}`)
      const data = await response.json()

      if (response.ok) {
        setScripts(data.scripts)
      } else {
        setError(data.error || "Failed to load scripts")
      }
    } catch (err: any) {
      setError(err.message || "Failed to load scripts")
    } finally {
      setIsLoading(false)
    }
  }

  if (!brandId) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No brand selected. Please select a brand first.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Video className="h-6 w-6" />
              Video Generator
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create, schedule, and publish AI-generated videos
            </p>
          </div>
          <Button asChild>
            <Link href={`/dashboard/video-generator/scripts/new?brand=${brandId}`}>
              <Plus className="h-4 w-4 mr-2" />
              Create Script
            </Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="scripts" className="space-y-6">
          <TabsList>
            <TabsTrigger value="scripts">Scripts</TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scripts" className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading scripts...</div>
            ) : (
              <VideoScriptsTable
                scripts={scripts}
                brandId={brandId}
                onRefresh={fetchScripts}
              />
            )}
          </TabsContent>

          <TabsContent value="settings">
            <VideoConfigForm brandId={brandId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
