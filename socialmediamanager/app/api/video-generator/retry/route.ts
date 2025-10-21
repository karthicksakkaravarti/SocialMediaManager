import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { retryFailedPublishes } from "@/lib/video-publisher"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { publishIds } = body

    if (!publishIds || !Array.isArray(publishIds) || publishIds.length === 0) {
      return NextResponse.json(
        { error: "Publish IDs array is required" },
        { status: 400 }
      )
    }

    // Verify all publishes belong to user's brands
    const publishes = await prisma.videoPublish.findMany({
      where: { id: { in: publishIds } },
      include: {
        script: {
          include: {
            brand: { select: { userId: true } },
          },
        },
      },
    })

    if (publishes.length !== publishIds.length) {
      return NextResponse.json(
        { error: "Some publish records not found" },
        { status: 404 }
      )
    }

    // Check ownership
    const unauthorizedPublish = publishes.find(
      (p) => p.script.brand.userId !== session.user.id
    )
    if (unauthorizedPublish) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Retry failed publishes
    const result = await retryFailedPublishes(publishIds)

    return NextResponse.json({
      success: true,
      ...result,
      message: `Retrying upload to ${result.retried} channels`,
    })
  } catch (error: any) {
    console.error("Error retrying publishes:", error)
    return NextResponse.json(
      { error: error.message || "Failed to retry publishes" },
      { status: 500 }
    )
  }
}
