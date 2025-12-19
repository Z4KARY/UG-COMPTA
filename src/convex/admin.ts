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
    args: {},
    handler: async (ctx) => {
        await checkAdmin(ctx);
        const subs = await ctx.db.query("subscriptions").order("desc").take(100);
        
        return await Promise.all(subs.map(async (sub) => {
            const business = await ctx.db.get(sub.businessId);
            return {
                ...sub,
                businessName: business?.name || "Unknown Business",
                businessOwnerId: business?.userId
            };
        }));
    }
});

export const cancelSubscription = mutation({
    args: { id: v.id("subscriptions") },
    handler: async (ctx, args) => {
        await checkAdmin(ctx);
        const sub = await ctx.db.get(args.id);
        if (!sub) throw new Error("Subscription not found");
        
        await ctx.db.patch(args.id, { status: "canceled", endDate: Date.now() });
        
        // Also update business status
        if (sub.businessId) {
             await ctx.db.patch(sub.businessId, { 
                 subscriptionStatus: "canceled",
                 // We don't change the plan immediately to free, we let them finish the period usually, 
                 // but here we are cancelling immediately.
             });
        }
    }
});

export const listBusinesses = query({
  args: {},
  handler: async (ctx) => {
    await checkAdmin(ctx);
    const businesses = await ctx.db.query("businesses").order("desc").take(100);
    
    // Enrich with owner info
    const enriched = await Promise.all(businesses.map(async (b) => {
        const owner = await ctx.db.get(b.userId);
        return {
            ...b,
            ownerName: owner?.name || owner?.email || "Unknown",
            ownerEmail: owner?.email,
        };
    }));
    
    return enriched;
  },
});

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    await checkAdmin(ctx);
    return await ctx.db.query("users").order("desc").take(100);
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
    role: v.union(v.literal("NORMAL"), v.literal("ACCOUNTANT"), v.literal("ADMIN")) 
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    
    const updates: any = { roleGlobal: args.role };
    
    // Sync legacy/auth role field for compatibility
    if (args.role === "ADMIN") {
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