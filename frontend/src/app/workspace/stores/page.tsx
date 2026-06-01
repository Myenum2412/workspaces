"use client";

import * as React from "react";
import { StoreIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export default function StoresPage() {
  return (
    <div className="flex flex-col items-center justify-center text-center pt-24 pb-10">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-4">
        <StoreIcon className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">App Store</h1>
      <p className="text-sm text-slate-500 mt-2 max-w-sm">
        Apps coming soon. Stay tuned for integrations.
      </p>
      <Badge variant="secondary" className="mt-4 text-xs">Coming Soon</Badge>
    </div>
  );
}
