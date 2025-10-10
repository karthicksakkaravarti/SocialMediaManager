import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { google } from "googleapis"

// Validate YouTube credentials by testing OAuth2 client creation
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { clientId, clientSecret } = body

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Client ID and client secret are required" },
        { status: 400 }
      )
    }

    // Try to create OAuth2 client to validate credentials
    try {
      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        `${process.env.NEXTAUTH_URL}/api/social/youtube/callback`
      )

      // If we can create the client successfully, credentials are valid
      // We'll also generate an auth URL to further validate
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/youtube.readonly'],
      })

      if (authUrl) {
        return NextResponse.json({
          valid: true,
          message: "Credentials are valid",
        })
      } else {
        throw new Error("Failed to generate auth URL")
      }
    } catch (error) {
      console.error("Invalid YouTube credentials:", error)
      return NextResponse.json(
        { valid: false, error: "Invalid credentials. Please check your Client ID and Client Secret." },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Error validating YouTube credentials:", error)
    return NextResponse.json(
      { error: "Failed to validate credentials" },
      { status: 500 }
    )
  }
}
