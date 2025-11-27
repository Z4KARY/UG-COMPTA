import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getG50Data = query({
  args: {
    businessId: v.id("businesses"),
    month: v.number(), // 0-11
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const business = await ctx.db.get(args.businessId);
    if (!business || business.userId !== userId) return null;

    // Start and end of the month
    const startDate = new Date(args.year, args.month, 1).getTime();
    const endDate = new Date(args.year, args.month + 1, 0, 23, 59, 59).getTime();

    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    // Filter in memory for date range (since we don't have a compound index on date yet)
    // In a real app, we should add an index on [businessId, issueDate]
    const periodInvoices = invoices.filter(
      (inv) => inv.issueDate >= startDate && inv.issueDate <= endDate && inv.status !== "cancelled" && inv.status !== "draft"
    );

    let turnoverHt = 0;
    let tvaCollected = 0;
    let stampDutyTotal = 0;

    for (const inv of periodInvoices) {
      turnoverHt += inv.subtotalHt || inv.totalHt || 0;
      tvaCollected += inv.totalTva || 0;
      
      // Stamp duty is collected on cash payments (quittance)
      // Strictly speaking, this applies when the cash is received.
      if (inv.paymentMethod === "CASH" && inv.status === "paid") {
         stampDutyTotal += inv.stampDutyAmount || 0;
      }
    }

    return {
      businessName: business.name,
      period: `${args.month + 1}/${args.year}`,
      turnoverHt,
      tvaCollected,
      stampDutyTotal,
      invoiceCount: periodInvoices.length,
    };
  },
});

export const getG12Data = query({
  args: {
    businessId: v.id("businesses"),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const business = await ctx.db.get(args.businessId);
    if (!business || business.userId !== userId) return null;

    const startDate = new Date(args.year, 0, 1).getTime();
    const endDate = new Date(args.year, 11, 31, 23, 59, 59).getTime();

    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const periodInvoices = invoices.filter(
      (inv) => inv.issueDate >= startDate && inv.issueDate <= endDate && inv.status !== "cancelled" && inv.status !== "draft"
    );

    let turnoverHt = 0;
    
    for (const inv of periodInvoices) {
      turnoverHt += inv.subtotalHt || inv.totalHt || 0;
    }

    return {
      businessName: business.name,
      year: args.year,
      turnoverHt,
      fiscalRegime: business.fiscalRegime || "VAT",
      invoiceCount: periodInvoices.length,
    };
  },
});