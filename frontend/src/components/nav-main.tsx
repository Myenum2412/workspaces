"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { ChevronRightIcon } from "lucide-react"

export function NavMain({
  items,
  label = "Navigation",
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
    isActive?: boolean
    items?: {
      title: string
      url: string
      }[]
  }[]
  label?: string
}) {
  const pathname = usePathname()
  const isRootSection = (url: string) => url.split("/").filter(Boolean).length <= 1
  const isActiveUrl = (url: string) =>
    isRootSection(url)
      ? pathname === url
      : pathname === url || pathname.startsWith(`${url}/`)

  // Track which collapsibles are open
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

  // Auto-open collapsible when route matches
  useEffect(() => {
    const newOpenItems: Record<string, boolean> = {}
    items.forEach((item) => {
      if (item.items?.length) {
        const shouldBeOpen = !!(
          isActiveUrl(item.url) ||
          item.items?.some((subItem) => isActiveUrl(subItem.url)) ||
          (item.isActive && pathname === item.url)
        )
        newOpenItems[item.title] = shouldBeOpen
      }
    })
    setOpenItems((prev) => ({ ...prev, ...newOpenItems }))
  }, [pathname, items])

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive =
            isActiveUrl(item.url) ||
            item.items?.some((subItem) => isActiveUrl(subItem.url)) ||
            (item.isActive && pathname === item.url)

          if (!item.items?.length) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                  <Link href={item.url}>
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }

          return (
            <Collapsible
              key={item.title}
              asChild
              open={openItems[item.title] ?? false}
              onOpenChange={(open) =>
                setOpenItems((prev) => ({ ...prev, [item.title]: open }))
              }
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title} isActive={isActive} asChild>
                    <Link href={item.url}>
                      {item.icon}
                      <span>{item.title}</span>
                      <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </Link>
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild isActive={isActiveUrl(subItem.url)}>
                          <Link href={subItem.url}>
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
