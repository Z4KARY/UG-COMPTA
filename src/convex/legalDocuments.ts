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
    
    let business = await ctx.db.get(args.businessId);

    if (business) {
      if (business.logoStorageId) {
        const url = await ctx.storage.getUrl(business.logoStorageId);
        if (url) business = { ...business, logoUrl: url };
      }
      if (business.signatureStorageId) {
        const url = await ctx.storage.getUrl(business.signatureStorageId);
        if (url) business = { ...business, signatureUrl: url };
      }
      if (business.stampStorageId) {
        const url = await ctx.storage.getUrl(business.stampStorageId);
        if (url) business = { ...business, stampUrl: url };
      }
    }

    return { document, business };
  },
});

export const getMyLegalDocument = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    let business = await ctx.db
      .query("businesses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!business) return null;

    if (business.logoStorageId) {
      const url = await ctx.storage.getUrl(business.logoStorageId);
      if (url) business = { ...business, logoUrl: url };
    }
    if (business.signatureStorageId) {
      const url = await ctx.storage.getUrl(business.signatureStorageId);
      if (url) business = { ...business, signatureUrl: url };
    }
    if (business.stampStorageId) {
      const url = await ctx.storage.getUrl(business.stampStorageId);
      if (url) business = { ...business, stampUrl: url };
    }

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
    titleSize: v.optional(v.string()),
    titleWeight: v.optional(v.string()),
    displayRegistrationInHeader: v.optional(v.boolean()),
    clientSignatureImageUrl: v.optional(v.string()),
    requiresClientSignature: v.optional(v.boolean()),
    displayWatermark: v.optional(v.boolean()),
    watermarkOpacity: v.optional(v.number()),
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
        titleSize: args.titleSize,
        titleWeight: args.titleWeight,
        displayRegistrationInHeader: args.displayRegistrationInHeader,
        clientSignatureImageUrl: args.clientSignatureImageUrl,
        requiresClientSignature: args.requiresClientSignature,
        displayWatermark: args.displayWatermark,
        watermarkOpacity: args.watermarkOpacity,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("legalDocuments", {
        businessId: args.businessId,
        content: args.content,
        title: args.title,
        titleSize: args.titleSize,
        titleWeight: args.titleWeight,
        displayRegistrationInHeader: args.displayRegistrationInHeader,
        clientSignatureImageUrl: args.clientSignatureImageUrl,
        requiresClientSignature: args.requiresClientSignature,
        displayWatermark: args.displayWatermark,
        watermarkOpacity: args.watermarkOpacity,
        updatedAt: Date.now(),
      });
    }
  },
});