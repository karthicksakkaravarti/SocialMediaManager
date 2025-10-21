import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { submitVideoGeneration, extractVideoGenerationData } from "@/lib/video-generator"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { scriptId } = body

    if (!scriptId) {
      return NextResponse.json(
        { error: "Script ID is required" },
        { status: 400 }
      )
    }

    // Get script and verify ownership
    const script = await prisma.videoScript.findUnique({
      where: { id: scriptId },
      include: {
        brand: { select: { userId: true } },
      },
    })

    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 })
    }

    if (script.brand.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Extract video generation data from script JSON
    const videoRequest = extractVideoGenerationData(script.scriptJson)

    // Submit to external API
    const apiResponse = await submitVideoGeneration(videoRequest)

    // Create VideoJob record
    const job = await prisma.videoJob.create({
      data: {
        scriptId,
        jobId: apiResponse.job_id,
        status: apiResponse.status,
        progress: 0,
      },
    })

    // Update script status
    await prisma.videoScript.update({
      where: { id: scriptId },
      data: { status: "processing" },
    })

    return NextResponse.json({
      job,
      message: "Video generation started successfully",
      statusUrl: `/api/video-generator/jobs/${apiResponse.job_id}`,
    })
  } catch (error: any) {
    console.error("Error generating video:", error)
    return NextResponse.json(
      { error: error.message || "Failed to start video generation" },
      { status: 500 }
    )
  }
}
