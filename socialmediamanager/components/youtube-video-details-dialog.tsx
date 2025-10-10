"use client"

import { useState, useEffect } from "react"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  Trash2,
  ExternalLink,
  Eye,
  ThumbsUp,
  MessageSquare,
  Calendar
} from "lucide-react"
import { formatViewCount } from "@/lib/youtube-utils"

type VideoDetails = {
  id: string
  title: string
  description: string
  thumbnails: any
  publishedAt: string
  viewCount: number
  likeCount: number
  commentCount: number
  duration: string
  privacyStatus: string
  tags?: string[]
}

type YouTubeVideoDetailsDialogProps = {
  brandId: string
  videoId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function YouTubeVideoDetailsDialog({
  brandId,
  videoId,
  open,
  onOpenChange,
  onSuccess,
}: YouTubeVideoDetailsDialogProps) {
  const [video, setVideo] = useState<VideoDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [error, setError] = useState("")

  // Edit state
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editPrivacyStatus, setEditPrivacyStatus] = useState("")
  const [editTags, setEditTags] = useState("")

  // Fetch video details
  useEffect(() => {
    if (open && videoId) {
      fetchVideoDetails()
    }
  }, [open, videoId])

  const fetchVideoDetails = async () => {
    if (!videoId) return

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(
        `/api/youtube/videos/${videoId}?brandId=${brandId}`
      )
      if (!response.ok) {
        throw new Error("Failed to fetch video details")
      }
      const data = await response.json()
      setVideo(data)
      setEditTitle(data.title)
      setEditDescription(data.description || "")
      setEditPrivacyStatus(data.privacyStatus)
      setEditTags(data.tags?.join(", ") || "")
    } catch (err: any) {
      setError(err.message || "Failed to load video details")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!videoId) return

    setIsSaving(true)
    setError("")

    try {
      const response = await fetch(`/api/youtube/videos/${videoId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brandId,
          title: editTitle,
          description: editDescription,
          tags: editTags.split(",").map((tag) => tag.trim()).filter(Boolean),
          privacyStatus: editPrivacyStatus,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update video")
      }

      const data = await response.json()
      setVideo(data)
      setIsEditing(false)
      if (onSuccess) onSuccess()
    } catch (err: any) {
      setError(err.message || "Failed to update video")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!videoId) return

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/youtube/videos/${videoId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ brandId }),
      })

      if (!response.ok) {
        throw new Error("Failed to delete video")
      }

      setShowDeleteDialog(false)
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (err: any) {
      setError(err.message || "Failed to delete video")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancel = () => {
    if (video) {
      setEditTitle(video.title)
      setEditDescription(video.description || "")
      setEditPrivacyStatus(video.privacyStatus)
      setEditTags(video.tags?.join(", ") || "")
    }
    setIsEditing(false)
    setError("")
  }

  const handleClose = () => {
    if (!isSaving && !isDeleting) {
      onOpenChange(false)
      setIsEditing(false)
      setError("")
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Video" : "Video Details"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Update video information" : "View video details and statistics"}
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : video ? (
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Video Thumbnail */}
              {!isEditing && video.thumbnails?.medium?.url && (
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                  <img
                    src={video.thumbnails.medium.url}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {isEditing ? (
                <>
                  {/* Edit Form */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-title">Title *</Label>
                      <Input
                        id="edit-title"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        disabled={isSaving}
                        maxLength={100}
                      />
                      <p className="text-xs text-muted-foreground">
                        {editTitle.length}/100 characters
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-description">Description</Label>
                      <Textarea
                        id="edit-description"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        disabled={isSaving}
                        rows={6}
                        maxLength={5000}
                      />
                      <p className="text-xs text-muted-foreground">
                        {editDescription.length}/5000 characters
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-privacy">Privacy</Label>
                      <Select
                        value={editPrivacyStatus}
                        onValueChange={setEditPrivacyStatus}
                        disabled={isSaving}
                      >
                        <SelectTrigger id="edit-privacy">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="private">Private</SelectItem>
                          <SelectItem value="unlisted">Unlisted</SelectItem>
                          <SelectItem value="public">Public</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
                      <Input
                        id="edit-tags"
                        value={editTags}
                        onChange={(e) => setEditTags(e.target.value)}
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* View Mode */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="text-lg font-semibold leading-tight">{video.title}</h3>
                        <a
                          href={`https://youtube.com/watch?v=${video.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground flex-shrink-0"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={video.privacyStatus === "public" ? "default" : "secondary"}>
                          {video.privacyStatus}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(video.publishedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <Separator />

                    {/* Statistics */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex flex-col items-center p-3 rounded-lg bg-muted">
                        <Eye className="h-5 w-5 text-muted-foreground mb-1" />
                        <p className="text-lg font-semibold">{formatViewCount(video.viewCount)}</p>
                        <p className="text-xs text-muted-foreground">Views</p>
                      </div>
                      <div className="flex flex-col items-center p-3 rounded-lg bg-muted">
                        <ThumbsUp className="h-5 w-5 text-muted-foreground mb-1" />
                        <p className="text-lg font-semibold">{formatViewCount(video.likeCount)}</p>
                        <p className="text-xs text-muted-foreground">Likes</p>
                      </div>
                      <div className="flex flex-col items-center p-3 rounded-lg bg-muted">
                        <MessageSquare className="h-5 w-5 text-muted-foreground mb-1" />
                        <p className="text-lg font-semibold">{formatViewCount(video.commentCount)}</p>
                        <p className="text-xs text-muted-foreground">Comments</p>
                      </div>
                    </div>

                    {video.description && (
                      <>
                        <Separator />
                        <div>
                          <Label className="text-base">Description</Label>
                          <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                            {video.description}
                          </p>
                        </div>
                      </>
                    )}

                    {video.tags && video.tags.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <Label className="text-base">Tags</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {video.tags.map((tag, index) => (
                              <Badge key={index} variant="outline">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Video not found</p>
            </div>
          )}

          <DialogFooter className="gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving || !editTitle}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <div className="flex-1" />
                <Button
                  variant="outline"
                  onClick={handleClose}
                >
                  Close
                </Button>
                <Button onClick={() => setIsEditing(true)}>
                  Edit Video
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the video from YouTube. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isDeleting ? "Deleting..." : "Delete Video"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
