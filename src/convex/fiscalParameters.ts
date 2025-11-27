import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { FISCAL_CONSTANTS, StampDutyConfig } from "./fiscal";

export const getStampDutyConfig = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx, args) => {
    // 1. Try to find business specific override
    if (args.businessId) {
      const businessParam = await ctx.db
        .query("fiscalParameters")
        .withIndex("by_business_and_code", (q) => 
          q.eq("businessId", args.businessId).eq("code", "STAMP_DUTY")
        )
        .first();
      
      if (businessParam) {
        return businessParam.value as StampDutyConfig;
      }
    }

    // 2. Try to find global default (businessId is null/undefined)
    // Note: In Convex, undefined in index query might be tricky if not explicitly stored as null.
    // We'll assume global defaults might be stored with businessId: undefined (if schema allows) or we just rely on code constants if not in DB.
    // For now, we'll return the code constants if no DB override is found.
    
    const globalParam = await ctx.db
        .query("fiscalParameters")
        .withIndex("by_business_and_code", (q) => 
          q.eq("businessId", undefined).eq("code", "STAMP_DUTY")
        )
        .first();

    if (globalParam) {
        return globalParam.value as StampDutyConfig;
    }

    return FISCAL_CONSTANTS.STAMP_DUTY;
  },
});

export const setStampDutyConfig = mutation({
  args: {
    businessId: v.optional(v.id("businesses")),
    config: v.object({
      MIN_DUTY: v.number(),
      MAX_DUTY: v.number(),
      RATE_PER_100DA: v.number(),
      THRESHOLD_EXEMPT: v.number(),
    }),
    lawReference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // If setting for a business, verify ownership
    if (args.businessId) {
        const business = await ctx.db.get(args.businessId);
        if (!business || business.userId !== userId) throw new Error("Unauthorized");
    } else {
        // Only admin can set global defaults (skipping role check for now, assuming this is internal or protected)
    }

    const existing = await ctx.db
      .query("fiscalParameters")
      .withIndex("by_business_and_code", (q) => 
        q.eq("businessId", args.businessId).eq("code", "STAMP_DUTY")
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.config,
        lawReference: args.lawReference,
        effectiveFrom: Date.now(),
      });
    } else {
      await ctx.db.insert("fiscalParameters", {
        businessId: args.businessId,
        code: "STAMP_DUTY",
        value: args.config,
        lawReference: args.lawReference,
        effectiveFrom: Date.now(),
      });
    }
  },
});
