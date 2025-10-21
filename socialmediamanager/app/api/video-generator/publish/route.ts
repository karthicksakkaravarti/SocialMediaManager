import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { publishToAllChannels } from "@/lib/video-publisher"

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

    // Check if script has completed job
    if (script.status !== "completed") {
      return NextResponse.json(
        { error: "Script must be completed before publishing" },
        { status: 400 }
      )
    }

    // Publish to all channels
    const result = await publishToAllChannels(scriptId)

    return NextResponse.json({
      success: true,
      ...result,
      message: result.requireApproval
        ? "Publish records created. Approval required before publishing."
        : "Publishing to all channels...",
    })
  } catch (error: any) {
    console.error("Error publishing video:", error)
    return NextResponse.json(
      { error: error.message || "Failed to publish video" },
      { status: 500 }
    )
  }
}

// GET - Get publish status for a script
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const scriptId = searchParams.get("scriptId")

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
        publishes: {
          include: {
            socialAccount: {
              select: {
                id: true,
                platform: true,
                platformUsername: true,
              },
            },
          },
        },
      },
    })

    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 })
    }

    if (script.brand.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({ publishes: script.publishes })
  } catch (error: any) {
    console.error("Error fetching publish status:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch publish status" },
      { status: 500 }
    )
  }
}
