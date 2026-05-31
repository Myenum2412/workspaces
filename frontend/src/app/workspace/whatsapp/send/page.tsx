"use client";

import { useState } from "react";
import { Send, MessageCircle } from "lucide-react";
import { whatsappService } from "@/lib/whatsapp/service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function SendPage() {
  const [to, setTo] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!to.trim() || !message.trim()) return toast.error("Recipient and message required");
    setSending(true);
    try {
      await whatsappService.sendMessage(to.trim(), message.trim());
      toast.success("Message sent!");
      setMessage("");
    } catch (e: any) { toast.error(e.message); }
    setSending(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div><h1 className="text-2xl font-bold text-slate-900">Send Message</h1><p className="text-sm text-slate-500 mt-1">Send a WhatsApp message</p></div>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div><Label>Recipient (Phone or JID)</Label><Input placeholder="919876543210 or 919876543210@s.whatsapp.net" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          <div><Label>Message</Label><textarea className="w-full h-32 p-3 text-sm border rounded-lg" placeholder="Type your message..." value={message} onChange={(e) => setMessage(e.target.value)} /></div>
          <Button onClick={handleSend} disabled={sending} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
            <Send className="h-4 w-4" /> {sending ? "Sending..." : "Send Message"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
