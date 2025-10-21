import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { checkYouTubeAccountHealth } from "@/lib/youtube"

/**
 * GET - Check YouTube account health
 * Returns whether the account credentials are valid and working
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get("accountId")
    const brandId = searchParams.get("brandId")

    if (!accountId && !brandId) {
      return NextResponse.json(
        { error: "Either accountId or brandId is required" },
        { status: 400 }
      )
    }

    // If checking a specific account
    if (accountId) {
      const account = await prisma.socialAccount.findUnique({
        where: { id: accountId },
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

      const health = await checkYouTubeAccountHealth(accountId)
      return NextResponse.json(health)
    }

    // If checking all accounts for a brand
    if (brandId) {
      const brand = await prisma.brand.findFirst({
        where: {
          id: brandId,
          userId: session.user.id,
        },
        include: {
          socialAccounts: {
            where: { platform: "youtube" },
          },
        },
      })

      if (!brand) {
        return NextResponse.json({ error: "Brand not found" }, { status: 404 })
      }

      const healthChecks = await Promise.all(
        brand.socialAccounts.map(async (account) => ({
          accountId: account.id,
          platformUsername: account.platformUsername,
          ...(await checkYouTubeAccountHealth(account.id)),
        }))
      )

      return NextResponse.json({
        accounts: healthChecks,
        allValid: healthChecks.every((h) => h.isValid),
        anyNeedsReconnect: healthChecks.some((h) => h.needsReconnect),
      })
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  } catch (error) {
    console.error("Error checking YouTube account health:", error)
    return NextResponse.json(
      { error: "Failed to check account health" },
      { status: 500 }
    )
  }
}
