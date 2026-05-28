import { connectDB } from "../config/connection.js";
import * as models from "../models/index.js";
import { publishChange } from "../ws/server.js";

const MODEL_MAP: Record<string, string> = {
  organizations: "Organization",
  user_profiles: "UserProfile",
  org_members: "OrgMember",
  org_invitations: "OrgInvitation",
  clients: "Client",
  tasks: "Task",
  teams: "Team",
  branches: "Branch",
  saved_tasks: "SavedTask",
  master_data: "MasterData",
};

function mongoField(field: string): string {
  if (field === "$id") return "_id";
  if (field.startsWith("$")) return field.slice(1);
  return field;
}

function buildMongoQuery(queries?: any[]) {
  if (!queries || queries.length === 0) return {};
  const filter: Record<string, any> = {};
  let limitVal: number | undefined;
  let sortObj: Record<string, 1 | -1> | undefined;

  for (const q of queries) {
    if (q.operator === "equal") filter[mongoField(q.field)] = q.value;
    else if (q.operator === "limit") limitVal = q.value;
    else if (q.operator === "orderDesc") sortObj = { ...sortObj, [mongoField(q.field)]: -1 };
    else if (q.operator === "orderAsc") sortObj = { ...sortObj, [mongoField(q.field)]: 1 };
  }

  return { filter, limit: limitVal, sort: sortObj };
}

export async function listDocuments(collectionId: string, queries?: any[]) {
  await connectDB();
  const Model = models[MODEL_MAP[collectionId] as keyof typeof models] as any;
  const { filter, limit: limitVal, sort } = buildMongoQuery(queries);

  // Get total count of all matching docs (ignoring limit/token-based pagination)
  const total = await Model.countDocuments(filter);

  let query = Model.find(filter);
  if (sort) query = query.sort(sort);
  if (limitVal) query = query.limit(limitVal);
  const docs = await query.lean();

  const mapped = docs.map((d: any) => ({
    ...d,
    $id: d._id.toString(),
    $createdAt: d.createdAt?.toISOString?.() ?? d.createdAt ?? "",
    $updatedAt: d.updatedAt?.toISOString?.() ?? d.updatedAt ?? "",
  }));
  return { total, documents: mapped };
}

export async function createDocument(collectionId: string, documentId: string, data: Record<string, unknown>) {
  await connectDB();
  const Model = models[MODEL_MAP[collectionId] as keyof typeof models] as any;
  const doc = await Model.create({ ...data, _id: documentId || undefined });
  const result = { ...doc.toObject(), $id: doc._id.toString() };
  publishChange(collectionId, { action: "create", collection: collectionId, document: result });
  return result;
}

export async function getDocument(collectionId: string, documentId: string) {
  await connectDB();
  const Model = models[MODEL_MAP[collectionId] as keyof typeof models] as any;
  const doc = await Model.findById(documentId).lean();
  if (!doc) throw new Error("Document not found");
  return { ...doc, $id: (doc as any)._id.toString() };
}

export async function updateDocument(collectionId: string, documentId: string, data: Record<string, unknown>) {
  await connectDB();
  const Model = models[MODEL_MAP[collectionId] as keyof typeof models] as any;
  const doc = await Model.findByIdAndUpdate(documentId, { $set: data }, { new: true }).lean();
  if (!doc) throw new Error("Document not found");
  const result = { ...doc, $id: (doc as any)._id.toString() };
  publishChange(collectionId, { action: "update", collection: collectionId, document: result });
  return result;
}

export async function deleteDocument(collectionId: string, documentId: string) {
  await connectDB();
  const Model = models[MODEL_MAP[collectionId] as keyof typeof models] as any;
  await Model.findByIdAndDelete(documentId);
  publishChange(collectionId, { action: "delete", collection: collectionId, documentId });
}
