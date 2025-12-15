import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const get = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const document = await ctx.db
      .query("legalDocuments")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .first();
    
    const business = await ctx.db.get(args.businessId);

    return { document, business };
  },
});

export const getMyLegalDocument = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const business = await ctx.db
      .query("businesses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!business) return null;

    const document = await ctx.db
      .query("legalDocuments")
      .withIndex("by_business", (q) => q.eq("businessId", business._id))
      .first();

    return { document, business };
  },
});

export const save = mutation({
  args: {
    businessId: v.id("businesses"),
    content: v.string(),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const business = await ctx.db.get(args.businessId);
    if (!business || business.userId !== userId) {
      throw new Error("Unauthorized access to business");
    }

    const existing = await ctx.db
      .query("legalDocuments")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        content: args.content,
        title: args.title,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("legalDocuments", {
        businessId: args.businessId,
        content: args.content,
        title: args.title,
        updatedAt: Date.now(),
      });
    }
  },
});
