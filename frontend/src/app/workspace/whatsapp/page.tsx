"use client";

import dynamic from "next/dynamic";

const WhatsappLayout = dynamic(() => import("./layout"), { ssr: false });

export default function WhatsappPage() {
  return <WhatsappLayout />;
}
