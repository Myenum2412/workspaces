import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { openwaContacts } from "../services/openwa-contacts.js";

const router = Router();
router.use(authenticate);

router.get("/sessions/:sessionId/contacts", async (req: any, res) => {
  try {
    const contacts = await openwaContacts.getContacts(req.user!.organizationId, req.params.sessionId);
    res.json(contacts);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.get("/sessions/:sessionId/contacts/:contactId", async (req: any, res) => {
  try {
    const contact = await openwaContacts.getContactById(req.user!.organizationId, req.params.sessionId, req.params.contactId);
    res.json(contact);
  } catch (err: any) { res.status(404).json({ error: err.message }); }
});

router.get("/sessions/:sessionId/contacts/check/:number", async (req: any, res) => {
  try {
    const result = await openwaContacts.checkNumber(req.user!.organizationId, req.params.sessionId, req.params.number);
    res.json(result);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.get("/sessions/:sessionId/contacts/:contactId/profile-picture", async (req: any, res) => {
  try {
    const result = await openwaContacts.getProfilePicture(req.user!.organizationId, req.params.sessionId, req.params.contactId);
    res.json(result);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.post("/sessions/:sessionId/contacts/:contactId/block", async (req: any, res) => {
  try {
    const result = await openwaContacts.blockContact(req.user!.organizationId, req.params.sessionId, req.params.contactId);
    res.json(result);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.delete("/sessions/:sessionId/contacts/:contactId/block", async (req: any, res) => {
  try {
    const result = await openwaContacts.unblockContact(req.user!.organizationId, req.params.sessionId, req.params.contactId);
    res.json(result);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.post("/sessions/:sessionId/contacts/import", async (req: any, res) => {
  try {
    const result = await openwaContacts.importContacts(req.user!.organizationId, req.params.sessionId, req.body.contacts || []);
    res.json(result);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.get("/sessions/:sessionId/contacts/export", async (req: any, res) => {
  try {
    const contacts = await openwaContacts.exportContacts(req.user!.organizationId, req.params.sessionId);
    res.json(contacts);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
