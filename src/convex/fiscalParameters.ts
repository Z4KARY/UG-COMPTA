import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { FISCAL_CONSTANTS, StampDutyConfig } from "./fiscal";

// Generic query to get a fiscal parameter
export const getFiscalParameter = query({
  args: { 
    businessId: v.optional(v.id("businesses")),
    code: v.string() 
  },
  handler: async (ctx, args) => {
    // 1. Try to find business specific override
    if (args.businessId) {
      const businessParam = await ctx.db
        .query("fiscalParameters")
        .withIndex("by_business_and_code", (q) => 
          q.eq("businessId", args.businessId).eq("code", args.code)
        )
        .filter((q) => {
            const now = Date.now();
            return q.and(
                q.lte(q.field("effectiveFrom"), now),
                q.or(
                    q.eq(q.field("effectiveTo"), undefined),
                    q.gte(q.field("effectiveTo"), now)
                )
            );
        })
        .first();
      
      if (businessParam) {
        return businessParam;
      }
    }

    // 2. Try to find global default
    const globalParam = await ctx.db
        .query("fiscalParameters")
        .withIndex("by_business_and_code", (q) => 
          q.eq("businessId", undefined).eq("code", args.code)
        )
        .filter((q) => {
            const now = Date.now();
            return q.and(
                q.lte(q.field("effectiveFrom"), now),
                q.or(
                    q.eq(q.field("effectiveTo"), undefined),
                    q.gte(q.field("effectiveTo"), now)
                )
            );
        })
        .first();

    return globalParam;
  },
});

// Generic mutation to set a fiscal parameter
export const setFiscalParameter = mutation({
  args: {
    businessId: v.optional(v.id("businesses")),
    code: v.string(),
    value: v.any(),
    lawReference: v.optional(v.string()),
    effectiveFrom: v.number(),
    effectiveTo: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    if (args.businessId) {
        const business = await ctx.db.get(args.businessId);
        if (!business || business.userId !== userId) throw new Error("Unauthorized");
    }

    // Check for existing active parameter to update or retire? 
    // For simplicity, we'll just insert a new record or update the existing one if it matches exactly.
    // In a real system, we might want to "close" the previous parameter by setting effectiveTo.
    
    const existing = await ctx.db
      .query("fiscalParameters")
      .withIndex("by_business_and_code", (q) => 
        q.eq("businessId", args.businessId).eq("code", args.code)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        lawReference: args.lawReference,
        effectiveFrom: args.effectiveFrom,
        effectiveTo: args.effectiveTo,
      });
    } else {
      await ctx.db.insert("fiscalParameters", {
        businessId: args.businessId,
        code: args.code,
        value: args.value,
        lawReference: args.lawReference,
        effectiveFrom: args.effectiveFrom,
        effectiveTo: args.effectiveTo,
      });
    }
  },
});

// Helper for Stamp Duty (Legacy wrapper updated to use new fields)
export const getStampDutyConfig = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx, args) => {
    // Reuse generic logic
    // We use "STAMP_DUTY" as the code for backward compatibility with previous steps
    // Ideally we migrate to "STAMP_DUTY_BRACKETS"
    
    // 1. Try to find business specific override
    if (args.businessId) {
      const businessParam = await ctx.db
        .query("fiscalParameters")
        .withIndex("by_business_and_code", (q) => 
          q.eq("businessId", args.businessId).eq("code", "STAMP_DUTY")
        )
        .first(); // We take the first one found for now, ignoring effective dates for strict backward compat unless we want to enforce it
      
      if (businessParam) {
        return businessParam.value as StampDutyConfig;
      }
    }

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

    if (args.businessId) {
        const business = await ctx.db.get(args.businessId);
        if (!business || business.userId !== userId) throw new Error("Unauthorized");
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
        // effectiveTo remains undefined
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