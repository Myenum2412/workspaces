export interface SidebarTeam {
  name: string
  plan: string
  logo: React.ComponentType
}

export interface SidebarItem {
  title: string
  url: string
  icon?: React.ComponentType
  items?: SidebarItem[]
}

export interface SidebarProject {
  name: string
  url: string
  icon?: React.ComponentType
}

export const teams: SidebarTeam[] = []
export const navMain: SidebarItem[] = []
export const projects: SidebarProject[] = []
export const sidebarData = { teams, navMain, projects }
