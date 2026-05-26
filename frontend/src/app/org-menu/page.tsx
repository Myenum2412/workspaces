"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function OrgMenuIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/org-menu/dashboard");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
    </div>
  );
}
