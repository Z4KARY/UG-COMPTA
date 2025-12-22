import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";

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
      .query("products")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();
  },
});

export const search = query({
  args: { businessId: v.id("businesses"), query: v.string() },
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
      .query("products")
      .withSearchIndex("search_name", (q) => 
        q.search("name", args.query).eq("businessId", args.businessId)
      )
      .take(10);
  },
});

export const create = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    unitPrice: v.number(),
    tvaRate: v.number(),
    defaultDiscount: v.optional(v.number()),
    unitLabel: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    type: v.optional(v.union(v.literal("goods"), v.literal("service"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const business = await ctx.db.get(args.businessId);
    if (!business || business.userId !== userId) throw new Error("Unauthorized");

    const productData: any = { ...args, isActive: args.isActive ?? true };
    Object.keys(productData).forEach(key => {
        if (productData[key] === undefined) {
            delete productData[key];
        }
    });

    const productId = await ctx.db.insert("products", productData);

    await ctx.scheduler.runAfter(0, internal.audit.log, {
        businessId: args.businessId,
        userId,
        entityType: "PRODUCT",
        entityId: productId,
        action: "CREATE",
        payloadAfter: args,
    });

    return productId;
  },
});

export const update = mutation({
  args: {
    id: v.id("products"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    unitPrice: v.optional(v.number()),
    tvaRate: v.optional(v.number()),
    defaultDiscount: v.optional(v.number()),
    unitLabel: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
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
    const updateData: any = { ...updates };
    Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
            delete updateData[key];
        }
    });

    await ctx.db.patch(id, updateData);

    await ctx.scheduler.runAfter(0, internal.audit.log, {
        businessId: product.businessId,
        userId,
        entityType: "PRODUCT",
        entityId: id,
        action: "UPDATE",
        payloadBefore: product,
        payloadAfter: updates,
    });
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

    await ctx.scheduler.runAfter(0, internal.audit.log, {
        businessId: product.businessId,
        userId,
        entityType: "PRODUCT",
        entityId: args.id,
        action: "DELETE",
        payloadBefore: product,
    });
  },
});

export const createBatch = internalMutation({
  args: {
    businessId: v.id("businesses"),
    userId: v.id("users"),
    products: v.array(v.object({
      name: v.string(),
      description: v.optional(v.string()),
      unitPrice: v.number(),
      tvaRate: v.number(),
      defaultDiscount: v.optional(v.number()),
      unitLabel: v.optional(v.string()),
      isActive: v.optional(v.boolean()),
      type: v.optional(v.union(v.literal("goods"), v.literal("service"))),
    })),
  },
  handler: async (ctx, args) => {
    const results = [];
    for (const product of args.products) {
      try {
        const id = await ctx.db.insert("products", {
          businessId: args.businessId,
          ...product,
          isActive: product.isActive ?? true,
        });
        results.push({ success: true, id, name: product.name });
      } catch (error: any) {
        results.push({ success: false, name: product.name, error: error.message });
      }
    }

    await ctx.scheduler.runAfter(0, internal.audit.log, {
        businessId: args.businessId,
        userId: args.userId,
        entityType: "PRODUCT",
        entityId: "BATCH",
        action: "CREATE",
        payloadAfter: { count: results.filter(r => r.success).length },
    });

    return results;
  },
});