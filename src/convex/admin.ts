import { v } from "convex/values";
import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

async function checkAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthorized");
  
  const user = await ctx.db.get(userId);
  if (user?.role !== "admin") {
    throw new Error("Access denied: Admins only");
  }
  return user;
}

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    await checkAdmin(ctx);
    
    // We use collect() here because we need counts. 
    // In a real high-scale app, we would use a counter table or estimated counts.
    const usersCount = (await ctx.db.query("users").collect()).length;
    const businessesCount = (await ctx.db.query("businesses").collect()).length;
    const activeSubs = (await ctx.db.query("subscriptions").withIndex("by_status", q => q.eq("status", "active")).collect()).length;
    const contactRequestsNew = (await ctx.db.query("contactRequests").withIndex("by_status", q => q.eq("status", "new")).collect()).length;

    // Calculate MRR (approximate)
    const subscriptions = await ctx.db.query("subscriptions").withIndex("by_status", q => q.eq("status", "active")).collect();
    const mrr = subscriptions.reduce((acc, sub) => {
        if (sub.interval === "month") return acc + sub.amount;
        if (sub.interval === "year") return acc + (sub.amount / 12);
        return acc;
    }, 0);

    return {
        usersCount,
        businessesCount,
        activeSubs,
        contactRequestsNew,
        mrr
    };
  }
});

export const listAuditLogs = query({
    args: {},
    handler: async (ctx) => {
        await checkAdmin(ctx);
        const logs = await ctx.db.query("auditLogs").order("desc").take(50);
        
        return await Promise.all(logs.map(async (log) => {
            const user = await ctx.db.get(log.userId);
            const business = await ctx.db.get(log.businessId);
            return {
                ...log,
                userName: user?.name || user?.email || "Unknown",
                businessName: business?.name || "Unknown"
            };
        }));
    }
});

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

export const getUserDetails = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    const user = await ctx.db.get(args.id);
    if (!user) return null;

    const businesses = await ctx.db
      .query("businesses")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return {
      ...user,
      businesses,
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
        // We don't have a direct index for isSuspended usually, but let's check schema
        // Schema has isSuspended: v.optional(v.boolean()) but no index.
        // So we'll fetch all and filter, or use the subscriptionStatus if that's what is meant.
        // The UI usually shows "Active" or "Suspended" based on isSuspended flag.
        // For efficiency we'll fetch recent and filter in memory for now as per pattern.
        businesses = await ctx.db.query("businesses").order("desc").take(500);
        if (args.status === "suspended") {
            businesses = businesses.filter(b => b.isSuspended);
        } else if (args.status === "active") {
            businesses = businesses.filter(b => !b.isSuspended);
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

export const listUsers = query({
  args: {
    search: v.optional(v.string()),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    
    let users = await ctx.db.query("users").order("desc").take(500);

    // Filter by role
    if (args.role && args.role !== "all") {
        users = users.filter(u => {
            if (args.role === "admin") return u.role === "admin" || u.roleGlobal === "ADMIN" || u.roleGlobal === "admin";
            if (args.role === "accountant") return u.roleGlobal === "ACCOUNTANT" || u.roleGlobal === "accountant";
            if (args.role === "owner") return u.roleGlobal === "owner";
            if (args.role === "staff") return u.roleGlobal === "staff" || u.roleGlobal === "NORMAL";
            
            // Legacy fallback
            if (args.role === "ADMIN") return u.role === "admin" || u.roleGlobal === "ADMIN";
            if (args.role === "ACCOUNTANT") return u.roleGlobal === "ACCOUNTANT";
            if (args.role === "NORMAL") return (!u.roleGlobal || u.roleGlobal === "NORMAL") && u.role !== "admin";
            
            return u.roleGlobal === args.role;
        });
    }

    // Filter by search
    if (args.search) {
        const query = args.search.toLowerCase();
        users = users.filter(u => 
            (u.name && u.name.toLowerCase().includes(query)) ||
            (u.email && u.email.toLowerCase().includes(query))
        );
    }

    return users;
  },
});

export const listContactRequests = query({
  args: {},
  handler: async (ctx) => {
    await checkAdmin(ctx);
    return await ctx.db.query("contactRequests").order("desc").take(100);
  },
});

export const toggleBusinessSuspension = mutation({
  args: { id: v.id("businesses"), suspend: v.boolean() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    await ctx.db.patch(args.id, { isSuspended: args.suspend });
    
    // Log action?
    // We can use internal audit log if we want, but for now simple patch is fine.
  },
});

export const toggleUserSuspension = mutation({
  args: { id: v.id("users"), suspend: v.boolean() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    await ctx.db.patch(args.id, { isSuspended: args.suspend });
  },
});

export const updateUserRole = mutation({
  args: { 
    id: v.id("users"), 
    role: v.union(
      v.literal("NORMAL"), 
      v.literal("ACCOUNTANT"), 
      v.literal("ADMIN"),
      v.literal("admin"),
      v.literal("owner"),
      v.literal("accountant"),
      v.literal("staff")
    ) 
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    
    const updates: any = { roleGlobal: args.role };
    
    // Sync legacy/auth role field for compatibility
    if (args.role === "ADMIN" || args.role === "admin") {
      updates.role = "admin";
    } else {
      updates.role = "user";
    }
    
    await ctx.db.patch(args.id, updates);
  },
});

export const updateContactRequestStatus = mutation({
  args: { 
    id: v.id("contactRequests"), 
    status: v.union(v.literal("new"), v.literal("contacted"), v.literal("closed")) 
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const getGlobalFiscalParameters = query({
  args: {},
  handler: async (ctx) => {
    await checkAdmin(ctx);
    return await ctx.db
        .query("fiscalParameters")
        .withIndex("by_business_and_code", (q) => q.eq("businessId", undefined))
        .collect();
  },
});

export const listAnnouncements = query({
  args: {},
  handler: async (ctx) => {
    await checkAdmin(ctx);
    return await ctx.db.query("announcements").order("desc").collect();
  },
});

export const createAnnouncement = mutation({
  args: {
    title: v.string(),
    message: v.string(),
    type: v.union(v.literal("info"), v.literal("warning"), v.literal("critical")),
    targetRole: v.optional(v.union(v.literal("all"), v.literal("admin"), v.literal("user"))),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await checkAdmin(ctx);
    await ctx.db.insert("announcements", {
      ...args,
      isActive: true,
      createdBy: user._id,
    });
  },
});

export const toggleAnnouncement = mutation({
  args: { id: v.id("announcements"), isActive: v.boolean() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    await ctx.db.patch(args.id, { isActive: args.isActive });
  },
});

export const deleteAnnouncement = mutation({
  args: { id: v.id("announcements") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});

export const getPlatformSettings = query({
  args: {},
  handler: async (ctx) => {
    await checkAdmin(ctx);
    return await ctx.db.query("platformSettings").collect();
  },
});

export const updatePlatformSetting = mutation({
  args: { key: v.string(), value: v.any() },
  handler: async (ctx, args) => {
    const user = await checkAdmin(ctx);
    
    const existing = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        updatedBy: user._id,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("platformSettings", {
        key: args.key,
        value: args.value,
        updatedBy: user._id,
        updatedAt: Date.now(),
      });
    }
  },
});

export const deleteUsers = mutation({
  args: { ids: v.array(v.id("users")) },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    for (const id of args.ids) {
      // Delete auth accounts associated with the user
      // We use filter here to be safe as we don't control the indexes on authTables directly
      const authAccounts = await ctx.db
        .query("authAccounts")
        .filter((q) => q.eq(q.field("userId"), id))
        .collect();
      
      for (const account of authAccounts) {
        await ctx.db.delete(account._id);
      }

      // Delete auth sessions associated with the user
      const authSessions = await ctx.db
        .query("authSessions")
        .filter((q) => q.eq(q.field("userId"), id))
        .collect();
        
      for (const session of authSessions) {
        await ctx.db.delete(session._id);
      }

      await ctx.db.delete(id);
      // Delete associated businesses
      const businesses = await ctx.db
        .query("businesses")
        .withIndex("by_user", (q) => q.eq("userId", id))
        .collect();
      for (const business of businesses) {
        await ctx.db.delete(business._id);
      }
    }
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
    } else {
        // Create user
        userId = await ctx.db.insert("users", {
            email: args.ownerEmail,
            name: args.ownerName || args.ownerEmail.split('@')[0],
            role: "user",
            roleGlobal: "NORMAL",
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

export const createAccount = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    role: v.union(
      v.literal("NORMAL"), 
      v.literal("ACCOUNTANT"), 
      v.literal("ADMIN"),
      v.literal("admin"),
      v.literal("owner"),
      v.literal("accountant"),
      v.literal("staff")
    ),
    createBusiness: v.boolean(),
    businessName: v.optional(v.string()),
    plan: v.optional(v.union(v.literal("free"), v.literal("startup"), v.literal("pro"), v.literal("premium"), v.literal("enterprise"))),
    durationMonths: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    
    const existing = await ctx.db.query("users").withIndex("email", q => q.eq("email", args.email)).first();
    if (existing) throw new Error("Email already in use");

    const userId = await ctx.db.insert("users", {
        name: args.name,
        email: args.email,
        role: (args.role === "ADMIN" || args.role === "admin") ? "admin" : "user",
        roleGlobal: args.role,
    });

    if (args.createBusiness && args.businessName) {
        if (!args.plan) throw new Error("Subscription plan is required");
        if (!args.durationMonths) throw new Error("Subscription duration is required");

        const plan = args.plan;
        const durationMonths = args.durationMonths;
        const subscriptionEndsAt = Date.now() + (durationMonths * 30 * 24 * 60 * 60 * 1000); 
        
        const businessId = await ctx.db.insert("businesses", {
            userId,
            name: args.businessName,
            address: "Alger, Algérie", // Default
            currency: "DZD",
            tvaDefault: 19,
            subscriptionStatus: "active",
            plan: plan,
            subscriptionEndsAt,
        });

        // Determine interval based on duration
        let interval: "year" | "2_years" | "3_years" | "month" = "year";
        if (durationMonths === 24) interval = "2_years";
        if (durationMonths === 36) interval = "3_years";
        if (durationMonths < 12) interval = "month";

        // Create Subscription Record
        await ctx.db.insert("subscriptions", {
            businessId,
            planId: plan,
            status: "active",
            amount: 0,
            currency: "DZD",
            interval: interval,
            startDate: Date.now(),
            endDate: subscriptionEndsAt,
            paymentMethod: "manual_admin",
        });

        // Add owner member
        await ctx.db.insert("businessMembers", {
            businessId,
            userId,
            role: "owner",
            joinedAt: Date.now(),
        });
    }
  }
});