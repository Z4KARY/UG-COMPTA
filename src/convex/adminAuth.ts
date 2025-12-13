import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const setAdminRole = mutation({
  args: { password: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Verify password
    const adminPasswordEnv = (typeof process !== "undefined" ? process.env.ADMIN_PASSWORD : undefined) || "92cd579afa431fed705c6e706d8fac90f73fc90c5ea0236be5c5791d9e66e9a1";
    
    const encoder = new TextEncoder();
    const data = encoder.encode(args.password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const inputHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    const isHash = /^[a-f0-9]{64}$/i.test(adminPasswordEnv);
    const passwordValid = isHash ? inputHash === adminPasswordEnv : args.password === adminPasswordEnv;
    
    if (!passwordValid) {
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
