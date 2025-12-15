import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const business = await ctx.db.get(args.businessId);
    if (!business) return [];
    
    if (business.userId !== userId) {
        const member = await ctx.db
            .query("businessMembers")
            .withIndex("by_business_and_user", (q) => q.eq("businessId", args.businessId).eq("userId", userId))
            .first();
        if (!member) return [];
    }

    return await ctx.db
      .query("webhookSubscriptions")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();
  },
});

export const create = mutation({
  args: {
    businessId: v.id("businesses"),
    targetUrl: v.string(),
    events: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const business = await ctx.db.get(args.businessId);
    if (!business || business.userId !== userId) throw new Error("Unauthorized");

    // Generate a random secret
    const secret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    return await ctx.db.insert("webhookSubscriptions", {
      businessId: args.businessId,
      targetUrl: args.targetUrl,
      events: args.events,
      secret,
      isActive: true,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("webhookSubscriptions"),
    targetUrl: v.optional(v.string()),
    events: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const sub = await ctx.db.get(args.id);
    if (!sub) throw new Error("Not found");

    const business = await ctx.db.get(sub.businessId);
    if (!business || business.userId !== userId) throw new Error("Unauthorized");

    await ctx.db.patch(args.id, {
      targetUrl: args.targetUrl,
      events: args.events,
      isActive: args.isActive,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("webhookSubscriptions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const sub = await ctx.db.get(args.id);
    if (!sub) throw new Error("Not found");

    const business = await ctx.db.get(sub.businessId);
    if (!business || business.userId !== userId) throw new Error("Unauthorized");

    await ctx.db.delete(args.id);
  },
});

export const getSubscriptionsForEvent = internalQuery({
    args: { businessId: v.id("businesses"), event: v.string() },
    handler: async (ctx, args) => {
        const subs = await ctx.db
            .query("webhookSubscriptions")
            .withIndex("by_business", q => q.eq("businessId", args.businessId))
            .filter(q => q.eq(q.field("isActive"), true))
            .collect();
        
        // Filter in memory for the specific event in the list
        return subs.filter(s => s.events.includes(args.event));
    }
});