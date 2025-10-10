import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getChannelInfo } from "@/lib/youtube"

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
    })

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 })
    }

    // Get channel information
    const channelInfo = await getChannelInfo(brandId)

    return NextResponse.json(channelInfo)
  } catch (error: any) {
    console.error("Error fetching channel info:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch channel information" },
      { status: 500 }
    )
  }
}
