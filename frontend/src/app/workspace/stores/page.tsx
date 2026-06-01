"use client";

import * as React from "react";
import {
  SearchIcon, X, CheckCircle2, Plus,
  Shield, Zap, Users, Globe, Star,
  Check, Loader2, ExternalLink, StoreIcon, ArrowRight, MessageCircle, QrCode,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

// ── App Catalog ─────────────────────────────────────────────

interface StoreApp {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  icon: React.ReactNode;
  category: string;
  tags: string[];
  rating: number;
  installs: string;
  features: string[];
  color: string;
  installed?: boolean;
}

const APP_CATALOG: StoreApp[] = [
  {
    id: "placeholder",
    name: "Coming Soon",
    description: "More apps coming to the store soon.",
    longDescription: "Stay tuned for upcoming integrations.",
    icon: <StoreIcon size={32} />,
    category: "Productivity",
    tags: ["Coming Soon"],
    rating: 0,
    installs: "0",
    features: [],
    color: "blue",
  },
];

// ── Filter Options ──────────────────────────────────────────

const CATEGORIES = ["All", "Communication", "Marketing", "Analytics", "Finance", "HR", "Productivity"];
const USE_CASES = ["All", "Customer Support", "Sales", "Team Chat", "Notifications"];
const PRICING = ["All", "Free", "Paid", "Freemium"];

// ── Store App Card ──────────────────────────────────────────

function StoreAppCard({
  app,
  installed,
  onInstall,
  onOpen,
}: {
  app: StoreApp;
  installed: boolean;
  onInstall: () => void;
  onOpen: () => void;
}) {
  const colorMap: Record<string, { bg: string; text: string; border: string; badge: string }> = {
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-700" },
    blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200", badge: "bg-blue-100 text-blue-700" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200", badge: "bg-purple-100 text-purple-700" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200", badge: "bg-amber-100 text-amber-700" },
  };
  const c = colorMap[app.color] || colorMap.emerald;

  return (
    <Card className={`group hover:shadow-md transition-shadow ${c.border}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${c.bg} ${c.text}`}>
            {app.icon}
          </div>
          {installed ? (
            <Badge variant="outline" className="gap-1 bg-emerald-50 text-emerald-700 border-emerald-200">
              <CheckCircle2 className="h-3 w-3" /> Installed
            </Badge>
          ) : (
            <Badge variant="outline" className={`${c.badge}`}>New</Badge>
          )}
        </div>
        <div className="mt-3">
          <CardTitle className="text-lg">{app.name}</CardTitle>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-0.5">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-medium text-slate-700">{app.rating}</span>
            </div>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500">{app.installs} installs</span>
          </div>
        </div>
        <CardDescription className="text-sm leading-relaxed mt-2">
          {app.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1.5">
          {app.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px] px-2 py-0.5 font-normal">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        {installed ? (
          <>
            <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={onOpen}>
              <MessageCircle className="h-4 w-4" /> Open
            </Button>
            <Button variant="outline" className="px-3" onClick={onOpen}>
              <QrCode className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={onInstall}>
            <Plus className="h-4 w-4" /> Install
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// ── App Detail Dialog ────────────────────────────────────────

function AppDetailDialog({
  app,
  open,
  onClose,
  installed,
  onInstall,
}: {
  app: StoreApp;
  open: boolean;
  onClose: () => void;
  installed: boolean;
  onInstall: () => void;
}) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
    blue: { bg: "bg-blue-50", text: "text-blue-600" },
    purple: { bg: "bg-purple-50", text: "text-purple-600" },
    amber: { bg: "bg-amber-50", text: "text-amber-600" },
  };
  const c = colorMap[app.color] || colorMap.emerald;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${c.bg} ${c.text} shrink-0`}>
              {app.icon}
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl">{app.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">{app.category}</Badge>
                <div className="flex items-center gap-0.5">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-medium">{app.rating}</span>
                </div>
                <span className="text-xs text-slate-400">{app.installs} installs</span>
              </div>
              {installed && (
                <Badge variant="outline" className="mt-2 gap-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                  <CheckCircle2 className="h-3 w-3" /> Installed
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <DialogDescription className="text-base leading-relaxed">
            {app.longDescription}
          </DialogDescription>

          <Separator />

          <div>
            <h4 className="font-semibold text-sm mb-3">Key Features</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {app.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="flex items-center gap-3">
            <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={onInstall}>
              <Plus className="h-4 w-4" /> Install
            </Button>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ───────────────────────────────────────────────

export default function StoresPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("All");
  const [selectedApp, setSelectedApp] = React.useState<StoreApp | null>(null);
  const [showDetail, setShowDetail] = React.useState(false);

  const filteredApps = APP_CATALOG.filter((app) => {
    const matchesSearch =
      !searchQuery ||
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "All" || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleInstall = async (_appId: string) => {
    toast.info("App installation coming soon");
  };

  const handleOpenApp = (_app: StoreApp) => {
    // placeholder
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      {/* Centered Hero */}
      <div className="flex flex-col items-center justify-center text-center pt-8 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">App Store</h1>
        <p className="text-base text-slate-500 mt-2 max-w-full">
          Discover and install apps to extend your workspace capabilities
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-xl mx-auto">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search apps..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10 py-6 text-base bg-white shadow-sm border-slate-200 rounded-xl"
        />
        {searchQuery && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground flex items-center justify-center hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
            className={
              selectedCategory === cat
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* App Grid */}
      <div>
        {filteredApps.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <SearchIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No apps found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredApps.map((app) => (
              <StoreAppCard
                key={app.id}
                app={app}
                installed={app.id === "placeholder"}
                onInstall={() => handleInstall(app.id)}
                onOpen={() => handleOpenApp(app)}
              />
            ))}
          </div>
        )}
      </div>

      {/* App Detail Dialog */}
      {selectedApp && (
        <AppDetailDialog
          app={selectedApp}
          open={showDetail}
          onClose={() => { setShowDetail(false); setSelectedApp(null); }}
          installed={selectedApp.id === "placeholder"}
          onInstall={() => {
            handleInstall(selectedApp.id);
            setShowDetail(false);
          }}
        />
      )}
    </div>
  );
}
