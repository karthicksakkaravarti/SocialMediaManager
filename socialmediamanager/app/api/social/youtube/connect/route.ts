import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { google } from "googleapis"
import { decrypt } from "@/lib/encryption"

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

    // Get brand with YouTube credentials
    const brand = await prisma.brand.findFirst({
      where: {
        id: brandId,
        userId: session.user.id,
      },
    })

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 })
    }

    // Check if brand has YouTube credentials
    if (!brand.youtubeClientId || !brand.youtubeClientSecret) {
      return NextResponse.json(
        {
          error: "YouTube credentials not configured",
          message: "Please add YouTube API credentials to this brand first",
        },
        { status: 400 }
      )
    }

    // Decrypt client secret
    const clientSecret = decrypt(brand.youtubeClientSecret)

    // Create OAuth2 client with brand's credentials
    const oauth2Client = new google.auth.OAuth2(
      brand.youtubeClientId,
      clientSecret,
      `${process.env.NEXTAUTH_URL}/api/social/youtube/callback`
    )

    const scopes = [
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube.force-ssl",
      "https://www.googleapis.com/auth/userinfo.profile",
    ]

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      state: brandId, // Pass brandId in state to retrieve it in callback
      prompt: "consent",
    })

    return NextResponse.json({ url: authUrl })
  } catch (error) {
    console.error("Error generating YouTube auth URL:", error)
    return NextResponse.json(
      { error: "Failed to generate authorization URL" },
      { status: 500 }
    )
  }
}
