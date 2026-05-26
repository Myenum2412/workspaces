import * as React from "react"
import {
  BriefcaseBusinessIcon,
  Building2Icon,
  ChartCandlestickIcon,
  CircleDollarSignIcon,
  FileCheck2Icon,
  GalleryVerticalEndIcon,
  ShieldCheckIcon,
  UserRoundSearchIcon,
} from "lucide-react"

export const sidebarData = {
  teams: [
    {
      name: "Advance Level Securities",
      logo: GalleryVerticalEndIcon,
      plan: "Broker Platform",
    },
    {
      name: "Retail Brokerage",
      logo: ChartCandlestickIcon,
      plan: "Live Desk",
    },
    {
      name: "Institutional Desk",
      logo: Building2Icon,
      plan: "Managed Accounts",
    },
  ],
  navMain: [
    {
      title: "Trading Overview",
      url: "/dashboard",
      icon: ChartCandlestickIcon,
      isActive: true,
      items: [
        { title: "Market Snapshot", url: "/dashboard" },
        { title: "Exposure", url: "/dashboard" },
      ],
    },
    {
      title: "Client Accounts",
      url: "/dashboard",
      icon: UserRoundSearchIcon,
      items: [
        { title: "KYC Status", url: "/dashboard" },
        { title: "Mandates", url: "/dashboard" },
      ],
    },
    {
      title: "Settlement",
      url: "/dashboard",
      icon: CircleDollarSignIcon,
      items: [
        { title: "Pending Funds", url: "/dashboard" },
        { title: "Clearing Queue", url: "/dashboard" },
      ],
    },
    {
      title: "Compliance",
      url: "/dashboard",
      icon: ShieldCheckIcon,
      items: [
        { title: "Alerts", url: "/dashboard" },
        { title: "Audit Trail", url: "/dashboard" },
      ],
    },
  ],
  projects: [
    {
      name: "Equities",
      url: "#",
      icon: BriefcaseBusinessIcon,
    },
    {
      name: "Fixed Income",
      url: "#",
      icon: FileCheck2Icon,
    },
    {
      name: "Wealth Advisory",
      url: "#",
      icon: Building2Icon,
    },
  ],
}
