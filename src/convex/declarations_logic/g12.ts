import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { calculateIFUTax, calculateAETax, FISCAL_CONSTANTS } from "../fiscal";

// Helper to check membership
async function isMember(ctx: QueryCtx | MutationCtx, businessId: Id<"businesses">, userId: Id<"users">) {
    const member = await ctx.db
        .query("businessMembers")
        .withIndex("by_business_and_user", (q) => q.eq("businessId", businessId).eq("userId", userId))
        .first();
    return !!member;
}

export async function getG12DataLogic(ctx: QueryCtx, args: { businessId: Id<"businesses">, year: number }, userId: Id<"users">) {
    const business = await ctx.db.get(args.businessId);
    if (!business || (business.userId !== userId && !(await isMember(ctx, args.businessId, userId)))) return null;

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
}

export async function getG12IFUDataLogic(ctx: QueryCtx, args: { businessId: Id<"businesses">, year: number }, userId: Id<"users">) {
    const business = await ctx.db.get(args.businessId);
    if (!business || (business.userId !== userId && !(await isMember(ctx, args.businessId, userId)))) return null;

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
    
    let currTurnover = 0;
    let currTurnoverGoods = 0;
    let currTurnoverServices = 0;

    const currInvoices = invoices
        .filter(inv => inv.issueDate >= startCurr && inv.issueDate <= endCurr && inv.status !== "cancelled" && inv.status !== "draft");

    for (const inv of currInvoices) {
        const total = inv.subtotalHt || inv.totalHt || 0;
        currTurnover += total;
        
        const items = await ctx.db.query("invoiceItems").withIndex("by_invoice", q => q.eq("invoiceId", inv._id)).collect();
        for (const item of items) {
             if (item.productType === "goods") {
                 currTurnoverGoods += item.lineTotalHt || item.lineTotal || 0;
             } else {
                 currTurnoverServices += item.lineTotalHt || item.lineTotal || 0;
             }
        }
    }

    // 3. Forecast
    const forecast = await ctx.db
      .query("g12Forecasts")
      .withIndex("by_business_and_year", (q) => q.eq("businessId", args.businessId).eq("year", args.year))
      .first();

    // 4. Calculate Projected Tax
    let projectedTax = 0;
    if (business.fiscalRegime === "auto_entrepreneur") {
        projectedTax = calculateAETax(currTurnover);
    } else {
        projectedTax = calculateIFUTax(currTurnoverGoods, currTurnoverServices);
    }

    return {
        year: args.year,
        businessName: business.name,
        nif: business.nif || "",
        autoEntrepreneurCardNumber: business.autoEntrepreneurCardNumber,
        activityLabel: business.activityCodes?.join(", ") || "N/A",
        previousYearTurnover: prevTurnover,
        currentYearRealTurnover: currTurnover,
        currentYearBreakdown: {
            goods: currTurnoverGoods,
            services: currTurnoverServices
        },
        projectedTax,
        forecast: forecast ? {
            forecastTurnover: forecast.forecastTurnover,
            ifuRate: forecast.ifuRate,
            taxDueInitial: forecast.taxDueInitial,
        } : null,
        rates: {
            ae: FISCAL_CONSTANTS.AE_RATE,
            ifuGoods: FISCAL_CONSTANTS.IFU_RATES.GOODS,
            ifuServices: FISCAL_CONSTANTS.IFU_RATES.SERVICES,
            minTax: FISCAL_CONSTANTS.MINIMUM_TAX.IFU
        },
        createdAt: Date.now(),
    };
}

export async function getAEInvoicesExportDataLogic(ctx: QueryCtx, args: { businessId: Id<"businesses">, year: number }, userId: Id<"users">) {
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

    const exportData = await Promise.all(periodInvoices.map(async (inv) => {
        const customer = await ctx.db.get(inv.customerId);
        return {
            invoiceNumber: inv.invoiceNumber,
            invoiceDate: inv.issueDate,
            customerName: customer?.name || "Unknown",
            customerAddress: customer?.address || "",
            description: inv.notes || "Services",
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

export async function saveG12ForecastLogic(ctx: MutationCtx, args: any, userId: Id<"users">) {
    const business = await ctx.db.get(args.businessId as Id<"businesses">);
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
}