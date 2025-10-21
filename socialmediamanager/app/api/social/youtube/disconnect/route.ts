import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * DELETE - Disconnect a YouTube account from a brand
 */
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const socialAccountId = searchParams.get("accountId")
    const brandId = searchParams.get("brandId")

    if (!socialAccountId && !brandId) {
      return NextResponse.json(
        { error: "Either accountId or brandId is required" },
        { status: 400 }
      )
    }

    // If specific account ID provided
    if (socialAccountId) {
      const account = await prisma.socialAccount.findUnique({
        where: { id: socialAccountId },
        include: {
          brand: {
            select: { userId: true },
          },
        },
      })

      if (!account) {
        return NextResponse.json(
          { error: "Account not found" },
          { status: 404 }
        )
      }

      // Verify ownership
      if (account.brand.userId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      // Delete the social account
      await prisma.socialAccount.delete({
        where: { id: socialAccountId },
      })

      return NextResponse.json({
        success: true,
        message: "YouTube account disconnected successfully",
      })
    }

    // If brandId provided, disconnect all YouTube accounts for that brand
    if (brandId) {
      const brand = await prisma.brand.findFirst({
        where: {
          id: brandId,
          userId: session.user.id,
        },
      })

      if (!brand) {
        return NextResponse.json({ error: "Brand not found" }, { status: 404 })
      }

      // Delete all YouTube accounts for this brand
      const result = await prisma.socialAccount.deleteMany({
        where: {
          brandId,
          platform: "youtube",
        },
      })

      return NextResponse.json({
        success: true,
        message: `${result.count} YouTube account(s) disconnected successfully`,
        count: result.count,
      })
    }

    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Error disconnecting YouTube account:", error)
    return NextResponse.json(
      { error: "Failed to disconnect YouTube account" },
      { status: 500 }
    )
  }
}
