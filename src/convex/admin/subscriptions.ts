import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { checkAdmin } from "./utils";

export const listAllSubscriptions = query({
    args: {
        search: v.optional(v.string()),
        status: v.optional(v.string()),
        interval: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await checkAdmin(ctx);
        
        let subs;
        if (args.status && args.status !== "all") {
            subs = await ctx.db.query("subscriptions")
                .withIndex("by_status", (q) => q.eq("status", args.status as any))
                .take(500);
        } else {
            subs = await ctx.db.query("subscriptions")
                .order("desc")
                .take(500);
        }
        
        let enriched = await Promise.all(subs.map(async (sub) => {
            const business = await ctx.db.get(sub.businessId);
            const user = business ? await ctx.db.get(business.userId) : null;
            return {
                ...sub,
                businessName: business?.name || "Unknown Business",
                businessOwnerId: business?.userId,
                ownerEmail: user?.email || "",
            };
        }));

        // Filter by interval
        if (args.interval && args.interval !== "all") {
            enriched = enriched.filter(sub => sub.interval === args.interval);
        }

        // Filter by search query
        if (args.search) {
            const query = args.search.toLowerCase();
            enriched = enriched.filter(sub => 
                sub.businessName.toLowerCase().includes(query) ||
                sub.planId.toLowerCase().includes(query) ||
                sub.ownerEmail.toLowerCase().includes(query)
            );
        }

        return enriched;
    }
});

export const cancelSubscription = mutation({
    args: { id: v.id("subscriptions") },
    handler: async (ctx, args) => {
        await checkAdmin(ctx);
        const sub = await ctx.db.get(args.id);
        if (!sub) throw new Error("Subscription not found");
        
        const now = Date.now();
        await ctx.db.patch(args.id, { status: "canceled", endDate: now });
        
        // Also update business status
        if (sub.businessId) {
             await ctx.db.patch(sub.businessId, { 
                 subscriptionStatus: "canceled",
                 subscriptionEndsAt: now, // Expire immediately
             });
        }
    }
});

export const deleteSubscription = mutation({
  args: { id: v.id("subscriptions") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    const sub = await ctx.db.get(args.id);
    if (sub) {
        // Sync with business to remove subscription details completely
        if (sub.businessId) {
            await ctx.db.patch(sub.businessId, {
                plan: "free",
                subscriptionStatus: "canceled",
                subscriptionEndsAt: undefined,
            });
        }
        await ctx.db.delete(args.id);
    }
  },
});

export const updateSubscription = mutation({
  args: {
    id: v.id("subscriptions"),
    planId: v.union(
        v.literal("free"), 
        v.literal("startup"), 
        v.literal("pro"), 
        v.literal("premium"), 
        v.literal("enterprise")
    ),
    endDate: v.optional(v.number()),
    status: v.union(v.literal("active"), v.literal("past_due"), v.literal("canceled"), v.literal("trial")),
    amount: v.optional(v.number()),
    interval: v.optional(v.union(
        v.literal("month"), 
        v.literal("year"),
        v.literal("2_years"),
        v.literal("3_years"),
        v.literal("lifetime")
    )),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    const sub = await ctx.db.get(args.id);
    if (!sub) throw new Error("Subscription not found");

    const updates: any = {
        planId: args.planId,
        endDate: args.endDate,
        status: args.status,
    };

    if (args.amount !== undefined) {
        updates.amount = args.amount;
    }

    if (args.interval) {
        updates.interval = args.interval;
    }

    // Sanitize updates
    Object.keys(updates).forEach(key => {
        if (updates[key] === undefined) delete updates[key];
    });

    await ctx.db.patch(args.id, updates);

    // Sync with business
    if (sub.businessId) {
        await ctx.db.patch(sub.businessId, {
            plan: args.planId,
            subscriptionEndsAt: args.endDate,
            subscriptionStatus: args.status,
        });
    }
  }
});

export const createSubscription = mutation({
  args: {
    businessId: v.id("businesses"),
    plan: v.union(v.literal("free"), v.literal("startup"), v.literal("pro"), v.literal("premium"), v.literal("enterprise")),
    durationMonths: v.optional(v.number()), // Made optional to support lifetime/years selection
    amount: v.optional(v.number()),
    interval: v.optional(v.union(
        v.literal("month"), 
        v.literal("year"),
        v.literal("2_years"),
        v.literal("3_years"),
        v.literal("lifetime")
    )),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    const business = await ctx.db.get(args.businessId);
    if (!business) throw new Error("Business not found");

    // Cancel any existing active subscriptions for this business to prevent duplicates
    const existingActive = await ctx.db
        .query("subscriptions")
        .withIndex("by_business", q => q.eq("businessId", args.businessId))
        .filter(q => q.eq(q.field("status"), "active"))
        .collect();
        
    for (const sub of existingActive) {
        await ctx.db.patch(sub._id, { 
            status: "canceled", 
            endDate: Date.now() 
        });
    }

    let subscriptionEndsAt: number | undefined;
    
    if (args.interval === "lifetime") {
        subscriptionEndsAt = undefined; // No end date for lifetime
    } else if (args.durationMonths) {
        subscriptionEndsAt = Date.now() + (args.durationMonths * 30 * 24 * 60 * 60 * 1000);
    } else if (args.interval === "year") {
        subscriptionEndsAt = Date.now() + (365 * 24 * 60 * 60 * 1000);
    } else if (args.interval === "2_years") {
        subscriptionEndsAt = Date.now() + (2 * 365 * 24 * 60 * 60 * 1000);
    } else if (args.interval === "3_years") {
        subscriptionEndsAt = Date.now() + (3 * 365 * 24 * 60 * 60 * 1000);
    } else {
        // Default fallback
        subscriptionEndsAt = Date.now() + (30 * 24 * 60 * 60 * 1000);
    }

    // Update business
    await ctx.db.patch(args.businessId, {
        plan: args.plan,
        subscriptionStatus: "active",
        subscriptionEndsAt,
    });

    // Create Subscription Record
    await ctx.db.insert("subscriptions", {
        businessId: args.businessId,
        planId: args.plan,
        status: "active",
        amount: args.amount ?? 0, // Manual admin assignment
        currency: "DZD",
        interval: args.interval || "month", // Default to month if not specified, though UI should provide it
        startDate: Date.now(),
        endDate: subscriptionEndsAt,
        paymentMethod: "manual_admin",
    });
  }
});

export const resetBusinessSubscription = mutation({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    
    // 1. Reset Business to Free
    await ctx.db.patch(args.businessId, {
        plan: "free",
        subscriptionStatus: "active",
        subscriptionEndsAt: undefined,
    });

    // 2. Cancel any active subscriptions for this business
    const activeSubs = await ctx.db.query("subscriptions")
        .withIndex("by_business", q => q.eq("businessId", args.businessId))
        .filter(q => q.eq(q.field("status"), "active"))
        .collect();
        
    for (const sub of activeSubs) {
        await ctx.db.patch(sub._id, {
            status: "canceled",
            endDate: Date.now(),
        });
    }
  }
});
