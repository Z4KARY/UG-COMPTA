import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { checkAdmin } from "./utils";

export const getBusinessDetails = query({
  args: { id: v.id("businesses") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    const business = await ctx.db.get(args.id);
    if (!business) return null;

    const owner = await ctx.db.get(business.userId);
    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_business", (q) => q.eq("businessId", business._id))
      .order("desc")
      .collect();

    return {
      ...business,
      owner,
      subscriptions,
    };
  },
});

export const listBusinesses = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    
    let businesses;
    if (args.status && args.status !== "all") {
        if (args.status === "suspended") {
            businesses = await ctx.db.query("businesses")
                .withIndex("by_is_suspended", q => q.eq("isSuspended", true))
                .take(500);
        } else if (args.status === "active") {
            // We can't easily query for !isSuspended with a simple index unless we index false values too, 
            // which we did.
             businesses = await ctx.db.query("businesses")
                .withIndex("by_is_suspended", q => q.eq("isSuspended", false)) // Assuming undefined is not false in index, but let's be safe
                .take(500);
             // Fallback for undefined isSuspended (which means active)
             const undefinedSuspended = await ctx.db.query("businesses").order("desc").take(500);
             // Merge or just use the memory filter for "active" to catch undefineds
             businesses = undefinedSuspended.filter(b => !b.isSuspended);
        } else {
             businesses = await ctx.db.query("businesses").order("desc").take(500);
        }
    } else {
        businesses = await ctx.db.query("businesses").order("desc").take(500);
    }
    
    // Enrich with owner info
    let enriched = await Promise.all(businesses.map(async (b) => {
        const owner = await ctx.db.get(b.userId);
        return {
            ...b,
            ownerName: owner?.name || owner?.email || "Unknown",
            ownerEmail: owner?.email,
        };
    }));

    // Filter by search
    if (args.search) {
        const query = args.search.toLowerCase();
        enriched = enriched.filter(b => 
            b.name.toLowerCase().includes(query) ||
            (b.nif && b.nif.includes(query)) ||
            (b.ownerName && b.ownerName.toLowerCase().includes(query)) ||
            (b.ownerEmail && b.ownerEmail.toLowerCase().includes(query))
        );
    }
    
    return enriched;
  },
});

export const toggleBusinessSuspension = mutation({
  args: { id: v.id("businesses"), suspend: v.boolean() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    await ctx.db.patch(args.id, { isSuspended: args.suspend });
  },
});

export const deleteBusinesses = mutation({
  args: { ids: v.array(v.id("businesses")) },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    for (const id of args.ids) {
      await ctx.db.delete(id);
    }
  },
});

export const createBusiness = mutation({
  args: {
    name: v.string(),
    ownerEmail: v.string(),
    ownerName: v.optional(v.string()),
    plan: v.union(v.literal("free"), v.literal("startup"), v.literal("pro"), v.literal("premium"), v.literal("enterprise")),
    durationMonths: v.number(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);

    // 1. Find or Create User
    let userId;
    const existingUser = await ctx.db.query("users").withIndex("email", q => q.eq("email", args.ownerEmail)).first();
    if (existingUser) {
        userId = existingUser._id;
        // Upgrade to owner if needed
        if (existingUser.roleGlobal === "NORMAL" || existingUser.roleGlobal === "staff" || !existingUser.roleGlobal) {
             await ctx.db.patch(userId, { roleGlobal: "owner" });
        }
    } else {
        // Create user
        userId = await ctx.db.insert("users", {
            email: args.ownerEmail,
            name: args.ownerName || args.ownerEmail.split('@')[0],
            role: "user",
            roleGlobal: "owner",
        });
    }

    // 2. Create Business
    const subscriptionEndsAt = Date.now() + (args.durationMonths * 30 * 24 * 60 * 60 * 1000);
    const businessId = await ctx.db.insert("businesses", {
        userId,
        name: args.name,
        address: "Alger, Algérie", // Default
        currency: "DZD",
        tvaDefault: 19,
        subscriptionStatus: "active",
        plan: args.plan,
        subscriptionEndsAt,
    });

    // Determine interval based on duration
    let interval: "year" | "2_years" | "3_years" | "month" = "year";
    if (args.durationMonths === 24) interval = "2_years";
    if (args.durationMonths === 36) interval = "3_years";
    if (args.durationMonths < 12) interval = "month";

    // 3. Create Subscription Record
    await ctx.db.insert("subscriptions", {
        businessId,
        planId: args.plan,
        status: "active",
        amount: 0, // Free/Manual
        currency: "DZD",
        interval: interval,
        startDate: Date.now(),
        endDate: subscriptionEndsAt,
        paymentMethod: "manual_admin",
    });

    // 4. Add owner member
    await ctx.db.insert("businessMembers", {
        businessId,
        userId,
        role: "owner",
        joinedAt: Date.now(),
    });
  }
});
