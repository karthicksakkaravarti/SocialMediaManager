import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { DashboardContent } from "@/components/dashboard-content"
import { ThemeToggle } from "@/components/theme-toggle"

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function DashboardPage(props: {
  searchParams: SearchParams
}) {
  const session = await getServerSession(authOptions)
  const searchParams = await props.searchParams

  if (!session?.user?.id) {
    redirect("/login")
  }

  // Fetch user's brands with social accounts
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

  // If no brands, redirect to create first brand
  if (brands.length === 0) {
    redirect("/brands/new")
  }

  // Get selected brand from query params, default to first brand
  const brandId = typeof searchParams.brand === 'string' ? searchParams.brand : brands[0].id
  const selectedBrand = brands.find(b => b.id === brandId) || brands[0]

  // Simplify brands data for sidebar (remove socialAccounts)
  const simplifiedBrands = brands.map(({ socialAccounts, ...brand }) => brand)

  return (
    <SidebarProvider>
      <AppSidebar brands={simplifiedBrands} activeBrandId={selectedBrand.id} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 justify-between transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="px-4">
            <ThemeToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col">
          <DashboardContent brand={selectedBrand} user={session.user} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
