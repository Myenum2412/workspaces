import { describe, it, expect, beforeAll, afterAll } from "vitest";
import mongoose from "mongoose";
import { authService } from "../services/authService.js";

describe("AuthService", () => {
  beforeAll(async () => {
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/workspace_test";
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  it("should register a new user with organization", async () => {
    const result = await authService.register({
      firstName: "Test", lastName: "User",
      email: `test-${Date.now()}@example.com`,
      password: "SecurePass123!", companyName: "Test Corp",
    });
    expect(result.user.email).toContain("test-");
    expect(result.organizationId).toBeDefined();
  });

  it("should throw on duplicate email", async () => {
    const email = `dup-${Date.now()}@example.com`;
    await authService.register({ firstName: "First", lastName: "User", email, password: "SecurePass123!", companyName: "Test" });
    await expect(
      authService.register({ firstName: "Second", lastName: "User", email, password: "SecurePass123!", companyName: "Test2" }),
    ).rejects.toThrow("Email already registered");
  });

  it("should throw on invalid login", async () => {
    await expect(authService.login("nonexistent@example.com", "wrong", "", "")).rejects.toThrow("Invalid email or password");
  });
});
