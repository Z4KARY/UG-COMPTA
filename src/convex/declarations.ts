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
        return null;
    }

    // Check if finalized declaration exists
    const existingDecl = await ctx.db
        .query("g50Declarations")
        .withIndex("by_business_and_period", q => q.eq("businessId", args.businessId).eq("year", args.year).eq("month", args.month))
        .first();

    if (existingDecl && existingDecl.status === "FINALIZED") {
        return {
            ...existingDecl,
            isFinalized: true,
            businessName: business.name,
            businessNif: business.nif,
            businessRc: business.rc,
            businessAi: business.ai,
            totalInvoicesCount: 0, // Could store this if needed
            totalPurchasesCount: 0,
            // Ensure new fields are present even if old record
            tap: existingDecl.tap || 0,
            ibsAdvance: existingDecl.ibsAdvance || 0,
            irgSalaries: existingDecl.irgSalaries || 0,
            irgEmployees: existingDecl.irgEmployees || 0,
            irgDividends: existingDecl.irgDividends || 0,
            irgRcdc: existingDecl.irgRcdc || 0,
            its: existingDecl.its || 0,
            tfp: existingDecl.tfp || 0,
        };
    }

    // Dynamic Calculation
    const startDate = new Date(args.year, args.month, 1).getTime();
    const endDate = new Date(args.year, args.month + 1, 0, 23, 59, 59).getTime();

    // 1. Sales
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const periodInvoices = invoices.filter(
      (inv) =>
        inv.issueDate >= startDate &&
        inv.issueDate <= endDate &&
        inv.status !== "cancelled" &&
        inv.status !== "draft"
    );

    let turnover19 = 0;
    let vatCollected19 = 0;
    let turnover9 = 0;
    let vatCollected9 = 0;
    let turnoverExport = 0;
    let turnoverExempt = 0;
    let stampDutyTotal = 0;

    for (const inv of periodInvoices) {
        // Stamp Duty (Cash payments) - Only on paid invoices
        if (inv.paymentMethod === "CASH" && inv.status === "paid") {
            stampDutyTotal += inv.stampDutyAmount || 0;
        }

        // Breakdown by VAT Rate
        // We need to fetch items to be precise, or rely on invoice totals if we trust them.
        // The spec says "Sum all invoice lines".
        // Fetching items for all invoices might be heavy, but necessary for accuracy if mixed rates.
        const items = await ctx.db
            .query("invoiceItems")
            .withIndex("by_invoice", q => q.eq("invoiceId", inv._id))
            .collect();
        
        for (const item of items) {
            if (inv.fiscalType === "EXPORT") {
                turnoverExport += item.lineTotalHt || 0;
            } else if (inv.fiscalType === "EXEMPT" || item.tvaRate === 0) {
                // If invoice is marked exempt OR item has 0 VAT (and not export)
                turnoverExempt += item.lineTotalHt || 0;
            } else if (item.tvaRate === 19) {
                turnover19 += item.lineTotalHt || 0;
                vatCollected19 += item.tvaAmount || 0;
            } else if (item.tvaRate === 9) {
                turnover9 += item.lineTotalHt || 0;
                vatCollected9 += item.tvaAmount || 0;
            }
        }
    }

    // 2. Purchases
    const purchaseInvoices = await ctx.db
      .query("purchaseInvoices")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();
      
    const periodPurchases = purchaseInvoices.filter(
      (inv) => inv.invoiceDate >= startDate && inv.invoiceDate <= endDate
    );

    let purchaseVat19 = 0;
    let purchaseVat9 = 0;

    for (const inv of periodPurchases) {
        // We need items for purchases too if we want to split 19/9
        const items = await ctx.db
            .query("purchaseInvoiceItems")
            .withIndex("by_purchase_invoice", q => q.eq("purchaseInvoiceId", inv._id))
            .collect();
        
        for (const item of items) {
            if (item.vatRate === 19) {
                purchaseVat19 += item.vatAmount || 0;
            } else if (item.vatRate === 9) {
                purchaseVat9 += item.vatAmount || 0;
            }
        }
    }

    // 3. Imports (Manual Entries)
    const imports = await ctx.db
        .query("g50Imports")
        .withIndex("by_business_and_period", q => q.eq("businessId", args.businessId).eq("year", args.year).eq("month", args.month))
        .collect();
    
    const importVat = imports.reduce((sum, imp) => sum + imp.vatPaid, 0);

    // 4. Totals
    const vatCollectedTotal = vatCollected19 + vatCollected9;
    const vatDeductibleTotal = purchaseVat19 + purchaseVat9 + importVat; // + regularization (assumed 0 for dynamic)
    
    const vatNetBeforeCredit = vatCollectedTotal - vatDeductibleTotal;
    
    // 5. Previous Credit
    // If we have a finalized declaration for previous month, use its newCredit.
    // Otherwise use business.vatCreditCarriedForward (which should be the latest).
    // But if we are viewing a past month, this is tricky.
    // For now, we use business.vatCreditCarriedForward as the "current available credit" 
    // BUT if we are calculating for a specific month, we should ideally look at the previous month's declaration.
    
    let previousCredit = 0;
    
    // Try to find previous month's declaration
    let prevMonth = args.month - 1;
    let prevYear = args.year;
    if (prevMonth < 0) {
        prevMonth = 11;
        prevYear = args.year - 1;
    }

    const prevDecl = await ctx.db
        .query("g50Declarations")
        .withIndex("by_business_and_period", q => q.eq("businessId", args.businessId).eq("year", prevYear).eq("month", prevMonth))
        .first();
    
    if (prevDecl) {
        previousCredit = prevDecl.newCredit;
    } else {
        // Fallback to business global credit if no previous declaration found (e.g. first usage)
        // Only if we are generating for the "current" month relative to real time?
        // Or just use 0 if no history.
        // We'll use business.vatCreditCarriedForward if it seems to be the starting point.
        previousCredit = business.vatCreditCarriedForward || 0;
    }

    const vatNetAfterCredit = vatNetBeforeCredit - previousCredit;
    
    let newCredit = 0;
    let vatPayable = 0;

    if (vatNetAfterCredit < 0) {
        newCredit = Math.abs(vatNetAfterCredit);
        vatPayable = 0;
    } else {
        vatPayable = vatNetAfterCredit;
        newCredit = 0;
    }

    return {
      month: args.month,
      year: args.year,
      
      turnover19,
      vatCollected19,
      turnover9,
      vatCollected9,
      turnoverExport,
      turnoverExempt,
      
      purchaseVat19,
      purchaseVat9,
      importVat,
      regularizationVat: 0, // Default
      
      vatCollectedTotal,
      vatDeductibleTotal,
      vatNetBeforeCredit,
      previousCredit,
      vatNetAfterCredit,
      newCredit,
      vatPayable,
      
      stampDutyTotal,
      
      // New Fields Defaults (Manual Inputs)
      tap: 0, // Force 0 as per LF 2024
      ibsAdvance: existingDecl?.ibsAdvance || 0,
      irgSalaries: existingDecl?.irgSalaries || 0,
      irgEmployees: existingDecl?.irgEmployees || 0,
      irgDividends: existingDecl?.irgDividends || 0,
      irgRcdc: existingDecl?.irgRcdc || 0,
      its: existingDecl?.its || 0,
      tfp: existingDecl?.tfp || 0,
      
      isFinalized: false,
      totalInvoicesCount: periodInvoices.length,
      totalPurchasesCount: periodPurchases.length,
      
      businessName: business.name,
      businessNif: business.nif,
      businessRc: business.rc,
      businessAi: business.ai,
      createdAt: Date.now(),
    };
  },
});

export const finalizeG50 = mutation({
    args: {
        businessId: v.id("businesses"),
        month: v.number(),
        year: v.number(),
        // Additional Manual Fields
        tap: v.optional(v.number()),
        ibsAdvance: v.optional(v.number()),
        irgSalaries: v.optional(v.number()),
        irgEmployees: v.optional(v.number()),
        irgDividends: v.optional(v.number()),
        irgRcdc: v.optional(v.number()),
        its: v.optional(v.number()),
        tfp: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");
        
        const business = await ctx.db.get(args.businessId);
        if (!business || business.userId !== userId) throw new Error("Unauthorized");

        // Check if already finalized
        const existing = await ctx.db
            .query("g50Declarations")
            .withIndex("by_business_and_period", q => q.eq("businessId", args.businessId).eq("year", args.year).eq("month", args.month))
            .first();
        
        if (existing && existing.status === "FINALIZED") {
            throw new Error("Declaration already finalized");
        }

        // Perform Calculation (Same logic as query)
        // ... (We could extract this logic to a helper, but for now duplicate for safety/speed)
        const startDate = new Date(args.year, args.month, 1).getTime();
        const endDate = new Date(args.year, args.month + 1, 0, 23, 59, 59).getTime();

        const invoices = await ctx.db.query("invoices").withIndex("by_business", q => q.eq("businessId", args.businessId)).collect();
        const periodInvoices = invoices.filter(inv => inv.issueDate >= startDate && inv.issueDate <= endDate && inv.status !== "cancelled" && inv.status !== "draft");

        let turnover19 = 0; let vatCollected19 = 0;
        let turnover9 = 0; let vatCollected9 = 0;
        let turnoverExport = 0; let turnoverExempt = 0;
        let stampDutyTotal = 0;

        for (const inv of periodInvoices) {
            if (inv.paymentMethod === "CASH" && inv.status === "paid") stampDutyTotal += inv.stampDutyAmount || 0;
            const items = await ctx.db.query("invoiceItems").withIndex("by_invoice", q => q.eq("invoiceId", inv._id)).collect();
            for (const item of items) {
                if (inv.fiscalType === "EXPORT") turnoverExport += item.lineTotalHt || 0;
                else if (inv.fiscalType === "EXEMPT" || item.tvaRate === 0) turnoverExempt += item.lineTotalHt || 0;
                else if (item.tvaRate === 19) { turnover19 += item.lineTotalHt || 0; vatCollected19 += item.tvaAmount || 0; }
                else if (item.tvaRate === 9) { turnover9 += item.lineTotalHt || 0; vatCollected9 += item.tvaAmount || 0; }
            }
        }

        const purchaseInvoices = await ctx.db.query("purchaseInvoices").withIndex("by_business", q => q.eq("businessId", args.businessId)).collect();
        const periodPurchases = purchaseInvoices.filter(inv => inv.invoiceDate >= startDate && inv.invoiceDate <= endDate);

        let purchaseVat19 = 0; let purchaseVat9 = 0;
        for (const inv of periodPurchases) {
            const items = await ctx.db.query("purchaseInvoiceItems").withIndex("by_purchase_invoice", q => q.eq("purchaseInvoiceId", inv._id)).collect();
            for (const item of items) {
                if (item.vatRate === 19) purchaseVat19 += item.vatAmount || 0;
                else if (item.vatRate === 9) purchaseVat9 += item.vatAmount || 0;
            }
        }

        const imports = await ctx.db.query("g50Imports").withIndex("by_business_and_period", q => q.eq("businessId", args.businessId).eq("year", args.year).eq("month", args.month)).collect();
        const importVat = imports.reduce((sum, imp) => sum + imp.vatPaid, 0);

        const vatCollectedTotal = vatCollected19 + vatCollected9;
        const vatDeductibleTotal = purchaseVat19 + purchaseVat9 + importVat;
        const vatNetBeforeCredit = vatCollectedTotal - vatDeductibleTotal;

        let previousCredit = 0;
        let prevMonth = args.month - 1;
        let prevYear = args.year;
        if (prevMonth < 0) { prevMonth = 11; prevYear = args.year - 1; }
        const prevDecl = await ctx.db.query("g50Declarations").withIndex("by_business_and_period", q => q.eq("businessId", args.businessId).eq("year", prevYear).eq("month", prevMonth)).first();
        if (prevDecl) previousCredit = prevDecl.newCredit;
        else previousCredit = business.vatCreditCarriedForward || 0;

        const vatNetAfterCredit = vatNetBeforeCredit - previousCredit;
        let newCredit = 0;
        let vatPayable = 0;
        if (vatNetAfterCredit < 0) { newCredit = Math.abs(vatNetAfterCredit); vatPayable = 0; }
        else { vatPayable = vatNetAfterCredit; newCredit = 0; }

        // Save Declaration
        const declData = {
            businessId: args.businessId,
            month: args.month,
            year: args.year,
            turnover19, vatCollected19,
            turnover9, vatCollected9,
            turnoverExport, turnoverExempt,
            purchaseVat19, purchaseVat9,
            importVat, regularizationVat: 0,
            vatCollectedTotal, vatDeductibleTotal,
            vatNetBeforeCredit, previousCredit,
            vatNetAfterCredit, newCredit, vatPayable,
            stampDutyTotal,
            
            // Save Manual Fields
            tap: 0, // Force 0
            ibsAdvance: args.ibsAdvance || 0,
            irgSalaries: args.irgSalaries || 0,
            irgEmployees: args.irgEmployees || 0,
            irgDividends: args.irgDividends || 0,
            irgRcdc: args.irgRcdc || 0,
            its: args.its || 0,
            tfp: args.tfp || 0,

            status: "FINALIZED" as const,
            finalizedAt: Date.now(),
        };

        if (existing) {
            await ctx.db.patch(existing._id, declData);
        } else {
            await ctx.db.insert("g50Declarations", declData);
        }

        // Update Business Credit
        await ctx.db.patch(business._id, {
            vatCreditCarriedForward: newCredit
        });
    }
});

export const addImportEntry = mutation({
    args: {
        businessId: v.id("businesses"),
        month: v.number(),
        year: v.number(),
        customsValue: v.number(),
        vatPaid: v.number(),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");
        const business = await ctx.db.get(args.businessId);
        if (!business || business.userId !== userId) throw new Error("Unauthorized");

        await ctx.db.insert("g50Imports", {
            businessId: args.businessId,
            month: args.month,
            year: args.year,
            customsValue: args.customsValue,
            vatPaid: args.vatPaid,
            description: args.description,
        });
    }
});

export const deleteImportEntry = mutation({
    args: { id: v.id("g50Imports") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");
        const entry = await ctx.db.get(args.id);
        if (!entry) throw new Error("Not found");
        const business = await ctx.db.get(entry.businessId);
        if (!business || business.userId !== userId) throw new Error("Unauthorized");
        
        await ctx.db.delete(args.id);
    }
});

export const getImportEntries = query({
    args: {
        businessId: v.id("businesses"),
        month: v.number(),
        year: v.number(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return [];
        return await ctx.db
            .query("g50Imports")
            .withIndex("by_business_and_period", q => q.eq("businessId", args.businessId).eq("year", args.year).eq("month", args.month))
            .collect();
    }
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