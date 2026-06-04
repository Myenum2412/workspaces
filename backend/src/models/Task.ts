import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITask {
  _id: string;
  organizationId: string;
  workspaceId: string;
  projectId: string | null;
  taskNo: string;
  title: string;
  description: string;
  assignedTo: string | null;
  assignedType: string;
  assignedBy: string;
  status: string;
  priority: string;
  startDate: Date | null;
  dueDate: Date | null;
  completedAt: Date | null;
  reviewedBy: string | null;
  reviewNotes: string | null;
  tags: string[];
  reallocationHistory: unknown[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface ITaskDocument extends ITask, Document<string> {}

const TaskSchema = new Schema<ITaskDocument>({
  _id: { type: String },
  organizationId: { type: String, required: true, index: true },
  workspaceId: { type: String, required: true, index: true },
  projectId: { type: String, default: null, index: true },
  taskNo: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  assignedTo: { type: String, default: null, index: true },
  assignedType: { type: String, enum: ["member", "team"], default: "member" },
  assignedBy: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "assigned", "in_progress", "under_review", "completed", "rejected", "on_hold"],
    default: "pending",
  },
  priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
  startDate: { type: Date, default: null },
  dueDate: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  reviewedBy: { type: String, default: null },
  reviewNotes: { type: String, default: null },
  tags: [{ type: String }],
  reallocationHistory: [{ type: Schema.Types.Mixed, default: [] }],
  deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true });

TaskSchema.index({ workspaceId: 1, taskNo: 1 }, { unique: true });
TaskSchema.index({ workspaceId: 1, status: 1 });
TaskSchema.index({ workspaceId: 1, assignedTo: 1 });
TaskSchema.index({ organizationId: 1, title: "text", description: "text" });

export const Task: Model<ITaskDocument> =
  mongoose.models.Task || mongoose.model<ITaskDocument>("Task", TaskSchema);
