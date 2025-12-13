import { v } from "convex/values";
import { action } from "./_generated/server";

export const verifyAdminPassword = action({
  args: { password: v.string() },
  handler: async (ctx, args) => {
    const adminPasswordEnv = typeof process !== "undefined" ? process.env.ADMIN_PASSWORD : undefined;
    if (!adminPasswordEnv) {
      throw new Error("ADMIN_PASSWORD environment variable is not set. Please set it in the Convex dashboard.");
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(args.password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const inputHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    const isHash = /^[a-f0-9]{64}$/i.test(adminPasswordEnv);
    
    if (isHash) {
      return inputHash === adminPasswordEnv;
    } else {
      // Fallback for plain text (legacy)
      return args.password === adminPasswordEnv;
    }
  },
});

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