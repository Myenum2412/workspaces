/**
 * OpenWA Template Service — message template CRUD + sending with template variables.
 */

import crypto from "crypto";
import { connectDB } from "../config/connection.js";
import { MessageTemplate } from "../models/openwa.js";
import { openwaMessages } from "./openwa-messages.js";

class OpenWATemplateService {
  async create(organizationId: string, dto: {
    name: string; body: string; category?: string; language?: string;
    header?: string; headerType?: "text" | "image" | "video" | "document";
    footer?: string; buttons?: any[];
  }) {
    await connectDB();
    // Extract variables from body: {{1}}, {{2}}, etc.
    const variableRegex = /\{\{(\w+)\}\}/g;
    const variables: string[] = [];
    let match;
    while ((match = variableRegex.exec(dto.body)) !== null) {
      if (!variables.includes(match[1])) variables.push(match[1]);
    }

    return MessageTemplate.create({
      _id: crypto.randomUUID(),
      organizationId,
      name: dto.name,
      body: dto.body,
      variables,
      category: dto.category || "marketing",
      language: dto.language || "en",
      header: dto.header || null,
      headerType: dto.headerType || null,
      footer: dto.footer || null,
      buttons: dto.buttons || [],
    });
  }

  async findAll(organizationId: string) {
    await connectDB();
    return MessageTemplate.find({ organizationId }).sort({ name: 1 }).lean();
  }

  async findOne(organizationId: string, id: string) {
    await connectDB();
    const t = await MessageTemplate.findOne({ _id: id, organizationId }).lean();
    if (!t) throw new Error("Template not found");
    return t;
  }

  async update(organizationId: string, id: string, dto: any) {
    await connectDB();
    const t = await MessageTemplate.findOne({ _id: id, organizationId });
    if (!t) throw new Error("Template not found");

    // Re-extract variables if body changed
    if (dto.body) {
      const variableRegex = /\{\{(\w+)\}\}/g;
      const variables: string[] = [];
      let match;
      while ((match = variableRegex.exec(dto.body)) !== null) {
        if (!variables.includes(match[1])) variables.push(match[1]);
      }
      dto.variables = variables;
    }

    Object.assign(t, dto, { updatedAt: new Date().toISOString() });
    await t.save();
    return t;
  }

  async delete(organizationId: string, id: string) {
    await connectDB();
    const t = await MessageTemplate.findOne({ _id: id, organizationId });
    if (!t) throw new Error("Template not found");
    await t.deleteOne();
  }

  async sendWithTemplate(organizationId: string, sessionId: string, dto: {
    chatId: string; templateId: string; variables: Record<string, string>;
  }) {
    await connectDB();
    const tpl = await MessageTemplate.findOne({ _id: dto.templateId, organizationId }).lean();
    if (!tpl) throw new Error("Template not found");
    const template = tpl as any;

    let text = template.body;
    // Replace variables
    for (const [key, value] of Object.entries(dto.variables || {})) {
      text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
    }

    return openwaMessages.sendText(organizationId, sessionId, { chatId: dto.chatId, text });
  }
}

export const openwaTemplates = new OpenWATemplateService();
