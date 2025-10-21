import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - List scripts with filters
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get("brandId")
    const status = searchParams.get("status")

    if (!brandId) {
      return NextResponse.json(
        { error: "Brand ID is required" },
        { status: 400 }
      )
    }

    // Verify brand belongs to user
    const brand = await prisma.brand.findFirst({
      where: {
        id: brandId,
        userId: session.user.id,
      },
    })

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 })
    }

    // Build where clause
    const where: any = { brandId }
    if (status) {
      where.status = status
    }

    const scripts = await prisma.videoScript.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        jobs: {
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
        _count: {
          select: {
            jobs: true,
            publishes: true,
          },
        },
      },
    })

    return NextResponse.json({ scripts })
  } catch (error: any) {
    console.error("Error listing scripts:", error)
    return NextResponse.json(
      { error: error.message || "Failed to list scripts" },
      { status: 500 }
    )
  }
}

// POST - Create new script
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { brandId, title, scriptJson, status, scheduledAt } = body

    if (!brandId || !title || !scriptJson) {
      return NextResponse.json(
        { error: "Brand ID, title, and script JSON are required" },
        { status: 400 }
      )
    }

    // Verify brand belongs to user
    const brand = await prisma.brand.findFirst({
      where: {
        id: brandId,
        userId: session.user.id,
      },
    })

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 })
    }

    // Create script
    const script = await prisma.videoScript.create({
      data: {
        brandId,
        title,
        scriptJson,
        status: status || "draft",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      },
    })

    return NextResponse.json({ script }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating script:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create script" },
      { status: 500 }
    )
  }
}
