import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createTestCustomer = mutation({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
        .query("customers")
        .withIndex("by_business", q => q.eq("businessId", args.businessId))
        .first();
    
    if (existing) return existing._id;

    return await ctx.db.insert("customers", {
        businessId: args.businessId,
        name: "Test Customer",
        email: "test@example.com",
        phone: "0555555555",
        address: "123 Test St",
        taxId: "000000000000000000",
        rc: "00/00-0000000",
        nif: "000000000000000000",
        ai: "00000000000",
    });
  }
});
