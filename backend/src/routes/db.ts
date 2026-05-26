import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth.js";
import * as db from "../services/server-db.js";

const router = Router();
router.use(authenticate);

router.post("/", async (req: Request, res: Response) => {
  try {
    const { method, collectionId, documentId, queries, data } = req.body;

    switch (method) {
      case "listDocuments": {
        const result = await db.listDocuments(collectionId, queries);
        return res.json(result);
      }
      case "createDocument": {
        const result = await db.createDocument(collectionId, documentId, data);
        return res.json(result);
      }
      case "getDocument": {
        const result = await db.getDocument(collectionId, documentId);
        return res.json(result);
      }
      case "updateDocument": {
        const result = await db.updateDocument(collectionId, documentId, data);
        return res.json(result);
      }
      case "deleteDocument": {
        await db.deleteDocument(collectionId, documentId);
        return res.json({ success: true });
      }
      default:
        return res.status(400).json({ error: `Unknown method: ${method}` });
    }
  } catch (error: any) {
    console.error("[DB Proxy] Error:", error);
    return res.status(500).json({ error: error.message || "Database operation failed" });
  }
});

export default router;
