import { connectDB } from "../config/connection.js";
import { AutomationRule, Label, AuditLog } from "../models/openwa.js";
import crypto from "crypto";

class OpenWAAutomationService {
  async create(organizationId: string, dto: any) {
    await connectDB();
    return AutomationRule.create({ _id: crypto.randomUUID(), organizationId, ...dto });
  }

  async findAll(organizationId: string, sessionId?: string) {
    await connectDB();
    const filter: any = { organizationId };
    if (sessionId) filter.sessionId = sessionId;
    return AutomationRule.find(filter).sort({ createdAt: -1 }).lean();
  }

  async findOne(organizationId: string, id: string) {
    await connectDB();
    const rule = await AutomationRule.findOne({ _id: id, organizationId }).lean();
    if (!rule) throw new Error("Automation rule not found");
    return rule;
  }

  async update(organizationId: string, id: string, dto: any) {
    await connectDB();
    const rule = await AutomationRule.findOne({ _id: id, organizationId });
    if (!rule) throw new Error("Automation rule not found");
    Object.assign(rule, dto, { updatedAt: new Date().toISOString() });
    await rule.save();
    return rule;
  }

  async delete(organizationId: string, id: string) {
    await connectDB();
    const rule = await AutomationRule.findOne({ _id: id, organizationId });
    if (!rule) throw new Error("Automation rule not found");
    await rule.deleteOne();
  }

  async toggle(organizationId: string, id: string) {
    await connectDB();
    const rule = await AutomationRule.findOne({ _id: id, organizationId });
    if (!rule) throw new Error("Automation rule not found");
    rule.isActive = !rule.isActive;
    rule.updatedAt = new Date().toISOString();
    await rule.save();
    return rule;
  }

  async processIncomingMessage(organizationId: string, sessionId: string, message: any) {
    await connectDB();
    const rules = await AutomationRule.find({ organizationId, sessionId, isActive: true }).lean();
    for (const rule of rules) {
      if (this.matchesTrigger(rule, message)) {
        await this.executeActions(organizationId, sessionId, rule, message);
        await AutomationRule.updateOne({ _id: rule._id }, { $inc: { executionCount: 1 }, lastExecutedAt: new Date().toISOString() });
      }
    }
  }

  private matchesTrigger(rule: any, message: any): boolean {
    const text = (message.messageText || message.body || "").toLowerCase();
    switch (rule.triggerType) {
      case "keyword": {
        const keywords = (rule.triggerConfig?.keywords || []).map((k: string) => k.toLowerCase());
        return keywords.some((k: string) => text.includes(k));
      }
      case "incoming_message":
        return true;
      case "no_reply":
        return false; // handled by scheduler
      default:
        return false;
    }
  }

  private async executeActions(organizationId: string, sessionId: string, rule: any, message: any) {
    for (const action of (rule.actions || [])) {
      try {
        switch (action.type) {
          case "send_message": {
            const { openwaMessages } = await import("./openwa-messages.js");
            await openwaMessages.sendText(organizationId, sessionId, {
              chatId: message.jid || message.chatId,
              text: (action.config?.text || "Auto-reply") as string,
            });
            break;
          }
          case "add_label": {
            if (action.config?.labelId && message.jid) {
              const label = await Label.findById(action.config.labelId);
              if (label) {
                // Store label-chat association in metadata
                await AuditLog.create({
                  _id: crypto.randomUUID(), organizationId, action: "label.added",
                  severity: "info", sessionId, entityType: "chat",
                  details: { chatId: message.jid, labelId: action.config.labelId },
                  createdAt: new Date().toISOString(),
                });
              }
            }
            break;
          }
          case "webhook": {
            if (action.config?.url) {
              await fetch(action.config.url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rule: rule.name, message }),
                signal: AbortSignal.timeout(10000),
              });
            }
            break;
          }
        }
      } catch { /* continue to next action */ }
    }
  }
}

export const openwaAutomation = new OpenWAAutomationService();
