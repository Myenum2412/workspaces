import { Request, Response } from "express";
import { exportService } from "../services/exportService.js";
import { catchAsync } from "../../../core/utils/catchAsync.js";
import { AuthRequest } from "../../../middleware/auth.js";

export const exportController = {
  tasks: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const format = (req.query.format as string) || "csv";
    const data = await exportService.exportTasks(authReq.user!.organizationId, authReq.user!.workspaceId, format as "csv" | "json");
    const contentType = format === "csv" ? "text/csv" : "application/json";
    const ext = format === "csv" ? "csv" : "json";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="tasks-export.${ext}"`);
    res.send(data);
  }),

  projects: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const format = (req.query.format as string) || "csv";
    const data = await exportService.exportProjects(authReq.user!.organizationId, authReq.user!.workspaceId, format as "csv" | "json");
    const contentType = format === "csv" ? "text/csv" : "application/json";
    const ext = format === "csv" ? "csv" : "json";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="projects-export.${ext}"`);
    res.send(data);
  }),

  users: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const format = (req.query.format as string) || "csv";
    const data = await exportService.exportUsers(authReq.user!.organizationId, format as "csv" | "json");
    const contentType = format === "csv" ? "text/csv" : "application/json";
    const ext = format === "csv" ? "csv" : "json";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="users-export.${ext}"`);
    res.send(data);
  }),
};
