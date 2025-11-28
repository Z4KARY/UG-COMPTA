import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// G50 Data (Monthly) - For Sociétés & Personne Physique (Réel)
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
    if (!business || (business.userId !== userId && !(await isMember(ctx, args.businessId, userId)))) return null;

    // Logic Check: G50 is for Réel only
    if (business.fiscalRegime !== "reel" && business.fiscalRegime !== "VAT") {
        // If not reel, they shouldn't be here, but we return null or empty
        return null;
    }

    // Start and end of the month
    const startDate = new Date(args.year, args.month, 1).getTime();
    const endDate = new Date(args.year, args.month + 1, 0, 23, 59, 59).getTime();

    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const periodInvoices = invoices.filter(
      (inv) => inv.issueDate >= startDate && inv.issueDate <= endDate && inv.status !== "cancelled" && inv.status !== "draft"
    );

    let turnoverHt = 0;
    let tvaCollected = 0;
    let stampDutyTotal = 0;

    for (const inv of periodInvoices) {
      turnoverHt += inv.subtotalHt || inv.totalHt || 0;
      tvaCollected += inv.totalTva || 0;
      if (inv.paymentMethod === "CASH") {
         stampDutyTotal += inv.stampDutyAmount || 0;
      }
    }

    // Purchases
    const purchaseInvoices = await ctx.db
      .query("purchaseInvoices")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();
      
    const periodPurchases = purchaseInvoices.filter(
      (inv) => inv.invoiceDate >= startDate && inv.invoiceDate <= endDate
    );

    let vatDeductibleTotal = 0;
    for (const inv of periodPurchases) {
        vatDeductibleTotal += inv.vatDeductible || 0;
    }

    const netVat = Math.max(0, tvaCollected - vatDeductibleTotal);

    // Return camelCase to match frontend expectations
    return {
      month: args.month + 1,
      year: args.year,
      turnoverHt: turnoverHt,
      tvaCollected: tvaCollected,
      vatDeductible: vatDeductibleTotal,
      vatNet: netVat,
      stampDutyTotal: stampDutyTotal,
      totalInvoicesCount: periodInvoices.length,
      totalPurchasesCount: periodPurchases.length,
      createdAt: Date.now(),
      // Extra for UI
      businessName: business.name,
      businessNif: business.nif,
    };
  },
});

// G12 Data (Realized Annual) - For Personne Physique (Réel Simplifié)
export const getG12Data = query({
  args: {
    businessId: v.id("businesses"),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const business = await ctx.db.get(args.businessId);
    if (!business || (business.userId !== userId && !(await isMember(ctx, args.businessId, userId)))) return null;

    // Logic Check: G12 Real is for Réel Simplifié
    if (business.fiscalRegime !== "reel" && business.fiscalRegime !== "VAT") return null;

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

    // We need to fetch items to distinguish goods vs services
    // This might be expensive, but necessary for G12 breakdown
    for (const inv of periodInvoices) {
        turnoverHt += inv.subtotalHt || inv.totalHt || 0;
        
        const items = await ctx.db
            .query("invoiceItems")
            .withIndex("by_invoice", q => q.eq("invoiceId", inv._id))
            .collect();
            
        for (const item of items) {
            if (item.productType === "goods") {
                turnoverGoods += item.lineTotalHt || item.lineTotal || 0;
            } else {
                turnoverServices += item.lineTotalHt || item.lineTotal || 0;
            }
        }
    }

    return {
      year: args.year,
      businessName: business.name,
      nif: business.nif || "",
      fiscalRegime: business.fiscalRegime,
      turnoverHt,
      turnoverGoods,
      turnoverServices,
      createdAt: Date.now(),
    };
  },
});

// G12 IFU Data (Forecast + Realized) - For Personne Physique (Forfaitaire/IFU)
export const getG12IFUData = query({
  args: {
    businessId: v.id("businesses"),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const business = await ctx.db.get(args.businessId);
    if (!business || (business.userId !== userId && !(await isMember(ctx, args.businessId, userId)))) return null;

    // Logic Check
    const isEligible = business.fiscalRegime === "forfaitaire" || business.fiscalRegime === "auto_entrepreneur" || business.fiscalRegime === "IFU";
    if (!isEligible) return null;

    // 1. Previous Year Turnover (N-1)
    const startPrev = new Date(args.year - 1, 0, 1).getTime();
    const endPrev = new Date(args.year - 1, 11, 31, 23, 59, 59).getTime();
    
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();
      
    const prevTurnover = invoices
        .filter(inv => inv.issueDate >= startPrev && inv.issueDate <= endPrev && inv.status !== "cancelled" && inv.status !== "draft")
        .reduce((sum, inv) => sum + (inv.subtotalHt || inv.totalHt || 0), 0);

    // 2. Current Year Real Turnover (N)
    const startCurr = new Date(args.year, 0, 1).getTime();
    const endCurr = new Date(args.year, 11, 31, 23, 59, 59).getTime();
    
    const currTurnover = invoices
        .filter(inv => inv.issueDate >= startCurr && inv.issueDate <= endCurr && inv.status !== "cancelled" && inv.status !== "draft")
        .reduce((sum, inv) => sum + (inv.subtotalHt || inv.totalHt || 0), 0);

    // 3. Forecast
    const forecast = await ctx.db
      .query("g12Forecasts")
      .withIndex("by_business_and_year", (q) => q.eq("businessId", args.businessId).eq("year", args.year))
      .first();

    return {
        year: args.year,
        businessName: business.name,
        nif: business.nif || "",
        autoEntrepreneurCardNumber: business.autoEntrepreneurCardNumber, // Added for AE
        activityLabel: business.activityCodes?.join(", ") || "N/A",
        previousYearTurnover: prevTurnover,
        currentYearRealTurnover: currTurnover,
        forecast: forecast ? {
            forecastTurnover: forecast.forecastTurnover,
            ifuRate: forecast.ifuRate,
            taxDueInitial: forecast.taxDueInitial,
        } : null,
        createdAt: Date.now(),
    };
  },
});

// AE Invoice Export Data
export const getAEInvoicesExportData = query({
  args: {
    businessId: v.id("businesses"),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const business = await ctx.db.get(args.businessId);
    if (!business || (business.userId !== userId && !(await isMember(ctx, args.businessId, userId)))) return null;

    if (business.type !== "auto_entrepreneur") return null;

    const startDate = new Date(args.year, 0, 1).getTime();
    const endDate = new Date(args.year, 11, 31, 23, 59, 59).getTime();

    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const periodInvoices = invoices.filter(
      (inv) => inv.issueDate >= startDate && inv.issueDate <= endDate && inv.status !== "cancelled" && inv.status !== "draft"
    );

    // Fetch customer names
    const exportData = await Promise.all(periodInvoices.map(async (inv) => {
        const customer = await ctx.db.get(inv.customerId);
        return {
            invoiceNumber: inv.invoiceNumber,
            invoiceDate: inv.issueDate,
            customerName: customer?.name || "Unknown",
            customerAddress: customer?.address || "",
            description: inv.notes || "Services", // Simplified, ideally join items
            amountTtc: inv.totalTtc,
            paymentStatus: inv.status,
            paymentMethod: inv.paymentMethod || "",
            autoEntrepreneurCardNumber: business.autoEntrepreneurCardNumber,
            nif: business.nif,
            businessActivityCode: business.activityCodes?.[0] || ""
        };
    }));

    return exportData;
  }
});

// Helper
async function isMember(ctx: any, businessId: any, userId: any) {
    const member = await ctx.db
        .query("businessMembers")
        .withIndex("by_business_and_user", (q: any) => q.eq("businessId", businessId).eq("userId", userId))
        .first();
    return !!member;
}

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
    if (!business || (business.userId !== userId && !(await isMember(ctx, args.businessId, userId)))) throw new Error("Unauthorized");

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