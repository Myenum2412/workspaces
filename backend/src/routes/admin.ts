/**
 * Admin routes — audit logs, activity logs, global search, health check, data recovery.
 * Requires admin or owner role.
 */
import { Router, Request, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { requireRole } from "../middleware/security.js";
import { parsePagination, buildPaginationResponse } from "../middleware/pagination.js";
import { AuditQueryService } from "../services/audit-query.js";
import { checkHealth } from "../services/health.js";
import { globalSearch } from "../services/search.js";
import mongoose from "mongoose";

const router = Router();
router.use(authenticate);
router.use(requireRole("admin", "owner"));

// ── Audit Logs ───────────────────────────────────────────────
router.get("/audit-logs", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const params = parsePagination(req.query as any);
    const result = await AuditQueryService.getAuditLogs({
      organizationId: authReq.user!.organizationId,
      page: params.page,
      limit: params.limit,
      action: params.search,
      fromDate: params.fromDate,
      toDate: params.toDate,
    });
    res.json({ success: true, ...buildPaginationResponse(result.logs, result.total, params) });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch audit logs" });
  }
});

router.get("/audit-logs/stats", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const stats = await AuditQueryService.getAuditStats(authReq.user!.organizationId);
    res.json({ success: true, ...stats });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/audit-logs/actions", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const actions = await AuditQueryService.getAuditActions(authReq.user!.organizationId);
    res.json({ success: true, actions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── Activity Logs ────────────────────────────────────────────
router.get("/activity-logs", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const params = parsePagination(req.query as any);
    const result = await AuditQueryService.getActivityLogs({
      organizationId: authReq.user!.organizationId,
      page: params.page,
      limit: params.limit,
      userId: req.query.userId as string,
      action: req.query.action as string,
      entityType: req.query.entityType as string,
      fromDate: params.fromDate,
      toDate: params.toDate,
    });
    res.json({ success: true, ...buildPaginationResponse(result.logs, result.total, params) });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch activity logs" });
  }
});

// ── Global Search ────────────────────────────────────────────
router.get("/search", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const q = (req.query.q as string || "").trim();
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const types = req.query.types ? (req.query.types as string).split(",") : undefined;

    if (!q || q.length < 2) {
      return res.status(400).json({ error: "Query must be at least 2 characters" });
    }

    const results = await globalSearch(authReq.user!.organizationId, q, limit, types);
    res.json({ success: true, query: q, count: results.length, results });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Search failed" });
  }
});

// ── Health Check ─────────────────────────────────────────────
router.get("/health", async (_req: Request, res: Response) => {
  try {
    const health = await checkHealth();
    const statusCode = health.status === "healthy" ? 200 : health.status === "degraded" ? 200 : 503;
    res.status(statusCode).json({ success: health.status !== "unhealthy", ...health });
  } catch (error: any) {
    res.status(503).json({ success: false, error: error.message });
  }
});

// ── Data Recovery (soft-deleted records) ─────────────────────
router.get("/deleted", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const collection = req.query.collection as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const orgId = authReq.user!.organizationId;

    // Map collection names to models with deletedAt field
    const modelMap: Record<string, any> = {};
    // Dynamically get models that have deletedAt
    for (const name of Object.keys(mongoose.connections[0].models)) {
      const model = mongoose.model(name);
      if (model.schema.paths.deletedAt) {
        modelMap[name.toLowerCase()] = model;
      }
    }

    if (collection) {
      const model = modelMap[collection.toLowerCase()];
      if (!model) return res.status(400).json({ error: `Collection '${collection}' not found or doesn't support soft delete` });

      const filter = { deletedAt: { $ne: null } };
      // Add org filter if model has organizationId
      if (model.schema.paths.organizationId) {
        (filter as any).organizationId = orgId;
      }

      const skip = (page - 1) * limit;
      const [records, total] = await Promise.all([
        model.find(filter).sort({ deletedAt: -1 }).skip(skip).limit(limit).lean(),
        model.countDocuments(filter),
      ]);

      return res.json({
        success: true,
        collection,
        ...buildPaginationResponse(records, total, { page, limit, sortBy: "deletedAt", sortOrder: "desc" }),
      });
    }

    // List all collections that support soft delete
    res.json({
      success: true,
      collections: Object.keys(modelMap),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch deleted records" });
  }
});

router.post("/restore/:collection/:id", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { collection, id } = req.params;
    const orgId = authReq.user!.organizationId;

    const modelMap: Record<string, any> = {};
    for (const name of Object.keys(mongoose.connections[0].models)) {
      const model = mongoose.model(name);
      if (model.schema.paths.deletedAt) {
        modelMap[name.toLowerCase()] = model;
      }
    }

    const model = modelMap[collection.toLowerCase()];
    if (!model) return res.status(400).json({ error: `Collection '${collection}' not found` });

    const filter: any = { _id: id, deletedAt: { $ne: null } };
    if (model.schema.paths.organizationId) {
      filter.organizationId = orgId;
    }

    const restored = await model.findOneAndUpdate(
      filter,
      { $unset: { deletedAt: 1 }, $set: { updatedAt: new Date().toISOString() } },
      { new: true }
    ).lean();

    if (!restored) return res.status(404).json({ error: "Record not found or not deleted" });

    res.json({ success: true, restored });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to restore record" });
  }
});

// ── Bulk Operations ──────────────────────────────────────────
router.post("/bulk-delete", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { collection, ids, hard } = req.body;
    if (!collection || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "collection and ids array required" });
    }

    const modelMap: Record<string, any> = {};
    for (const name of Object.keys(mongoose.connections[0].models)) {
      const model = mongoose.model(name);
      modelMap[name.toLowerCase()] = model;
    }

    const model = modelMap[collection.toLowerCase()];
    if (!model) return res.status(400).json({ error: `Collection '${collection}' not found` });

    const filter: any = { _id: { $in: ids } };
    if (model.schema.paths.organizationId) {
      filter.organizationId = authReq.user!.organizationId;
    }

    let result;
    if (hard === true) {
      result = await model.deleteMany(filter);
    } else {
      result = await model.updateMany(filter, {
        $set: { deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      });
    }

    res.json({
      success: true,
      deleted: result.deletedCount ?? result.modifiedCount,
      hard: hard === true,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Bulk delete failed" });
  }
});

router.post("/bulk-restore", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { collection, ids } = req.body;
    if (!collection || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "collection and ids array required" });
    }

    const modelMap: Record<string, any> = {};
    for (const name of Object.keys(mongoose.connections[0].models)) {
      const model = mongoose.model(name);
      modelMap[name.toLowerCase()] = model;
    }

    const model = modelMap[collection.toLowerCase()];
    if (!model) return res.status(400).json({ error: `Collection '${collection}' not found` });

    const filter: any = { _id: { $in: ids }, deletedAt: { $ne: null } };
    if (model.schema.paths.organizationId) {
      filter.organizationId = authReq.user!.organizationId;
    }

    const result = await model.updateMany(filter, {
      $unset: { deletedAt: 1 },
      $set: { updatedAt: new Date().toISOString() },
    });

    res.json({ success: true, restored: result.modifiedCount });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Bulk restore failed" });
  }
});

export default router;
