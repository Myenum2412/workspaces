import { Router, Request, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { UserProfile, OrgMember, Organization } from "../models/index.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { sendSignupWelcomeEmail } from "../email/resend.js";

const router = Router();
router.use(authenticate);

// List all staff
router.get("/", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const actor = authReq.user!;
    const member = await OrgMember.findOne({ userId: actor.userId }).lean() as any;
    
    let query: any = {};
    if (member?.organizationId) {
      query.organizationId = member.organizationId;
    }
    
    const staffs = await UserProfile.find(query).lean();
    res.json({ success: true, staffs });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to list staff" });
  }
});

// Create staff
router.post("/", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const actor = authReq.user!;
    const member = await OrgMember.findOne({ userId: actor.userId }).lean() as any;
    const organizationId = member?.organizationId || req.body.orgId || "";

    const newUserId = crypto.randomUUID();
    
    // Check email
    if (req.body.email) {
      const existing = await UserProfile.findOne({ email: req.body.email }).lean();
      if (existing) return res.status(400).json({ error: "Email already in use" });
    }

    let passwordHash = undefined;
    const rawPassword = req.body.password || "Password@123";
    if (rawPassword) {
      passwordHash = await bcrypt.hash(rawPassword, 10);
    }

    const newStaff = await UserProfile.create({
      userId: req.body.userId || newUserId,
      email: req.body.email || "",
      passwordHash,
      avatarUrl: req.body.avatarUrl || "",
      firstName: req.body.firstName || "",
      lastName: req.body.lastName || "",
      phone: req.body.mobile || req.body.phone || "",
      designation: req.body.designation || "Staff",
      department: req.body.department || "",
      status: req.body.status || "Active",
      organizationId,
      role: req.body.role || "staff",
      empId: req.body.empId || `EMP-${Date.now().toString().slice(-4)}`,
      joiningDate: req.body.joiningDate || new Date().toISOString(),
      employmentType: req.body.employmentType || "Full Time",
      currentExperience: req.body.currentExperience || "",
      totalExperience: req.body.totalExperience || "",
      dob: req.body.dob || "",
      gender: req.body.gender || "",
      maritalStatus: req.body.maritalStatus || "",
      sourceOfHire: req.body.sourceOfHire || "",
      bio: req.body.bio || "",
      expertise: req.body.expertise || [],
      pan: req.body.pan || "",
      aadhaar: req.body.aadhaar || "",
      uan: req.body.uan || "",
      presentAddress: req.body.presentAddress || "",
      permanentAddress: req.body.permanentAddress || "",
      personalPhone: req.body.personalPhone || "",
      personalEmail: req.body.personalEmail || "",
      category: req.body.category || "",
      workExperience: req.body.workExperience || [],
      educationDetails: req.body.educationDetails || [],
      dependentDetails: req.body.dependentDetails || [],
    });

    if (organizationId) {
      await OrgMember.create({
        organizationId,
        userId: newStaff.userId,
        role: newStaff.role,
        status: "active",
        joinedAt: new Date()
      });
    }

    // Send welcome email
    if (req.body.email) {
      try {
        await sendSignupWelcomeEmail({
          to: req.body.email,
          name: req.body.firstName || "Staff Member",
          password: rawPassword,
          verifyUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
        });
      } catch (emailErr) {
        console.warn("Failed to send welcome email:", emailErr);
      }
    }

    res.json({ success: true, staff: newStaff });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to create staff" });
  }
});

// Get staff by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const staff = await UserProfile.findById(req.params.id).lean();
    if (!staff) return res.status(404).json({ error: "Staff not found" });
    res.json({ success: true, staff });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to get staff" });
  }
});

// Update staff
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const staff = await UserProfile.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!staff) return res.status(404).json({ error: "Staff not found" });
    res.json({ success: true, staff });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update staff" });
  }
});

// Delete staff (soft delete)
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const staff = await UserProfile.findOneAndUpdate(
      { _id: req.params.id, organizationId: authReq.user!.organizationId },
      { $set: { deletedAt: new Date().toISOString() } },
      { new: true }
    );
    if (!staff) return res.status(404).json({ error: "Staff not found" });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete staff" });
  }
});

// Restore staff
router.post("/:id/restore", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const restored = await UserProfile.findOneAndUpdate(
      { _id: req.params.id, organizationId: authReq.user!.organizationId, deletedAt: { $ne: null } },
      { $unset: { deletedAt: 1 } },
      { new: true }
    ).lean();
    if (!restored) return res.status(404).json({ error: "Staff not found or not deleted" });
    res.json({ success: true, staff: restored });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to restore staff" });
  }
});

export default router;
