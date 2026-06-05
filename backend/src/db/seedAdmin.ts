import bcrypt from "bcryptjs";
import { User } from "../models/index.js";
import { env } from "../config/env.js";
import { logger } from "../core/logging/logger.js";
import crypto from "crypto";

export async function seedDefaultAdmin() {
  try {
    const adminEmail = "developer@myenum.in";
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      logger.info("Default Organization Admin not found. Creating...");
      
      const passwordHash = await bcrypt.hash("@Meenu2412", env.BCRYPT_ROUNDS || 10);
      
      const admin = new User({
        _id: crypto.randomUUID(),
        email: adminEmail,
        passwordHash,
        firstName: "Organization",
        lastName: "Admin",
        role: "SUPER_ADMIN",
        status: "active",
        emailVerified: true,
      });

      await admin.save();
      logger.info("Default Organization Admin created successfully.");
    } else {
      logger.info("Default Organization Admin already exists.");
    }
  } catch (error) {
    logger.error({ error }, "Error seeding default admin");
  }
}
