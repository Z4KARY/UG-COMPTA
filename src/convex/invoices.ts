import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { calculateStampDuty, calculateLineTotals, FISCAL_CONSTANTS, StampDutyConfig } from "./fiscal";

export const list = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const business = await ctx.db.get(args.businessId);
    if (!business || business.userId !== userId) return [];

    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .collect();

    // Fetch customer names for each invoice
    const invoicesWithCustomer = await Promise.all(
      invoices.map(async (invoice) => {
        const customer = await ctx.db.get(invoice.customerId);
        return { ...invoice, customerName: customer?.name || "Unknown" };
      })
    );

    return invoicesWithCustomer;
  },
});

export const get = query({
  args: { id: v.id("invoices") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const invoice = await ctx.db.get(args.id);
    if (!invoice) return null;

    const business = await ctx.db.get(invoice.businessId);
    if (!business || business.userId !== userId) return null;

    const customer = await ctx.db.get(invoice.customerId);
    const items = await ctx.db
      .query("invoiceItems")
      .withIndex("by_invoice", (q) => q.eq("invoiceId", invoice._id))
      .collect();

    return { ...invoice, customer, items };
  },
});

export const create = mutation({
  args: {
    businessId: v.id("businesses"),
    customerId: v.id("customers"),
    invoiceNumber: v.string(),
    issueDate: v.number(),
    dueDate: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("paid"),
      v.literal("overdue"),
      v.literal("cancelled")
    ),
    notes: v.optional(v.string()),
    
    paymentMethod: v.optional(v.union(
      v.literal("CASH"),
      v.literal("BANK_TRANSFER"),
      v.literal("CHEQUE"),
      v.literal("CARD"),
      v.literal("OTHER")
    )),
    
    // We accept these but will recalculate them server-side for security
    subtotalHt: v.number(),
    totalTva: v.number(),
    stampDutyAmount: v.optional(v.number()),
    totalTtc: v.number(),
    
    // Legacy/Optional
    timbre: v.optional(v.boolean()),
    cashPenaltyPercentage: v.optional(v.number()),
    totalHt: v.optional(v.number()),

    items: v.array(
      v.object({
        productId: v.optional(v.id("products")),
        description: v.string(),
        quantity: v.number(),
        unitPrice: v.number(),
        discountRate: v.optional(v.number()),
        tvaRate: v.number(),
        lineTotal: v.number(),
        lineTotalHt: v.optional(v.number()),
        lineTotalTtc: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const business = await ctx.db.get(args.businessId);
    if (!business || business.userId !== userId) throw new Error("Unauthorized");

    // Fetch Fiscal Parameters (Stamp Duty)
    // Try business specific first, then global, then default
    let stampDutyConfig: StampDutyConfig = FISCAL_CONSTANTS.STAMP_DUTY;
    
    const businessParam = await ctx.db
        .query("fiscalParameters")
        .withIndex("by_business_and_code", (q) => 
          q.eq("businessId", args.businessId).eq("code", "STAMP_DUTY")
        )
        .first();
    
    if (businessParam) {
        stampDutyConfig = businessParam.value as StampDutyConfig;
    } else {
        const globalParam = await ctx.db
            .query("fiscalParameters")
            .withIndex("by_business_and_code", (q) => 
              q.eq("businessId", undefined).eq("code", "STAMP_DUTY")
            )
            .first();
        if (globalParam) {
            stampDutyConfig = globalParam.value as StampDutyConfig;
        }
    }

    // Server-side calculation to ensure fiscal compliance
    let calculatedSubtotalHt = 0;
    let calculatedTotalTva = 0;

    const processedItems = args.items.map(item => {
      const { lineTotalHt, lineTva, lineTotalTtc } = calculateLineTotals(
        item.quantity,
        item.unitPrice,
        item.discountRate || 0,
        item.tvaRate
      );

      calculatedSubtotalHt += lineTotalHt;
      calculatedTotalTva += lineTva;

      return {
        ...item,
        lineTotal: lineTotalHt, // Storing HT as lineTotal for consistency with schema comments usually
        lineTotalHt,
        lineTotalTtc
      };
    });

    const totalBeforeStamp = calculatedSubtotalHt + calculatedTotalTva;
    
    // Calculate Stamp Duty (Droit de Timbre) using fetched config
    const stampDutyAmount = calculateStampDuty(
      totalBeforeStamp, 
      args.paymentMethod || "OTHER",
      stampDutyConfig
    );

    const finalTotalTtc = totalBeforeStamp + stampDutyAmount;

    const invoiceData = {
      businessId: args.businessId,
      customerId: args.customerId,
      invoiceNumber: args.invoiceNumber,
      issueDate: args.issueDate,
      dueDate: args.dueDate,
      currency: args.currency,
      status: args.status,
      notes: args.notes,
      paymentMethod: args.paymentMethod,
      
      subtotalHt: calculatedSubtotalHt,
      totalHt: calculatedSubtotalHt, // Legacy alias
      totalTva: calculatedTotalTva,
      stampDutyAmount: stampDutyAmount,
      totalTtc: finalTotalTtc,
      
      // Clear legacy fields if not needed or set them for compat
      timbre: stampDutyAmount > 0,
    };

    const invoiceId = await ctx.db.insert("invoices", invoiceData);

    for (const item of processedItems) {
      await ctx.db.insert("invoiceItems", {
        invoiceId,
        ...item,
      });
    }

    return invoiceId;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("invoices"),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("paid"),
      v.literal("overdue"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const invoice = await ctx.db.get(args.id);
    if (!invoice) throw new Error("Not found");

    const business = await ctx.db.get(invoice.businessId);
    if (!business || business.userId !== userId) throw new Error("Unauthorized");

    await ctx.db.patch(args.id, { status: args.status });
  },
});