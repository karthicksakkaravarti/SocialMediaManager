import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getVideoDetails, updateVideo, deleteVideo } from "@/lib/youtube"

export async function GET(
  request: Request,
  { params }: { params: { videoId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get("brandId")
    const { videoId } = params

    if (!brandId || !videoId) {
      return NextResponse.json(
        { error: "Brand ID and Video ID are required" },
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

    // Get video details
    const video = await getVideoDetails(brandId, videoId)

    return NextResponse.json(video)
  } catch (error: any) {
    console.error("Error fetching video details:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch video details" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { videoId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { videoId } = params
    const body = await request.json()
    const { brandId, title, description, tags, categoryId, privacyStatus } = body

    if (!brandId || !videoId) {
      return NextResponse.json(
        { error: "Brand ID and Video ID are required" },
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

    // Update video
    const result = await updateVideo(brandId, videoId, {
      title,
      description,
      tags,
      categoryId,
      privacyStatus,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Error updating video:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update video" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { videoId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { videoId } = params
    const body = await request.json()
    const { brandId } = body

    if (!brandId || !videoId) {
      return NextResponse.json(
        { error: "Brand ID and Video ID are required" },
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

    // Delete video
    await deleteVideo(brandId, videoId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting video:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete video" },
      { status: 500 }
    )
  }
}
