"use client"

import * as React from "react"
import { LayoutDashboard, Briefcase, Settings2, Youtube, Instagram, Twitter } from "lucide-react"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { BrandSwitcher } from "@/components/brand-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

type Brand = {
  id: string
  name: string
  logo: string | null
  description: string | null
}

const navItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    isActive: true,
  },
  {
    title: "Social Accounts",
    url: "#",
    icon: Youtube,
    items: [
      {
        title: "YouTube",
        url: "#",
      },
      {
        title: "Instagram",
        url: "#",
      },
      {
        title: "Twitter",
        url: "#",
      },
    ],
  },
  {
    title: "Brands",
    url: "/brands/new",
    icon: Briefcase,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings2,
    items: [
      {
        title: "General",
        url: "#",
      },
      {
        title: "Account",
        url: "#",
      },
    ],
  },
]

export function AppSidebar({
  brands,
  activeBrandId,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  brands: Brand[]
  activeBrandId?: string
}) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <BrandSwitcher brands={brands} activeBrandId={activeBrandId} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
