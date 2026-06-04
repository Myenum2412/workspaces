// @ts-nocheck
import crypto from "crypto";
import path from "path";
import fs from "fs/promises";
import { env } from "../../../config/env.js";
import { connectDB } from "../../../db/connection.js";
import { FileRecord } from "../../../models/index.js";
import { NotFoundError } from "../../../core/errors/AppError.js";
import type { FileUploadResult } from "../../../types/shared.js";

const UPLOAD_DIR = env.UPLOAD_DIR || "uploads";

export const fileService: {
  ensureDir: (folder: string) => Promise<string>;
  list: (organizationId: string, workspaceId: string | null, pagination: { page: number; limit: number; sortBy: string; sortOrder: string; folder?: string }) => Promise<{ data: unknown[]; total: number; page: number; limit: number; pages: number; hasNext: boolean; hasPrev: boolean }>;
  upload: (userId: string, userName: string, organizationId: string, workspaceId: string, file: Express.Multer.File, folder?: string) => Promise<FileUploadResult>;
  remove: (id: string, organizationId: string) => Promise<{ deleted: boolean }>;
} = {
  async ensureDir(folder: string): Promise<string> {
    const dir = path.join(process.cwd(), UPLOAD_DIR, folder);
    await fs.mkdir(dir, { recursive: true });
    return dir;
  },

  async list(
    organizationId: string,
    workspaceId: string | null,
    pagination: { page: number; limit: number; sortBy: string; sortOrder: string; folder?: string },
  ) {
    await connectDB();
    const filter: Record<string, unknown> = { organizationId, deletedAt: null };
    if (workspaceId) filter.workspaceId = workspaceId;
    if (pagination.folder) filter.folder = pagination.folder;
    const sort: Record<string, 1 | -1> = {
      [pagination.sortBy]: pagination.sortOrder === "asc" ? 1 : -1,
    };
    const skip = (pagination.page - 1) * pagination.limit;
    const [files, total] = await Promise.all([
      FileRecord.find(filter).sort(sort).skip(skip).limit(pagination.limit).lean(),
      FileRecord.countDocuments(filter),
    ]);
    const pages = Math.ceil(total / pagination.limit);
    return {
      data: files,
      total,
      page: pagination.page,
      limit: pagination.limit,
      pages,
      hasNext: pagination.page * pagination.limit < total,
      hasPrev: pagination.page > 1,
    };
  },

  async upload(
    userId: string,
    userName: string,
    organizationId: string,
    workspaceId: string,
    file: Express.Multer.File,
    folder: string = "general",
  ): Promise<FileUploadResult> {
    await connectDB();
    await this.ensureDir(folder);
    const ext = path.extname(file.originalname);
    const filename = `${crypto.randomUUID()}${ext}`;
    const filePath = path.join(process.cwd(), UPLOAD_DIR, folder, filename);
    await fs.writeFile(filePath, file.buffer);
    const record = new FileRecord({
      _id: crypto.randomUUID(),
      organizationId,
      workspaceId,
      userId,
      fileName: userName,
      filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/${folder}/${filename}`,
      key: `${folder}/${filename}`,
      folder,
    });
    await record.save();
    return record.toObject() as unknown as FileUploadResult;
  },

  async remove(id: string, organizationId: string): Promise<{ deleted: boolean }> {
    await connectDB();
    const file = await FileRecord.findOne({ _id: id, organizationId, deletedAt: null }).lean();
    if (!file) throw new NotFoundError("File", id);
    try {
      await fs.unlink(path.join(process.cwd(), UPLOAD_DIR, file.key));
    } catch {
      /* file may already be deleted */
    }
    await FileRecord.findByIdAndUpdate(id, { $set: { deletedAt: new Date() } });
    return { deleted: true };
  },
};
