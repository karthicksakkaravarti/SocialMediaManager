import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Get brand publish config
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get("brandId")

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
      include: {
        publishConfig: true,
      },
    })

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 })
    }

    // Return existing config or default values
    const config = brand.publishConfig || {
      requireApproval: true,
      autoPublish: false,
    }

    return NextResponse.json({ config })
  } catch (error: any) {
    console.error("Error fetching config:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch config" },
      { status: 500 }
    )
  }
}

// POST - Update brand publish config
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { brandId, requireApproval, autoPublish } = body

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

    // Upsert config
    const config = await prisma.publishConfig.upsert({
      where: { brandId },
      update: {
        ...(requireApproval !== undefined && { requireApproval }),
        ...(autoPublish !== undefined && { autoPublish }),
      },
      create: {
        brandId,
        requireApproval: requireApproval ?? true,
        autoPublish: autoPublish ?? false,
      },
    })

    return NextResponse.json({ config })
  } catch (error: any) {
    console.error("Error updating config:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update config" },
      { status: 500 }
    )
  }
}
