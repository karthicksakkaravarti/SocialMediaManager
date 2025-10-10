import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { google } from "googleapis"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login`)
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const brandId = searchParams.get("state") // brandId from state param
    const error = searchParams.get("error")

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard?error=access_denied`
      )
    }

    if (!code || !brandId) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard?error=invalid_request`
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
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard?error=brand_not_found`
      )
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/social/youtube/callback`
    )

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    // Get YouTube channel info
    const youtube = google.youtube({ version: "v3", auth: oauth2Client })
    const channelResponse = await youtube.channels.list({
      part: ["snippet"],
      mine: true,
    })

    const channel = channelResponse.data.items?.[0]

    if (!channel) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard?error=no_channel`
      )
    }

    // Check if account already exists
    const existingAccount = await prisma.socialAccount.findUnique({
      where: {
        platform_platformAccountId: {
          platform: "youtube",
          platformAccountId: channel.id!,
        },
      },
    })

    if (existingAccount && existingAccount.brandId !== brandId) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard?error=account_already_linked`
      )
    }

    // Save or update social account
    await prisma.socialAccount.upsert({
      where: {
        platform_platformAccountId: {
          platform: "youtube",
          platformAccountId: channel.id!,
        },
      },
      create: {
        platform: "youtube",
        platformAccountId: channel.id!,
        platformUsername: channel.snippet?.title || null,
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token || null,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scope: tokens.scope || null,
        brandId,
      },
      update: {
        platformUsername: channel.snippet?.title || null,
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token || null,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scope: tokens.scope || null,
        brandId,
      },
    })

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard?success=youtube_connected`
    )
  } catch (error) {
    console.error("Error connecting YouTube account:", error)
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard?error=connection_failed`
    )
  }
}
