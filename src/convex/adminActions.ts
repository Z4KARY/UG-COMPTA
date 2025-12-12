"use node";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { createHash } from "crypto";

export const verifyAdminPassword = action({
  args: { password: v.string() },
  handler: async (ctx, args) => {
    const adminPasswordEnv = process.env.ADMIN_PASSWORD;
    if (!adminPasswordEnv) {
      throw new Error("ADMIN_PASSWORD environment variable is not set. Please set it in the Convex dashboard.");
    }

    // Hash the provided password
    const inputHash = createHash("sha256").update(args.password).digest("hex");
    
    // Check if env var looks like a SHA-256 hash (64 hex characters)
    const isHash = /^[a-f0-9]{64}$/i.test(adminPasswordEnv);
    
    if (isHash) {
      return inputHash === adminPasswordEnv;
    } else {
      // Fallback for plain text (legacy)
      // We support plain text for backward compatibility during migration
      return args.password === adminPasswordEnv;
    }
  },
});

export const generateAdminPasswordHash = action({
  args: { password: v.string() },
  handler: async (ctx, args) => {
    return createHash("sha256").update(args.password).digest("hex");
  },
});
