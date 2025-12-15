import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const PLANS = {
  free: {
    id: "free",
    name: "Auto-Entrepreneur",
    price: 0,
    features: ["Unlimited Invoices", "Client Management", "G12 Reports"],
  },
  startup: {
    id: "startup",
    name: "Startup",
    price: 39000,
    features: ["Everything in Free", "G50 Declarations", "VAT Management", "Multi-user Access (3)"],
  },
  pro: {
    id: "pro",
    name: "Small Business",
    price: 49000,
    features: ["Everything in Startup", "Multi-user Access (6)", "Priority Support"],
  },
  premium: {
    id: "premium",
    name: "Premium",
    price: 69000,
    features: ["Everything in Pro", "Multi-user Access (10)", "Advanced Reporting"],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: null, // Custom
    features: ["Everything in Premium", "Custom Integrations", "Dedicated Support"],
  },
};

export const upgradeSubscription = mutation({
  args: {
    businessId: v.id("businesses"),
    planId: v.union(
      v.literal("free"), 
      v.literal("startup"), 
      v.literal("pro"), 
      v.literal("premium"), 
      v.literal("enterprise")
    ),
    interval: v.union(v.literal("month"), v.literal("year")),
    paymentMethod: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const business = await ctx.db.get(args.businessId);
    if (!business) throw new Error("Business not found");

    // Check authorization (owner only)
    if (business.userId !== userId) {
        const member = await ctx.db
            .query("businessMembers")
            .withIndex("by_business_and_user", (q) => q.eq("businessId", args.businessId).eq("userId", userId))
            .first();
        if (!member || member.role !== "owner") {
            throw new Error("Only the owner can manage subscriptions");
        }
    }

    const plan = PLANS[args.planId];
    if (!plan) throw new Error("Invalid plan");

    // In a real integration, we would verify payment here or create a checkout session.
    // For now, we simulate a successful upgrade.

    const now = Date.now();
    const duration = args.interval === "year" ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
    const endDate = now + duration;

    // Create subscription record
    await ctx.db.insert("subscriptions", {
      businessId: args.businessId,
      planId: args.planId,
      status: "active",
      amount: plan.price || 0,
      currency: "DZD",
      interval: args.interval,
      startDate: now,
      endDate: endDate,
      paymentMethod: args.paymentMethod || "manual",
    });

    // Update business status
    await ctx.db.patch(args.businessId, {
      plan: args.planId,
      subscriptionStatus: "active",
      subscriptionEndsAt: endDate,
    });

    return { success: true, message: `Upgraded to ${plan.name}` };
  },
});

export const processPaymentWebhook = internalMutation({
  args: {
    businessId: v.id("businesses"),
    planId: v.string(),
    interval: v.union(v.literal("month"), v.literal("year")),
    status: v.string(),
    transactionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const plan = PLANS[args.planId as keyof typeof PLANS];
    if (!plan) throw new Error("Invalid plan");

    if (args.status === "paid") {
        const now = Date.now();
        const duration = args.interval === "year" ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
        const endDate = now + duration;

        // Create subscription record
        await ctx.db.insert("subscriptions", {
            businessId: args.businessId,
            planId: args.planId as any,
            status: "active",
            amount: plan.price || 0,
            currency: "DZD",
            interval: args.interval,
            startDate: now,
            endDate: endDate,
            paymentMethod: "chargily",
            transactionId: args.transactionId,
        });

        // Update business status
        await ctx.db.patch(args.businessId, {
            plan: args.planId as any,
            subscriptionStatus: "active",
            subscriptionEndsAt: endDate,
        });
    }
  },
});

export const getSubscriptionHistory = query({
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
      .query("subscriptions")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .collect();
  },
});