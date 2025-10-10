import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getYouTubeClient } from "@/lib/youtube"
import { Readable } from "stream"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const brandId = formData.get("brandId") as string
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const privacyStatus = formData.get("privacyStatus") as string
    const tags = formData.get("tags") as string
    const videoFile = formData.get("video") as File

    if (!brandId || !title || !videoFile) {
      return NextResponse.json(
        { error: "Brand ID, title, and video file are required" },
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

    // Get YouTube client
    const youtube = await getYouTubeClient(brandId)

    // Convert File to Buffer
    const arrayBuffer = await videoFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Create readable stream from buffer
    const stream = Readable.from(buffer)

    // Upload video to YouTube
    const response = await youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title,
          description: description || undefined,
          tags: tags ? tags.split(",").map((tag) => tag.trim()) : undefined,
        },
        status: {
          privacyStatus: privacyStatus || "private",
        },
      },
      media: {
        body: stream,
      },
    })

    return NextResponse.json({
      success: true,
      video: response.data,
    })
  } catch (error: any) {
    console.error("Error uploading video:", error)
    return NextResponse.json(
      { error: error.message || "Failed to upload video" },
      { status: 500 }
    )
  }
}
