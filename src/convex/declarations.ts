import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
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

    // Filter for the period
    // We include invoices issued in this month that are valid (not cancelled/draft)
    const periodInvoices = invoices.filter(
      (inv) => inv.issueDate >= startDate && inv.issueDate <= endDate && inv.status !== "cancelled" && inv.status !== "draft"
    );

    let turnoverHt = 0;
    let tvaCollected = 0;
    let stampDutyTotal = 0;

    for (const inv of periodInvoices) {
      turnoverHt += inv.subtotalHt || inv.totalHt || 0;
      tvaCollected += inv.totalTva || 0;
      
      // Stamp duty is collected on cash payments.
      if (inv.paymentMethod === "CASH") {
         stampDutyTotal += inv.stampDutyAmount || 0;
      }
    }

    // --- Purchases & VAT Deductible ---
    const purchaseInvoices = await ctx.db
      .query("purchaseInvoices")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();
      
    const periodPurchases = purchaseInvoices.filter(
      (inv) => inv.invoiceDate >= startDate && inv.invoiceDate <= endDate
    );

    let vatDeductibleTotal = 0;
    const supplierList = [];

    for (const inv of periodPurchases) {
        vatDeductibleTotal += inv.vatDeductible || 0;
        
        const supplier = await ctx.db.get(inv.supplierId);
        if (supplier) {
            supplierList.push({
                supplierName: supplier.name,
                supplierNif: supplier.nif,
                supplierRc: supplier.rc,
                supplierAddress: supplier.address,
                invoiceNumber: inv.invoiceNumber,
                invoiceDate: inv.invoiceDate,
                amountTtc: inv.totalTtc,
                vatDeducted: inv.vatDeductible
            });
        }
    }

    return {
      businessName: business.name,
      businessAddress: business.address,
      businessNif: business.nif,
      period: `${args.month + 1}/${args.year}`,
      turnoverHt,
      tvaCollected,
      stampDutyTotal,
      invoiceCount: periodInvoices.length,
      // New fields
      vatDeductible: vatDeductibleTotal,
      netVatPayable: Math.max(0, tvaCollected - vatDeductibleTotal),
      vatCredit: Math.max(0, vatDeductibleTotal - tvaCollected),
      supplierList,
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
    let turnoverGoods = 0;
    let turnoverServices = 0;
    
    for (const inv of periodInvoices) {
      turnoverHt += inv.subtotalHt || inv.totalHt || 0;

      // Fetch items to categorize turnover
      const items = await ctx.db
        .query("invoiceItems")
        .withIndex("by_invoice", (q) => q.eq("invoiceId", inv._id))
        .collect();

      for (const item of items) {
        const itemTotal = item.lineTotalHt || item.lineTotal || 0;
        if (item.productType === "goods") {
            turnoverGoods += itemTotal;
        } else {
            turnoverServices += itemTotal;
        }
      }
    }

    return {
      businessName: business.name,
      businessNif: business.nif,
      year: args.year,
      turnoverHt,
      turnoverGoods,
      turnoverServices,
      fiscalRegime: business.fiscalRegime || "VAT",
      invoiceCount: periodInvoices.length,
    };
  },
});

export const getG12IFUData = query({
  args: {
    businessId: v.id("businesses"),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const business = await ctx.db.get(args.businessId);
    if (!business || business.userId !== userId) return null;

    // 1. Get Previous Year Real Turnover (N-1)
    const startPrev = new Date(args.year - 1, 0, 1).getTime();
    const endPrev = new Date(args.year - 1, 11, 31, 23, 59, 59).getTime();
    
    const invoicesPrev = await ctx.db
      .query("invoices")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const turnoverPrev = invoicesPrev
        .filter(inv => inv.issueDate >= startPrev && inv.issueDate <= endPrev && inv.status !== "cancelled" && inv.status !== "draft")
        .reduce((sum, inv) => sum + (inv.subtotalHt || inv.totalHt || 0), 0);

    // 2. Get Current Year Real Turnover (N)
    const startCurr = new Date(args.year, 0, 1).getTime();
    const endCurr = new Date(args.year, 11, 31, 23, 59, 59).getTime();

    const invoicesCurr = await ctx.db
      .query("invoices")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const turnoverCurr = invoicesCurr
        .filter(inv => inv.issueDate >= startCurr && inv.issueDate <= endCurr && inv.status !== "cancelled" && inv.status !== "draft")
        .reduce((sum, inv) => sum + (inv.subtotalHt || inv.totalHt || 0), 0);

    // 3. Get Forecast for N
    const forecast = await ctx.db
      .query("g12Forecasts")
      .withIndex("by_business_and_year", (q) => q.eq("businessId", args.businessId).eq("year", args.year))
      .first();

    return {
        year: args.year,
        previousYearTurnover: turnoverPrev,
        currentYearRealTurnover: turnoverCurr,
        forecast: forecast ? {
            forecastTurnover: forecast.forecastTurnover,
            ifuRate: forecast.ifuRate,
            taxDueInitial: forecast.taxDueInitial,
            submissionDate: forecast.submissionDate
        } : null
    };
  },
});

export const saveG12Forecast = mutation({
  args: {
    businessId: v.id("businesses"),
    year: v.number(),
    forecastTurnover: v.number(),
    ifuRate: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const business = await ctx.db.get(args.businessId);
    if (!business || business.userId !== userId) throw new Error("Unauthorized");

    const taxDueInitial = args.forecastTurnover * (args.ifuRate / 100);

    const existing = await ctx.db
      .query("g12Forecasts")
      .withIndex("by_business_and_year", (q) => q.eq("businessId", args.businessId).eq("year", args.year))
      .first();

    if (existing) {
        await ctx.db.patch(existing._id, {
            forecastTurnover: args.forecastTurnover,
            ifuRate: args.ifuRate,
            taxDueInitial,
            submissionDate: Date.now(),
        });
    } else {
        await ctx.db.insert("g12Forecasts", {
            businessId: args.businessId,
            year: args.year,
            forecastTurnover: args.forecastTurnover,
            ifuRate: args.ifuRate,
            taxDueInitial,
            submissionDate: Date.now(),
        });
    }
  },
});