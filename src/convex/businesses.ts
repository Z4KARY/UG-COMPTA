import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getMyBusiness = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    if (args.businessId) {
        const business = await ctx.db.get(args.businessId);
        // Check ownership or membership
        if (business?.userId === userId) return business;
        
        const member = await ctx.db
            .query("businessMembers")
            .withIndex("by_business_and_user", (q) => q.eq("businessId", args.businessId!).eq("userId", userId))
            .first();
            
        if (member) return business;
        return null;
    }

    // Default: return first owned business
    const business = await ctx.db
      .query("businesses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (business) return business;

    // Or first member business
    const member = await ctx.db
        .query("businessMembers")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();
    
    if (member) {
        return await ctx.db.get(member.businessId);
    }

    return null;
  },
});

export const listMyBusinesses = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return [];

        const owned = await ctx.db
            .query("businesses")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        const memberships = await ctx.db
            .query("businessMembers")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        const memberBusinesses = await Promise.all(
            memberships.map(m => ctx.db.get(m.businessId))
        );

        // Deduplicate and return
        const all = [...owned, ...memberBusinesses.filter(b => b !== null)];
        const seen = new Set();
        return all.filter(b => {
            if (!b) return false;
            if (seen.has(b._id)) return false;
            seen.add(b._id);
            return true;
        });
    }
});

export const create = mutation({
  args: {
    name: v.string(),
    tradeName: v.optional(v.string()),
    address: v.string(),
    city: v.optional(v.string()),
    rc: v.optional(v.string()),
    nif: v.optional(v.string()),
    ai: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    currency: v.string(),
    tvaDefault: v.number(),
    fiscalRegime: v.optional(v.union(v.literal("VAT"), v.literal("IFU"), v.literal("OTHER"))),
    bankName: v.optional(v.string()),
    bankIban: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // Removed single business restriction

    const businessId = await ctx.db.insert("businesses", {
      userId,
      ...args,
    });

    // Add as owner in members table
    await ctx.db.insert("businessMembers", {
        businessId,
        userId,
        role: "owner",
        joinedAt: Date.now(),
    });

    return businessId;
  },
});

export const update = mutation({
  args: {
    id: v.id("businesses"),
    name: v.optional(v.string()),
    tradeName: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    rc: v.optional(v.string()),
    nif: v.optional(v.string()),
    ai: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    currency: v.optional(v.string()),
    tvaDefault: v.optional(v.number()),
    fiscalRegime: v.optional(v.union(v.literal("VAT"), v.literal("IFU"), v.literal("OTHER"))),
    bankName: v.optional(v.string()),
    bankIban: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const business = await ctx.db.get(args.id);
    if (!business || business.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});