import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { checkAdmin } from "./utils";

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

export const listContactRequests = query({
  args: {},
  handler: async (ctx) => {
    await checkAdmin(ctx);
    return await ctx.db.query("contactRequests").order("desc").take(100);
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
    
    const announcementData: any = {
      ...args,
      isActive: true,
      createdBy: user._id,
    };

    // Sanitize
    Object.keys(announcementData).forEach(key => {
        if (announcementData[key] === undefined) delete announcementData[key];
    });

    await ctx.db.insert("announcements", announcementData);
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
