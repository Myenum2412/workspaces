"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BoxesIcon,
  BracesIcon,
  DatabaseIcon,
  MessageSquare,
  Building2,
} from "lucide-react"

import { cn } from "@/lib/utils"

const navItems = [
  { href: "/members/data", label: "Data", icon: DatabaseIcon },
  { href: "/members/deployments", label: "Deployments", icon: BoxesIcon },
  { href: "/members/chat", label: "Chat", icon: MessageSquare },
]

export default function MembersLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  const displayName = "Members"

  return (
    <div className="min-h-svh bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r bg-background lg:block">
        <div className="flex h-16 items-center gap-3 border-b px-6">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
            <Building2 className="size-5" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">Members Workspace</p>
          </div>
        </div>
        <nav className="space-y-1 p-4">
          {navItems.map((item) => {
            const isActive =
              item.href === "/members"
                ? pathname === item.href
                : pathname.startsWith(item.href)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-zinc-100 hover:text-foreground",
                  isActive && "bg-primary/5 text-primary"
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b bg-background">
          <div className="flex min-h-16 flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <div>
              <h1 className="text-lg font-semibold">{displayName} Operations</h1>
              <p className="text-sm text-muted-foreground">Member Management</p>
            </div>
            <nav className="flex gap-2 overflow-x-auto lg:hidden">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/members"
                    ? pathname === item.href
                    : pathname.startsWith(item.href)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-muted-foreground",
                      isActive && "bg-primary/5 text-primary"
                    )}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </header>
        <main className="px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
