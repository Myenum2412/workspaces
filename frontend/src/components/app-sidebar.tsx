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
  // Map icons to JSX for sub-components if they expect JSX
  const teamsWithLogo = sidebarData.teams.map(team => ({
    ...team,
    logo: <team.logo />
  }))

  const navMainWithIcon = sidebarData.navMain.map(item => ({
    ...item,
    icon: <item.icon />
  }))

  const projectsWithIcon = sidebarData.projects.map(project => ({
    ...project,
    icon: <project.icon />
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
