import { v } from "convex/values";
import { mutation, action } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Verifies if the provided password matches the admin password.
 * This action can be called from anywhere to verify admin credentials.
 */
export const verifyAdminPassword = action({
  args: { password: v.string() },
  handler: async (ctx, args) => {
    const adminPasswordEnv = (typeof process !== "undefined" ? process.env.ADMIN_PASSWORD : undefined) || "92cd579afa431fed705c6e706d8fac90f73fc90c5ea0236be5c5791d9e66e9a1";
    
    const encoder = new TextEncoder();
    const data = encoder.encode(args.password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const inputHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    const isHash = /^[a-f0-9]{64}$/i.test(adminPasswordEnv);
    
    if (isHash) {
      return inputHash === adminPasswordEnv;
    } else {
      return args.password === adminPasswordEnv;
    }
  },
});

/**
 * Generates a SHA-256 hash for a given password.
 * Useful for creating hashed passwords to store in environment variables.
 */
export const generateAdminPasswordHash = action({
  args: { password: v.string() },
  handler: async (ctx, args) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(args.password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },
});

/**
 * Helper function to hash a password using SHA-256.
 * This is a synchronous version for use in mutations.
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Helper function to verify admin password.
 * Can be used in both mutations and actions.
 */
async function verifyPassword(password: string): Promise<boolean> {
  const adminPasswordEnv = (typeof process !== "undefined" ? process.env.ADMIN_PASSWORD : undefined) || "92cd579afa431fed705c6e706d8fac90f73fc90c5ea0236be5c5791d9e66e9a1";
  
  const inputHash = await hashPassword(password);
  const isHash = /^[a-f0-9]{64}$/i.test(adminPasswordEnv);
  
  if (isHash) {
    return inputHash === adminPasswordEnv;
  } else {
    return password === adminPasswordEnv;
  }
}

/**
 * Sets the admin role for the currently authenticated user after verifying the password.
 */
export const setAdminRole = mutation({
  args: { password: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Verify password using the helper function
    const isValid = await verifyPassword(args.password);
    
    if (!isValid) {
      throw new Error("Invalid password");
    }

    // Set admin role
    await ctx.db.patch(userId, { 
      roleGlobal: "ADMIN",
      role: "admin"
    });
    
    return true;
  },
});