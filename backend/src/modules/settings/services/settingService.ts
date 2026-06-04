// @ts-nocheck
import crypto from "crypto";
import { connectDB } from "../../../db/connection.js";
import { Setting } from "../../../models/index.js";
import { NotFoundError } from "../../../core/errors/AppError.js";

export const settingService = {
  async get(organizationId: string, key: string): Promise<Record<string, unknown> | null> {
    await connectDB();
    const setting = await Setting.findOne({ organizationId, key, deletedAt: null }).lean();
    if (!setting) throw new NotFoundError("Setting", key);
    return setting;
  },

  async list(organizationId: string): Promise<Record<string, unknown>[]> {
    await connectDB();
    return Setting.find({ organizationId }).lean();
  },

  async upsert(
    organizationId: string,
    key: string,
    value: Record<string, unknown>,
    updatedBy?: string,
  ): Promise<Record<string, unknown>> {
    await connectDB();
    const setting = await Setting.findOneAndUpdate(
      { organizationId, key },
      {
        $set: { value, updatedBy: updatedBy || null },
        $setOnInsert: { _id: crypto.randomUUID(), organizationId, key },
      },
      { upsert: true, new: true },
    ).lean();
    return setting;
  },

  async remove(organizationId: string, key: string): Promise<{ deleted: boolean }> {
    await connectDB();
    const setting = await Setting.findOne({ organizationId, key }).lean();
    if (!setting) throw new NotFoundError("Setting", key);
    await Setting.findByIdAndUpdate(setting._id, { $set: { deletedAt: new Date() } });
    return { deleted: true };
  },
};
