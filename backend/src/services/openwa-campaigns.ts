import { connectDB } from "../config/connection.js";
import { Campaign, BatchJob } from "../models/openwa.js";
import crypto from "crypto";

class OpenWACampaignService {
  async create(organizationId: string, dto: any) {
    await connectDB();
    return Campaign.create({ _id: crypto.randomUUID(), organizationId, status: "draft", ...dto });
  }

  async findAll(organizationId: string, sessionId?: string) {
    await connectDB();
    const filter: any = { organizationId };
    if (sessionId) filter.sessionId = sessionId;
    return Campaign.find(filter).sort({ createdAt: -1 }).lean();
  }

  async findOne(organizationId: string, id: string) {
    await connectDB();
    const c = await Campaign.findOne({ _id: id, organizationId }).lean();
    if (!c) throw new Error("Campaign not found");
    return c;
  }

  async update(organizationId: string, id: string, dto: any) {
    await connectDB();
    const c = await Campaign.findOne({ _id: id, organizationId });
    if (!c) throw new Error("Campaign not found");
    Object.assign(c, dto, { updatedAt: new Date().toISOString() });
    await c.save();
    return c;
  }

  async delete(organizationId: string, id: string) {
    await connectDB();
    const c = await Campaign.findOne({ _id: id, organizationId });
    if (!c) throw new Error("Campaign not found");
    await c.deleteOne();
  }

  async startCampaign(organizationId: string, id: string) {
    await connectDB();
    const campaign = await Campaign.findOne({ _id: id, organizationId });
    if (!campaign) throw new Error("Campaign not found");
    if (!["draft", "scheduled", "paused"].includes(campaign.status)) throw new Error(`Cannot start campaign in '${campaign.status}' status`);

    // Create batch job from campaign
    const batchId = `campaign_${campaign._id.toString().slice(0, 8)}`;
    const messages = (campaign.audienceFilter?.contacts || []).map((contactId: string) => ({
      chatId: contactId,
      type: "text",
      content: { text: campaign.templateName || "Campaign message" },
      status: "pending" as const,
    }));

    await BatchJob.create({
      _id: crypto.randomUUID(), organizationId, sessionId: campaign.sessionId,
      batchId, status: "pending", totalMessages: messages.length,
      messages, options: { delayBetweenMessages: 2000, randomizeDelay: true, stopOnError: false },
      progress: { total: messages.length, sent: 0, failed: 0, pending: messages.length, cancelled: 0 },
    });

    campaign.status = "running";
    campaign.startedAt = new Date().toISOString();
    campaign.updatedAt = new Date().toISOString();
    await campaign.save();
    return campaign;
  }

  async pauseCampaign(organizationId: string, id: string) {
    await connectDB();
    const c = await Campaign.findOne({ _id: id, organizationId });
    if (!c) throw new Error("Campaign not found");
    c.status = "paused";
    c.updatedAt = new Date().toISOString();
    await c.save();
    return c;
  }

  async cancelCampaign(organizationId: string, id: string) {
    await connectDB();
    const c = await Campaign.findOne({ _id: id, organizationId });
    if (!c) throw new Error("Campaign not found");
    c.status = "cancelled";
    c.completedAt = new Date().toISOString();
    c.updatedAt = new Date().toISOString();
    await c.save();
    // Cancel associated batch jobs
    await BatchJob.updateMany({ organizationId, status: { $in: ["pending", "processing"] } }, { status: "cancelled", completedAt: new Date().toISOString() });
    return c;
  }

  async getStats(organizationId: string, campaignId: string) {
    await connectDB();
    const campaign = await Campaign.findOne({ _id: campaignId, organizationId }).lean();
    if (!campaign) throw new Error("Campaign not found");
    const batches = await BatchJob.find({ organizationId, batchId: new RegExp(`^campaign_${campaignId.slice(0, 8)}`) }).lean();
    const stats = { total: 0, sent: 0, delivered: 0, failed: 0, pending: 0 };
    for (const b of batches) {
      stats.total += b.progress.total;
      stats.sent += b.progress.sent;
      stats.failed += b.progress.failed;
      stats.pending += b.progress.pending;
    }
    return { campaign, stats, batches };
  }
}

export const openwaCampaigns = new OpenWACampaignService();
