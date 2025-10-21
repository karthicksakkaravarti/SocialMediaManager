import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { submitVideoGeneration, extractVideoGenerationData } from "@/lib/video-generator"

export async function GET(request: Request) {
  try {
    // Verify cron secret for security
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get("secret") || request.headers.get("authorization")?.replace("Bearer ", "")

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find all scripts that are scheduled and due
    const now = new Date()
    const scheduledScripts = await prisma.videoScript.findMany({
      where: {
        status: "scheduled",
        scheduledAt: {
          lte: now,
        },
      },
    })

    const results = []

    for (const script of scheduledScripts) {
      try {
        // Extract video generation data
        const videoRequest = extractVideoGenerationData(script.scriptJson)

        // Submit to external API
        const apiResponse = await submitVideoGeneration(videoRequest)

        // Create VideoJob record
        await prisma.videoJob.create({
          data: {
            scriptId: script.id,
            jobId: apiResponse.job_id,
            status: apiResponse.status,
            progress: 0,
          },
        })

        // Update script status
        await prisma.videoScript.update({
          where: { id: script.id },
          data: { status: "processing" },
        })

        results.push({
          scriptId: script.id,
          jobId: apiResponse.job_id,
          status: "success",
        })
      } catch (error: any) {
        console.error(`Failed to process script ${script.id}:`, error)

        // Update script to failed
        await prisma.videoScript.update({
          where: { id: script.id },
          data: { status: "failed" },
        })

        results.push({
          scriptId: script.id,
          status: "failed",
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      processed: results.length,
      results,
      message: `Processed ${results.length} scheduled scripts`,
    })
  } catch (error: any) {
    console.error("Error in cron job:", error)
    return NextResponse.json(
      { error: error.message || "Failed to process cron job" },
      { status: 500 }
    )
  }
}
