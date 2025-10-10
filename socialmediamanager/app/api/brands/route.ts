import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Get all brands for the authenticated user
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const brands = await prisma.brand.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        socialAccounts: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(brands)
  } catch (error) {
    console.error("Error fetching brands:", error)
    return NextResponse.json(
      { error: "Failed to fetch brands" },
      { status: 500 }
    )
  }
}

// Create a new brand
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, logo, description } = body

    if (!name) {
      return NextResponse.json(
        { error: "Brand name is required" },
        { status: 400 }
      )
    }

    const brand = await prisma.brand.create({
      data: {
        name,
        logo: logo || null,
        description: description || null,
        userId: session.user.id,
      },
    })

    return NextResponse.json(brand, { status: 201 })
  } catch (error) {
    console.error("Error creating brand:", error)
    return NextResponse.json(
      { error: "Failed to create brand" },
      { status: 500 }
    )
  }
}
