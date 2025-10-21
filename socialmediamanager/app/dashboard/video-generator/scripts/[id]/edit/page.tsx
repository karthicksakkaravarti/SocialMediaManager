"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Edit2, Loader2 } from "lucide-react"
import { VideoScriptForm } from "@/components/video-script-form"

export default function EditScriptPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams()
  const brandId = searchParams.get("brand")
  const { id } = params

  const [script, setScript] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
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

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b bg-card p-6">
        <div className="flex items-center gap-2">
          <Edit2 className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold">Edit Video Script</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Update your video generation script
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <VideoScriptForm
            brandId={brandId}
            initialData={{
              id: script.id,
              title: script.title,
              scriptJson: script.scriptJson,
              scheduledAt: script.scheduledAt,
            }}
          />
        </div>
      </div>
    </div>
  )
}
