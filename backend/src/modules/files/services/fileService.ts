import crypto from "crypto";
import path from "path";
import fs from "fs/promises";
import { env } from "../../../config/env.js";
import { connectDB } from "../../../db/connection.js";
import { FileRecord } from "../../../models/index.js";
import { NotFoundError } from "../../../core/errors/AppError.js";

const UPLOAD_DIR = env.UPLOAD_DIR || "uploads";

export const fileService = {
  async ensureDir(folder: string) {
    const dir = path.join(process.cwd(), UPLOAD_DIR, folder);
    await fs.mkdir(dir, { recursive: true });
    return dir;
  },

  async list(organizationId: string, workspaceId: string | null, params: { page: number; limit: number; folder?: string; sortBy: string; sortOrder: string }) {
    await connectDB();
    const filter: Record<string, unknown> = { organizationId, deletedAt: null };
    if (workspaceId) filter.workspaceId = workspaceId;
    if (params.folder) filter.folder = params.folder;
    const sort: Record<string, 1 | -1> = { [params.sortBy]: params.sortOrder === "asc" ? 1 : -1 };
    const [files, total] = await Promise.all([FileRecord.find(filter).sort(sort).skip((params.page - 1) * params.limit).limit(params.limit).lean(), FileRecord.countDocuments(filter)]);
    return { files, total };
  },

  async upload(userId: string, userName: string, organizationId: string, workspaceId: string, file: Express.Multer.File, folder: string = "general") {
    await connectDB();
    await this.ensureDir(folder);
    const ext = path.extname(file.originalname);
    const filename = `${crypto.randomUUID()}${ext}`;
    const filePath = path.join(process.cwd(), UPLOAD_DIR, folder, filename);
    await fs.writeFile(filePath, file.buffer);
    const record = new FileRecord({ _id: crypto.randomUUID(), organizationId, workspaceId, userId, userName, filename, originalName: file.originalname, mimetype: file.mimetype, size: file.size, url: `/uploads/${folder}/${filename}`, key: `${folder}/${filename}`, folder });
    await record.save();
    return record.toObject();
  },

  async remove(id: string, organizationId: string) {
    await connectDB();
    const file = await FileRecord.findOne({ _id: id, organizationId, deletedAt: null }).lean();
    if (!file) throw new NotFoundError("File");
    try { await fs.unlink(path.join(process.cwd(), UPLOAD_DIR, file.key)); } catch { /* ignore */ }
    await FileRecord.findByIdAndUpdate(id, { $set: { deletedAt: new Date() } });
    return { deleted: true };
  },
};
