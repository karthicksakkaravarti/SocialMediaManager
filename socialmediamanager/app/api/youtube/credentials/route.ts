import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { encrypt, decrypt } from "@/lib/encryption"

// Get YouTube credentials for a brand
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

    // Return whether credentials exist (don't expose the actual values)
    return NextResponse.json({
      hasCredentials: !!(brand.youtubeClientId && brand.youtubeClientSecret),
      clientId: brand.youtubeClientId || null,
    })
  } catch (error) {
    console.error("Error fetching YouTube credentials:", error)
    return NextResponse.json(
      { error: "Failed to fetch credentials" },
      { status: 500 }
    )
  }
}

// Save YouTube credentials for a brand
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { brandId, clientId, clientSecret } = body

    if (!brandId || !clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Brand ID, client ID, and client secret are required" },
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

    // Encrypt client secret before saving
    const encryptedSecret = encrypt(clientSecret)

    // Update brand with YouTube credentials
    const updatedBrand = await prisma.brand.update({
      where: { id: brandId },
      data: {
        youtubeClientId: clientId,
        youtubeClientSecret: encryptedSecret,
      },
    })

    return NextResponse.json({
      success: true,
      message: "YouTube credentials saved successfully",
      clientId: updatedBrand.youtubeClientId,
    })
  } catch (error) {
    console.error("Error saving YouTube credentials:", error)
    return NextResponse.json(
      { error: "Failed to save credentials" },
      { status: 500 }
    )
  }
}

// Delete YouTube credentials for a brand
export async function DELETE(request: Request) {
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

    // Remove YouTube credentials
    await prisma.brand.update({
      where: { id: brandId },
      data: {
        youtubeClientId: null,
        youtubeClientSecret: null,
      },
    })

    // Also disconnect any YouTube accounts for this brand
    await prisma.socialAccount.deleteMany({
      where: {
        brandId,
        platform: "youtube",
      },
    })

    return NextResponse.json({
      success: true,
      message: "YouTube credentials removed successfully",
    })
  } catch (error) {
    console.error("Error deleting YouTube credentials:", error)
    return NextResponse.json(
      { error: "Failed to delete credentials" },
      { status: 500 }
    )
  }
}
