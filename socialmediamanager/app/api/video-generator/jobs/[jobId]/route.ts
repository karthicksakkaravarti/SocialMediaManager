import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getJobStatus } from "@/lib/video-generator"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { jobId } = await params

    // Get job from database
    const job = await prisma.videoJob.findUnique({
      where: { jobId },
      include: {
        script: {
          include: {
            brand: { select: { userId: true } },
          },
        },
      },
    })

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Verify ownership
    if (job.script.brand.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch latest status from external API
    const apiStatus = await getJobStatus(jobId)

    // Update job in database
    const updatedJob = await prisma.videoJob.update({
      where: { jobId },
      data: {
        status: apiStatus.status,
        progress: apiStatus.progress || 0,
        currentScene: apiStatus.current_scene,
        totalScenes: apiStatus.total_scenes,
        videoUrl: apiStatus.video_url,
        videoPath: apiStatus.video_path,
        duration: apiStatus.duration,
        errorMessage: apiStatus.error_message,
      },
    })

    // If completed, update script
    if (apiStatus.status === "completed" && apiStatus.video_url) {
      await prisma.videoScript.update({
        where: { id: job.scriptId },
        data: {
          status: "completed",
          generatedAt: new Date(),
          videoUrl: apiStatus.video_url,
          videoPath: apiStatus.video_path,
          duration: apiStatus.duration,
        },
      })
    }

    // If failed, update script
    if (apiStatus.status === "failed") {
      await prisma.videoScript.update({
        where: { id: job.scriptId },
        data: { status: "failed" },
      })
    }

    return NextResponse.json({ job: updatedJob, apiStatus })
  } catch (error: any) {
    console.error("Error fetching job status:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch job status" },
      { status: 500 }
    )
  }
}
