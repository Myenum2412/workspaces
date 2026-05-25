import { Router, Response } from "express";
import { Task } from "../models/Task.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

// List tasks for logged-in user
router.get("/", async (req: AuthRequest, res: Response) => {
  const tasks = await Task.find({ userEmail: req.userEmail }).sort({ createdAt: -1 });
  res.json(tasks);
});

// Create task
router.post("/", async (req: AuthRequest, res: Response) => {
  const { title, description, status, priority } = req.body;
  if (!title) return res.status(400).json({ error: "Title required" });

  const task = await Task.create({
    title,
    description: description || "",
    status: status || "todo",
    priority: priority || "medium",
    userEmail: req.userEmail,
  });
  res.status(201).json(task);
});

// Update task
router.put("/:id", async (req: AuthRequest, res: Response) => {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, userEmail: req.userEmail },
    { $set: req.body },
    { new: true }
  );
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(task);
});

// Delete task
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, userEmail: req.userEmail });
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json({ message: "Deleted" });
});

export default router;
