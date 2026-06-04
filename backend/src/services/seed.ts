/**
 * Seed service — creates default system data on first startup.
 * Seeds:
 *   1. Default organization
 *   2. Default admin user profile (developer@myenum.in)
 *   3. Default org member record linking the admin to the org
 */
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Organization, UserProfile, OrgMember } from "../models/index.js";
import { connectDB } from "../config/connection.js";

export const seedDefaultAdmin = async () => {
  try {
    await connectDB();

    const adminEmail = "developer@myenum.in";

    // Check if admin already exists
    const existing = await UserProfile.findOne({ email: adminEmail }).lean();
    if (existing) return;

    const now = new Date().toISOString();
    const orgId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    const passwordHash = await bcrypt.hash("Myenum2412", 12);

    // 1. Create default organization
    await Organization.create({
      _id: orgId,
      name: "MyEnum",
      category: "Technology",
      companyRange: "1-10",
      email: adminEmail,
      ownerEmail: adminEmail,
      ownerId: userId,
      logoUrl: "",
      industry: "Technology",
      size: "1-10",
      status: "active",
      settings: {},
      hrSettings: {},
      themeSettings: {},
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    // 2. Create admin user profile
    await UserProfile.create({
      _id: userId,
      organizationId: orgId,
      workspaceId: null,  // Org admin has no specific workspace
      userId,
      firstName: "Developer",
      lastName: "Admin",
      email: adminEmail,
      passwordHash,
      phone: "",
      designation: "System Administrator",
      department: "Engineering",
      avatarUrl: "",
      bio: "",
      expertise: [],
      empId: "EMP-ADMIN-001",
      joiningDate: now,
      employmentType: "full_time",
      status: "active",
      terminationDate: null,
      terminationReason: null,
      lastLogin: null,
      loginCount: 0,
      emailVerified: true,
      teamIds: [],
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    // 3. Create org member record
    await OrgMember.create({
      _id: crypto.randomUUID(),
      organizationId: orgId,
      workspaceId: null,
      userId,
      role: "ORG_ADMIN",
      status: "active",
      invitedBy: "",
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    console.log(`✅ Default admin seeded: ${adminEmail}`);
  } catch (error) {
    console.error("❌ Failed to seed default data:", error);
  }
};
