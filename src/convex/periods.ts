import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const close = mutation({
  args: {
    businessId: v.id("businesses"),
    periodType: v.union(v.literal("MONTH"), v.literal("YEAR")),
    startDate: v.number(),
    endDate: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const business = await ctx.db.get(args.businessId);
    if (!business) throw new Error("Business not found");

    // Check permissions (Owner or Accountant)
    if (business.userId !== userId) {
        const member = await ctx.db
            .query("businessMembers")
            .withIndex("by_business_and_user", (q) => q.eq("businessId", args.businessId).eq("userId", userId))
            .first();
        
        if (!member || (member.role !== "owner" && member.role !== "accountant")) {
            throw new Error("Unauthorized: Only Owner or Accountant can close periods");
        }
    }

    // Check for overlapping periods?
    // For simplicity, we just allow creating closures. Overlaps are user's responsibility to manage or we can check.
    // Ideally we check if a closure already exists for this exact range or overlaps.
    // But "locking a period" usually means "this range is locked". Multiple locks on same range is redundant but harmless.

    await ctx.db.insert("periodClosures", {
        businessId: args.businessId,
        periodType: args.periodType,
        startDate: args.startDate,
        endDate: args.endDate,
        closedByUserId: userId,
        closedAt: Date.now(),
        notes: args.notes,
    });
  },
});

export const list = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Auth check
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
        .query("periodClosures")
        .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
        .order("desc")
        .collect();
  },
});

export const remove = mutation({
    args: { id: v.id("periodClosures") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const closure = await ctx.db.get(args.id);
        if (!closure) throw new Error("Not found");

        const business = await ctx.db.get(closure.businessId);
        if (!business) throw new Error("Business not found");

        // Only Owner or Accountant can reopen
        if (business.userId !== userId) {
            const member = await ctx.db
                .query("businessMembers")
                .withIndex("by_business_and_user", (q) => q.eq("businessId", closure.businessId).eq("userId", userId))
                .first();
            
            if (!member || (member.role !== "owner" && member.role !== "accountant")) {
                throw new Error("Unauthorized");
            }
        }

        await ctx.db.delete(args.id);
    }
});
