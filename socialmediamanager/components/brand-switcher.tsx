"use client"

import * as React from "react"
import { ChevronsUpDown, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type Brand = {
  id: string
  name: string
  logo: string | null
  description: string | null
}

export function BrandSwitcher({
  brands,
  activeBrandId,
}: {
  brands: Brand[]
  activeBrandId?: string
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const [activeBrand, setActiveBrand] = React.useState<Brand | undefined>(
    brands.find((b) => b.id === activeBrandId) || brands[0]
  )

  const handleBrandChange = (brand: Brand) => {
    setActiveBrand(brand)
    router.push(`/dashboard?brand=${brand.id}`)
  }

  if (!activeBrand || brands.length === 0) {
    return null
  }

  const initials = activeBrand.name.slice(0, 2).toUpperCase()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={activeBrand.logo || undefined} alt={activeBrand.name} />
                <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeBrand.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {activeBrand.description || "Brand"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Brands
            </DropdownMenuLabel>
            {brands.map((brand, index) => {
              const brandInitials = brand.name.slice(0, 2).toUpperCase()
              return (
                <DropdownMenuItem
                  key={brand.id}
                  onClick={() => handleBrandChange(brand)}
                  className="gap-2 p-2"
                >
                  <Avatar className="h-6 w-6 rounded-md">
                    <AvatarImage src={brand.logo || undefined} alt={brand.name} />
                    <AvatarFallback className="rounded-md text-xs">
                      {brandInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 truncate">{brand.name}</span>
                  {brand.id === activeBrand.id && (
                    <span className="ml-auto text-xs">✓</span>
                  )}
                </DropdownMenuItem>
              )
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={() => router.push("/brands/new")}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">Add brand</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
