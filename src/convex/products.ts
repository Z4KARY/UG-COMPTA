import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const business = await ctx.db.get(args.businessId);
    if (!business || business.userId !== userId) return [];

    return await ctx.db
      .query("products")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();
  },
});

export const create = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    unitPrice: v.number(),
    tvaRate: v.number(),
    defaultDiscount: v.optional(v.number()),
    type: v.optional(v.union(v.literal("goods"), v.literal("service"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const business = await ctx.db.get(args.businessId);
    if (!business || business.userId !== userId) throw new Error("Unauthorized");

    return await ctx.db.insert("products", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("products"),
    name: v.optional(v.string()),
    unitPrice: v.optional(v.number()),
    tvaRate: v.optional(v.number()),
    defaultDiscount: v.optional(v.number()),
    type: v.optional(v.union(v.literal("goods"), v.literal("service"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const product = await ctx.db.get(args.id);
    if (!product) throw new Error("Not found");

    const business = await ctx.db.get(product.businessId);
    if (!business || business.userId !== userId) throw new Error("Unauthorized");

    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const product = await ctx.db.get(args.id);
    if (!product) throw new Error("Not found");

    const business = await ctx.db.get(product.businessId);
    if (!business || business.userId !== userId) throw new Error("Unauthorized");

    await ctx.db.delete(args.id);
  },
});