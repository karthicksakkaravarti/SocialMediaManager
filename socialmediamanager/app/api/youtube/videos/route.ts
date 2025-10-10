import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { listVideos } from "@/lib/youtube"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get("brandId")
    const pageToken = searchParams.get("pageToken")
    const maxResults = searchParams.get("maxResults")
    const search = searchParams.get("search")

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

    // Get videos list
    const result = await listVideos(brandId, {
      pageToken: pageToken || undefined,
      maxResults: maxResults ? parseInt(maxResults) : 50,
      search: search || undefined,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Error fetching videos:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch videos" },
      { status: 500 }
    )
  }
}
