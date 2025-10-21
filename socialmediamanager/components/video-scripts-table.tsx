"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { MoreVertical, Eye, Edit, Trash2, Play, Calendar } from "lucide-react"
import { format } from "date-fns"

type Script = {
  id: string
  title: string
  status: string
  scheduledAt?: Date | string | null
  createdAt: Date | string
  jobs?: any[]
  _count?: {
    jobs: number
    publishes: number
  }
}

type VideoScriptsTableProps = {
  scripts: Script[]
  brandId: string
  onRefresh?: () => void
}

export function VideoScriptsTable({ scripts, brandId, onRefresh }: VideoScriptsTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; label: string }> = {
      draft: { variant: "secondary", label: "Draft" },
      scheduled: { variant: "default", label: "Scheduled" },
      processing: { variant: "default", label: "Processing" },
      completed: { variant: "default", label: "Completed" },
      failed: { variant: "destructive", label: "Failed" },
    }

    const config = statusConfig[status] || { variant: "secondary", label: status }
    return (
      <Badge variant={config.variant as any} className="capitalize">
        {config.label}
      </Badge>
    )
  }

  const handleDelete = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/video-generator/scripts/${deleteId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setDeleteId(null)
        if (onRefresh) onRefresh()
      }
    } catch (error) {
      console.error("Failed to delete script:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleGenerate = async (scriptId: string) => {
    try {
      await fetch("/api/video-generator/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptId }),
      })

      if (onRefresh) onRefresh()
    } catch (error) {
      console.error("Failed to generate video:", error)
    }
  }

  if (scripts.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground">No scripts found</p>
        <p className="text-sm text-muted-foreground mt-2">
          Create your first video script to get started
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead>Jobs</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scripts.map((script) => (
              <TableRow key={script.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/dashboard/video-generator/scripts/${script.id}?brand=${brandId}`}
                    className="hover:underline"
                  >
                    {script.title}
                  </Link>
                </TableCell>
                <TableCell>{getStatusBadge(script.status)}</TableCell>
                <TableCell>
                  {script.scheduledAt ? (
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(script.scheduledAt), "PPp")}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {script._count?.jobs || script.jobs?.length || 0}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(script.createdAt), "PP")}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/dashboard/video-generator/scripts/${script.id}?brand=${brandId}`}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/dashboard/video-generator/scripts/${script.id}/edit?brand=${brandId}`}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      {(script.status === "draft" || script.status === "scheduled") && (
                        <DropdownMenuItem onClick={() => handleGenerate(script.id)}>
                          <Play className="h-4 w-4 mr-2" />
                          Generate Now
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => setDeleteId(script.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Script?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the script and all associated jobs and publish records.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
