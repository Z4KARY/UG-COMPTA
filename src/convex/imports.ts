import { v } from "convex/values";
import { internalMutation, mutation, query, internalQuery } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const createJob = mutation({
  args: {
    businessId: v.id("businesses"),
    type: v.union(v.literal("CUSTOMERS"), v.literal("PRODUCTS"), v.literal("INVOICES")),
    storageId: v.id("_storage"),
    mapping: v.string(), // JSON string
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const business = await ctx.db.get(args.businessId);
    if (!business || business.userId !== userId) {
        // Check member
        const member = await ctx.db
            .query("businessMembers")
            .withIndex("by_business_and_user", (q) => q.eq("businessId", args.businessId).eq("userId", userId))
            .first();
        if (!member) throw new Error("Unauthorized");
    }

    const jobId = await ctx.db.insert("importJobs", {
      businessId: args.businessId,
      userId,
      type: args.type,
      status: "PENDING",
      storageId: args.storageId,
      mapping: args.mapping,
      startedAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.importActions.processImport, { jobId });

    return jobId;
  },
});

export const getJob = internalQuery({
    args: { jobId: v.id("importJobs") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.jobId);
    }
});

export const updateJobStatus = internalMutation({
    args: {
        jobId: v.id("importJobs"),
        status: v.union(
            v.literal("PENDING"),
            v.literal("PROCESSING"),
            v.literal("DONE"),
            v.literal("FAILED"),
            v.literal("PARTIAL")
        ),
        report: v.optional(v.string()),
        finishedAt: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.jobId, {
            status: args.status,
            report: args.report,
            finishedAt: args.finishedAt,
        });
    }
});

export const listJobs = query({
    args: { businessId: v.id("businesses") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return [];
        
        return await ctx.db
            .query("importJobs")
            .withIndex("by_business", q => q.eq("businessId", args.businessId))
            .order("desc")
            .take(10);
    }
});