"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QrCode, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { whatsappService } from "@/lib/whatsapp/service";
import { useOrgAuth } from "@/app/org-menu/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useWhatsappSocket } from "@/hooks/use-whatsapp-socket";
import { useCallback } from "react";

export default function QRPage() {
  const { session } = useOrgAuth();
  const organizationId = (session?.organization as any)?.$id;
  const queryClient = useQueryClient();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const { data: instances = [] } = useQuery({
    queryKey: ["whatsapp-instances", organizationId],
    queryFn: () => whatsappService.getInstances(),
    enabled: !!organizationId,
  });

  const instance = instances[0] || null;
  const isConnected = instance?.connectionStatus === "connected";

  useWhatsappSocket(organizationId, useCallback((data: any) => {
    if (data.status === "connected") { setQrCode(null); queryClient.invalidateQueries({ queryKey: ["whatsapp-instances"] }); }
  }, [queryClient]));

  const generateQR = async () => {
    setGenerating(true);
    try {
      const data = await whatsappService.connect();
      setQrCode(data.qr);
      toast.success("QR code generated");
    } catch (e: any) { toast.error(e.message); }
    setGenerating(false);
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900">QR Code</h1><p className="text-sm text-slate-500 mt-1">Scan to connect WhatsApp</p></div>

      {isConnected ? (
        <Card className="max-w-md mx-auto">
          <CardContent className="py-8 text-center">
            <CheckCircle2 className="h-16 w-16 mx-auto text-emerald-500 mb-4" />
            <p className="font-medium">WhatsApp Connected</p>
            <p className="text-sm text-slate-500 mt-1">{instance?.phoneNumber}</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><QrCode className="h-5 w-5" /> Scan QR Code</CardTitle>
            <CardDescription>Open WhatsApp → Settings → Linked Devices → Link Device</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {qrCode ? (
              <div className="bg-white p-6 rounded-2xl shadow-lg border">
                <img src={qrCode} alt="WhatsApp QR" className="w-64 h-64" />
              </div>
            ) : (
              <div className="w-64 h-64 flex items-center justify-center bg-slate-100 rounded-2xl">
                {generating ? <Loader2 className="h-12 w-12 animate-spin text-slate-400" /> : <QrCode className="h-16 w-16 text-slate-300" />}
              </div>
            )}
            <Button onClick={generateQR} disabled={generating} className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {qrCode ? "Refresh QR" : "Generate QR Code"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
