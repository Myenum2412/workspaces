"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import {
  Sidebar,
  SidebarContent,
  SidebarRail,
} from "@/components/ui/sidebar"
import { sidebarData } from "@/lib/data/sidebar-data"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const navMainWithIcon = sidebarData.navMain.map(item => ({
    title: item.title,
    url: item.url,
    items: item.items,
  }))

  const projectsWithIcon = sidebarData.projects.map(project => ({
    name: project.name,
    url: project.url,
    icon: null as unknown as React.ReactNode,
  }))

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <NavMain items={navMainWithIcon} />
        <NavProjects projects={projectsWithIcon} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
