import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getMyBusiness = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const business = await ctx.db
      .query("businesses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return business;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    address: v.string(),
    rc: v.optional(v.string()),
    nif: v.optional(v.string()),
    ai: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    currency: v.string(),
    tvaDefault: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("businesses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      throw new Error("User already has a business");
    }

    const businessId = await ctx.db.insert("businesses", {
      userId,
      ...args,
    });

    return businessId;
  },
});

export const update = mutation({
  args: {
    id: v.id("businesses"),
    name: v.optional(v.string()),
    address: v.optional(v.string()),
    rc: v.optional(v.string()),
    nif: v.optional(v.string()),
    ai: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    currency: v.optional(v.string()),
    tvaDefault: v.optional(v.number()),
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
