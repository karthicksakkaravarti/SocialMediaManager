"use client"

import { useSearchParams } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, FileVideo } from "lucide-react"
import { VideoScriptForm } from "@/components/video-script-form"

export default function NewScriptPage() {
  const searchParams = useSearchParams()
  const brandId = searchParams.get("brand")

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
        <div className="flex items-center gap-2">
          <FileVideo className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold">Create Video Script</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create a new video generation script
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <VideoScriptForm brandId={brandId} />
        </div>
      </div>
    </div>
  )
}
