import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const log = internalMutation({
  args: {
    businessId: v.id("businesses"),
    userId: v.id("users"),
    entityType: v.union(
        v.literal("INVOICE"),
        v.literal("CUSTOMER"),
        v.literal("PRODUCT"),
        v.literal("FISCAL_CONFIG"),
        v.literal("BUSINESS"),
        v.literal("IMPORT_JOB")
    ),
    entityId: v.string(),
    action: v.union(
        v.literal("CREATE"),
        v.literal("UPDATE"),
        v.literal("DELETE"),
        v.literal("ISSUE"),
        v.literal("MARK_PAID"),
        v.literal("CONFIG_CHANGE"),
        v.literal("IMPORT")
    ),
    payloadBefore: v.optional(v.any()),
    payloadAfter: v.optional(v.any()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("auditLogs", {
        businessId: args.businessId,
        userId: args.userId,
        entityType: args.entityType,
        entityId: args.entityId,
        action: args.action,
        payloadBefore: args.payloadBefore,
        payloadAfter: args.payloadAfter,
        timestamp: Date.now(),
        ipAddress: args.ipAddress,
        userAgent: args.userAgent,
    });
  },
});