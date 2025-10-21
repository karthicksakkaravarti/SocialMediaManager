import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Get single script
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const script = await prisma.videoScript.findUnique({
      where: { id },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            userId: true,
          },
        },
        jobs: {
          orderBy: { updatedAt: "desc" },
        },
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

    // Verify brand belongs to user
    if (script.brand.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({ script })
  } catch (error: any) {
    console.error("Error fetching script:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch script" },
      { status: 500 }
    )
  }
}

// PATCH - Update script
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { title, scriptJson, status, scheduledAt } = body

    // Get existing script to verify ownership
    const existingScript = await prisma.videoScript.findUnique({
      where: { id },
      include: {
        brand: { select: { userId: true } },
      },
    })

    if (!existingScript) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 })
    }

    if (existingScript.brand.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Update script
    const script = await prisma.videoScript.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(scriptJson && { scriptJson }),
        ...(status && { status }),
        ...(scheduledAt !== undefined && {
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        }),
      },
    })

    return NextResponse.json({ script })
  } catch (error: any) {
    console.error("Error updating script:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update script" },
      { status: 500 }
    )
  }
}

// DELETE - Delete script
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Get existing script to verify ownership
    const existingScript = await prisma.videoScript.findUnique({
      where: { id },
      include: {
        brand: { select: { userId: true } },
      },
    })

    if (!existingScript) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 })
    }

    if (existingScript.brand.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete script (cascade will handle jobs and publishes)
    await prisma.videoScript.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting script:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete script" },
      { status: 500 }
    )
  }
}
