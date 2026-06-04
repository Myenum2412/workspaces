import crypto from "crypto";
import { connectDB } from "../../../db/connection.js";
import { Setting, BrandingConfig } from "../../../models/index.js";
import { NotFoundError } from "../../../core/errors/AppError.js";

export const settingService = {
  async get(organizationId: string, key: string) {
    await connectDB();
    const s = await Setting.findOne({ organizationId, key }).lean();
    if (!s) throw new NotFoundError("Setting");
    return s;
  },

  async list(organizationId: string) {
    await connectDB();
    return Setting.find({ organizationId }).sort({ key: 1 }).lean();
  },

  async upsert(organizationId: string, key: string, value: unknown, updatedBy?: string) {
    await connectDB();
    return Setting.findOneAndUpdate(
      { organizationId, key },
      { $set: { value, updatedBy: updatedBy || null }, $setOnInsert: { _id: crypto.randomUUID() } },
      { upsert: true, new: true },
    ).lean();
  },

  async remove(organizationId: string, key: string) {
    await connectDB();
    const s = await Setting.findOne({ organizationId, key }).lean();
    if (!s) throw new NotFoundError("Setting");
    await Setting.findByIdAndDelete(s._id);
    return { deleted: true };
  },

  async getBranding(organizationId: string) {
    await connectDB();
    return BrandingConfig.findOne({ organizationId }).lean();
  },

  async updateBranding(organizationId: string, data: Record<string, unknown>, updatedBy?: string) {
    await connectDB();
    return BrandingConfig.findOneAndUpdate(
      { organizationId },
      { $set: { ...data, updatedBy: updatedBy || null }, $inc: { version: 1 }, $setOnInsert: { _id: crypto.randomUUID() } },
      { upsert: true, new: true },
    ).lean();
  },
};
