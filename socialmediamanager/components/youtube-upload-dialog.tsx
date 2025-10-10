"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, Loader2, AlertCircle, Upload, X } from "lucide-react"

type YouTubeUploadDialogProps = {
  brandId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function YouTubeUploadDialog({
  brandId,
  open,
  onOpenChange,
  onSuccess,
}: YouTubeUploadDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [privacyStatus, setPrivacyStatus] = useState("private")
  const [tags, setTags] = useState("")
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file type
      if (!file.type.startsWith("video/")) {
        setError("Please select a valid video file")
        return
      }

      // Check file size (limit to 2GB for now)
      const maxSize = 2 * 1024 * 1024 * 1024 // 2GB
      if (file.size > maxSize) {
        setError("Video file must be less than 2GB")
        return
      }

      setVideoFile(file)
      setError("")

      // Auto-fill title from filename if empty
      if (!title) {
        const filename = file.name.replace(/\.[^/.]+$/, "")
        setTitle(filename)
      }
    }
  }

  const handleUpload = async () => {
    if (!videoFile || !title) {
      setError("Please select a video and enter a title")
      return
    }

    setIsUploading(true)
    setError("")
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append("brandId", brandId)
      formData.append("title", title)
      formData.append("description", description)
      formData.append("privacyStatus", privacyStatus)
      formData.append("tags", tags)
      formData.append("video", videoFile)

      // Simulate progress (real progress would require a different approach)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 500)

      const response = await fetch("/api/youtube/upload", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          onOpenChange(false)
          if (onSuccess) onSuccess()
          // Reset state
          resetForm()
        }, 2000)
      } else {
        setError(data.error || "Failed to upload video")
        setUploadProgress(0)
      }
    } catch (error) {
      setError("Failed to upload video")
      setUploadProgress(0)
    } finally {
      setIsUploading(false)
    }
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setPrivacyStatus("private")
    setTags("")
    setVideoFile(null)
    setSuccess(false)
    setError("")
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleClose = () => {
    if (!isUploading) {
      onOpenChange(false)
      resetForm()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload Video to YouTube</DialogTitle>
          <DialogDescription>
            Upload a new video to your YouTube channel
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950/50">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Video uploaded successfully! Processing may take a few minutes.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Video File Input */}
            <div className="space-y-2">
              <Label htmlFor="video">Video File *</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="video"
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {videoFile ? "Change Video" : "Select Video"}
                </Button>
                {videoFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setVideoFile(null)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ""
                      }
                    }}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {videoFile && (
                <p className="text-sm text-muted-foreground">
                  {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter video title"
                disabled={isUploading}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                {title.length}/100 characters
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter video description"
                disabled={isUploading}
                rows={4}
                maxLength={5000}
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/5000 characters
              </p>
            </div>

            {/* Privacy Status */}
            <div className="space-y-2">
              <Label htmlFor="privacy">Privacy</Label>
              <Select
                value={privacyStatus}
                onValueChange={setPrivacyStatus}
                disabled={isUploading}
              >
                <SelectTrigger id="privacy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="unlisted">Unlisted</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="gaming, tutorial, tips"
                disabled={isUploading}
              />
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Uploading...</span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {!success && (
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={isUploading || !videoFile || !title}>
              {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isUploading ? "Uploading..." : "Upload Video"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
