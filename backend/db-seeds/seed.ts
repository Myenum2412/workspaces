import bcrypt from "bcryptjs";
import crypto from "crypto";
import mongoose from "mongoose";
import "dotenv/config";
import { User, Organization, Workspace, OrgMember, BrandingConfig } from "../src/models/index.js";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error("MONGODB_URI not set"); process.exit(1); }
  await mongoose.connect(uri);

  const email = "admin@myenum.in";
  const existing = await User.findOne({ email, deletedAt: null }).lean();
  if (existing) { console.log("Seed data already exists"); await mongoose.disconnect(); return; }

  const passwordHash = await bcrypt.hash("Admin@123456", 12);
  const userId = crypto.randomUUID();
  const orgId = crypto.randomUUID();
  const wsId = crypto.randomUUID();

  await Promise.all([
    Organization.create({ _id: orgId, name: "MyEnum Inc.", slug: "myenum-inc", email, ownerEmail: email, ownerId: userId, status: "active", industry: "Technology", size: "10-50" }),
    Workspace.create({ _id: wsId, organizationId: orgId, name: "Main Workspace", createdBy: userId }),
    User.create({ _id: userId, email, passwordHash, firstName: "Admin", lastName: "User", role: "SUPER_ADMIN", status: "active", emailVerified: true }),
    OrgMember.create({ organizationId: orgId, workspaceId: wsId, userId, role: "ORG_ADMIN", status: "active", invitedBy: "system", joinedAt: new Date() }),
    BrandingConfig.create({ organizationId: orgId, presetName: "emerald", mode: "light", colors: { primary: "#059669", primaryHover: "#047857" } }),
  ]);

  console.log("✅ Seed data created:");
  console.log(`   Email: ${email}`);
  console.log("   Password: Admin@123456");
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
