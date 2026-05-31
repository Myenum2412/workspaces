import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { openwaGroups } from "../services/openwa-groups.js";

const router = Router();
router.use(authenticate);

router.get("/sessions/:sessionId/groups", async (req: any, res) => {
  try {
    const groups = await openwaGroups.getGroups(req.user!.organizationId, req.params.sessionId);
    res.json(groups);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.get("/sessions/:sessionId/groups/:groupId", async (req: any, res) => {
  try {
    const info = await openwaGroups.getGroupInfo(req.user!.organizationId, req.params.sessionId, req.params.groupId);
    res.json(info);
  } catch (err: any) { res.status(404).json({ error: err.message }); }
});

router.post("/sessions/:sessionId/groups", async (req: any, res) => {
  try {
    const { name, participants } = req.body;
    if (!name || !participants) return res.status(400).json({ error: "name and participants required" });
    const result = await openwaGroups.createGroup(req.user!.organizationId, req.params.sessionId, name, participants);
    res.status(201).json(result);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.post("/sessions/:sessionId/groups/:groupId/participants", async (req: any, res) => {
  try {
    const result = await openwaGroups.addParticipants(req.user!.organizationId, req.params.sessionId, req.params.groupId, req.body.participants || []);
    res.json(result);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.delete("/sessions/:sessionId/groups/:groupId/participants", async (req: any, res) => {
  try {
    const result = await openwaGroups.removeParticipants(req.user!.organizationId, req.params.sessionId, req.params.groupId, req.body.participants || []);
    res.json(result);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.post("/sessions/:sessionId/groups/:groupId/participants/promote", async (req: any, res) => {
  try {
    const result = await openwaGroups.promoteParticipants(req.user!.organizationId, req.params.sessionId, req.params.groupId, req.body.participants || []);
    res.json(result);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.post("/sessions/:sessionId/groups/:groupId/participants/demote", async (req: any, res) => {
  try {
    const result = await openwaGroups.demoteParticipants(req.user!.organizationId, req.params.sessionId, req.params.groupId, req.body.participants || []);
    res.json(result);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.put("/sessions/:sessionId/groups/:groupId/subject", async (req: any, res) => {
  try {
    const result = await openwaGroups.setGroupSubject(req.user!.organizationId, req.params.sessionId, req.params.groupId, req.body.subject);
    res.json(result);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.put("/sessions/:sessionId/groups/:groupId/description", async (req: any, res) => {
  try {
    const result = await openwaGroups.setGroupDescription(req.user!.organizationId, req.params.sessionId, req.params.groupId, req.body.description);
    res.json(result);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.post("/sessions/:sessionId/groups/:groupId/leave", async (req: any, res) => {
  try {
    const result = await openwaGroups.leaveGroup(req.user!.organizationId, req.params.sessionId, req.params.groupId);
    res.json(result);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.get("/sessions/:sessionId/groups/:groupId/invite-code", async (req: any, res) => {
  try {
    const result = await openwaGroups.getGroupInviteCode(req.user!.organizationId, req.params.sessionId, req.params.groupId);
    res.json(result);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.post("/sessions/:sessionId/groups/:groupId/invite-code/revoke", async (req: any, res) => {
  try {
    const result = await openwaGroups.revokeGroupInviteCode(req.user!.organizationId, req.params.sessionId, req.params.groupId);
    res.json(result);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

export default router;
