import { connectDB } from "../config/connection.js";
import { Webhook, AuditLog } from "../models/openwa.js";
import crypto from "crypto";

class OpenWAWebhookService {
  async create(organizationId: string, sessionId: string, dto: { url: string; events?: string[]; secret?: string; headers?: Record<string, string>; retryCount?: number }) {
    await connectDB();
    return Webhook.create({
      _id: crypto.randomUUID(), organizationId, sessionId,
      url: dto.url, events: dto.events || ["message.received"],
      secret: dto.secret || null, headers: dto.headers || {},
      retryCount: dto.retryCount ?? 3,
    });
  }

  async findBySession(organizationId: string, sessionId: string) {
    await connectDB();
    return Webhook.find({ organizationId, sessionId }).sort({ createdAt: -1 }).lean();
  }

  async findAll(organizationId: string) {
    await connectDB();
    return Webhook.find({ organizationId }).sort({ createdAt: -1 }).lean();
  }

  async findOne(organizationId: string, id: string) {
    await connectDB();
    const w = await Webhook.findOne({ _id: id, organizationId }).lean();
    if (!w) throw new Error("Webhook not found");
    return w;
  }

  async update(organizationId: string, id: string, dto: any) {
    await connectDB();
    const w = await Webhook.findOne({ _id: id, organizationId });
    if (!w) throw new Error("Webhook not found");
    Object.assign(w, dto, { updatedAt: new Date().toISOString() });
    await w.save();
    return w;
  }

  async delete(organizationId: string, id: string) {
    await connectDB();
    const w = await Webhook.findOne({ _id: id, organizationId });
    if (!w) throw new Error("Webhook not found");
    await w.deleteOne();
  }

  async test(organizationId: string, webhookId: string) {
    await connectDB();
    const webhook = await Webhook.findOne({ _id: webhookId, organizationId }).lean() as any;
    if (!webhook) throw new Error("Webhook not found");
    const payload = { event: "test", timestamp: new Date().toISOString(), data: { message: "Test webhook from OpenWA" }, idempotencyKey: crypto.randomUUID(), deliveryId: crypto.randomUUID() };
    const body = JSON.stringify(payload);
    const headers: Record<string, string> = { "Content-Type": "application/json", "User-Agent": "OpenWA-Webhook/1.0.0", "X-OpenWA-Event": "test", "X-OpenWA-Idempotency-Key": payload.idempotencyKey, "X-OpenWA-Delivery-Id": payload.deliveryId, ...(webhook.headers || {}) };
    if (webhook.secret) headers["X-OpenWA-Signature"] = this.generateSignature(body, webhook.secret);
    try {
      const res = await fetch(webhook.url, { method: "POST", headers, body, signal: AbortSignal.timeout(10000) });
      return { success: res.ok, statusCode: res.status };
    } catch (err: any) { return { success: false, error: err.message }; }
  }

  async dispatch(organizationId: string, sessionId: string, event: string, data: Record<string, unknown>) {
    await connectDB();
    const webhooks = await Webhook.find({ organizationId, sessionId, active: true }).lean();
    const matching = webhooks.filter(w => w.events.includes(event) || w.events.includes("*"));
    for (const webhook of matching) {
      const payload = { event, timestamp: new Date().toISOString(), sessionId, data, idempotencyKey: crypto.randomUUID(), deliveryId: crypto.randomUUID() };
      const body = JSON.stringify(payload);
      const headers: Record<string, string> = { "Content-Type": "application/json", "User-Agent": "OpenWA-Webhook/1.0.0", "X-OpenWA-Event": event, "X-OpenWA-Idempotency-Key": payload.idempotencyKey, "X-OpenWA-Delivery-Id": payload.deliveryId, "X-OpenWA-Retry-Count": "0", ...(webhook.headers || {}) };
      if (webhook.secret) headers["X-OpenWA-Signature"] = this.generateSignature(body, webhook.secret);
      this.deliverWithRetry(webhook, body, headers).catch(() => {});
    }
  }

  private async deliverWithRetry(webhook: any, body: string, headers: Record<string, string>, attempt = 1) {
    try {
      const res = await fetch(webhook.url, { method: "POST", headers, body, signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await Webhook.updateOne({ _id: webhook._id }, { lastTriggeredAt: new Date().toISOString() });
    } catch {
      if (attempt < webhook.retryCount) setTimeout(() => this.deliverWithRetry(webhook, body, { ...headers, "X-OpenWA-Retry-Count": String(attempt) }, attempt + 1), 5000 * attempt);
    }
  }

  private generateSignature(payload: string, secret: string): string {
    return `sha256=${crypto.createHmac("sha256", secret).update(payload).digest("hex")}`;
  }
}

export const openwaWebhooks = new OpenWAWebhookService();
