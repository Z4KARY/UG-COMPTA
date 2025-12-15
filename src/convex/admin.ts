import { v } from "convex/values";
import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

async function checkAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthorized");
  
  const user = await ctx.db.get(userId);
  if (user?.role !== "admin") {
    throw new Error("Access denied: Admins only");
  }
  return user;
}

export const listBusinesses = query({
  args: {},
  handler: async (ctx) => {
    await checkAdmin(ctx);
    const businesses = await ctx.db.query("businesses").order("desc").take(100);
    
    // Enrich with owner info
    const enriched = await Promise.all(businesses.map(async (b) => {
        const owner = await ctx.db.get(b.userId);
        return {
            ...b,
            ownerName: owner?.name || owner?.email || "Unknown",
            ownerEmail: owner?.email,
        };
    }));
    
    return enriched;
  },
});

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    await checkAdmin(ctx);
    return await ctx.db.query("users").order("desc").take(100);
  },
});

export const listContactRequests = query({
  args: {},
  handler: async (ctx) => {
    await checkAdmin(ctx);
    return await ctx.db.query("contactRequests").order("desc").take(100);
  },
});

export const toggleBusinessSuspension = mutation({
  args: { id: v.id("businesses"), suspend: v.boolean() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    await ctx.db.patch(args.id, { isSuspended: args.suspend });
    
    // Log action?
    // We can use internal audit log if we want, but for now simple patch is fine.
  },
});

export const toggleUserSuspension = mutation({
  args: { id: v.id("users"), suspend: v.boolean() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    await ctx.db.patch(args.id, { isSuspended: args.suspend });
  },
});

export const updateUserRole = mutation({
  args: { 
    id: v.id("users"), 
    role: v.union(v.literal("NORMAL"), v.literal("ACCOUNTANT"), v.literal("ADMIN")) 
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    
    const updates: any = { roleGlobal: args.role };
    
    // Sync legacy/auth role field for compatibility
    if (args.role === "ADMIN") {
      updates.role = "admin";
    } else {
      updates.role = "user";
    }
    
    await ctx.db.patch(args.id, updates);
  },
});

export const updateContactRequestStatus = mutation({
  args: { 
    id: v.id("contactRequests"), 
    status: v.union(v.literal("new"), v.literal("contacted"), v.literal("closed")) 
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const getGlobalFiscalParameters = query({
  args: {},
  handler: async (ctx) => {
    await checkAdmin(ctx);
    return await ctx.db
        .query("fiscalParameters")
        .withIndex("by_business_and_code", (q) => q.eq("businessId", undefined))
        .collect();
  },
});