"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AlertCircle, CalendarIcon, Loader2, CheckCircle2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

type VideoScriptFormProps = {
  brandId: string
  initialData?: {
    id?: string
    title: string
    scriptJson: any
    scheduledAt?: Date
  }
  onSuccess?: () => void
}

export function VideoScriptForm({ brandId, initialData, onSuccess }: VideoScriptFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initialData?.title || "")
  const [scriptJson, setScriptJson] = useState(
    initialData?.scriptJson ? JSON.stringify(initialData.scriptJson, null, 2) : ""
  )
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(
    initialData?.scheduledAt ? new Date(initialData.scheduledAt) : undefined
  )
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSaveDraft = async () => {
    await handleSave("draft")
  }

  const handleSchedule = async () => {
    if (!scheduledDate) {
      setError("Please select a schedule date and time")
      return
    }
    await handleSave("scheduled")
  }

  const handleSave = async (status: string) => {
    if (!title || !scriptJson) {
      setError("Title and script JSON are required")
      return
    }

    // Validate JSON
    let parsedJson
    try {
      parsedJson = JSON.parse(scriptJson)
    } catch (e) {
      setError("Invalid JSON format. Please check your script.")
      return
    }

    setIsSaving(true)
    setError("")

    try {
      const url = initialData?.id
        ? `/api/video-generator/scripts/${initialData.id}`
        : `/api/video-generator/scripts`

      const response = await fetch(url, {
        method: initialData?.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId,
          title,
          scriptJson: parsedJson,
          status,
          scheduledAt: status === "scheduled" ? scheduledDate?.toISOString() : null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          if (onSuccess) onSuccess()
          router.push(`/dashboard/video-generator?brand=${brandId}`)
        }, 1500)
      } else {
        setError(data.error || "Failed to save script")
      }
    } catch (error: any) {
      setError(error.message || "Failed to save script")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
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
            Script saved successfully! Redirecting...
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Video Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter video title"
          disabled={isSaving}
          maxLength={200}
        />
        <p className="text-xs text-muted-foreground">{title.length}/200 characters</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="script">Script JSON *</Label>
        <Textarea
          id="script"
          value={scriptJson}
          onChange={(e) => setScriptJson(e.target.value)}
          placeholder='Paste your video script JSON here...'
          disabled={isSaving}
          rows={20}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Paste the complete script JSON including title, scenes, background_music, and media sections
        </p>
      </div>

      <div className="space-y-2">
        <Label>Schedule (Optional)</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !scheduledDate && "text-muted-foreground"
              )}
              disabled={isSaving}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {scheduledDate ? format(scheduledDate, "PPP p") : "Pick a date and time"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={scheduledDate}
              onSelect={setScheduledDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <p className="text-xs text-muted-foreground">
          Leave empty to save as draft, or select a date to schedule automatic generation
        </p>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          variant="outline"
          onClick={handleSaveDraft}
          disabled={isSaving || success}
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save as Draft
        </Button>
        <Button onClick={handleSchedule} disabled={isSaving || success}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {scheduledDate ? "Schedule Generation" : "Generate Now"}
        </Button>
      </div>
    </div>
  )
}
