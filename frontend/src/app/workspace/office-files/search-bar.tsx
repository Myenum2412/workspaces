"use client";

import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SearchBar() {
  return (
    <div className="relative max-w-2xl mx-auto mt-4">
      <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <Input
        placeholder="Search for files"
        className="pl-12 py-6 text-base bg-white shadow-sm border-slate-300 rounded-xl"
      />
    </div>
  );
}
