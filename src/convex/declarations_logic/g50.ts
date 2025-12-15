import { v } from "convex/values";
import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { FISCAL_CONSTANTS } from "../fiscal";

// Helper to check membership (duplicated from declarations.ts, ideally should be in permissions or shared)
async function isMember(ctx: QueryCtx | MutationCtx, businessId: Id<"businesses">, userId: Id<"users">) {
    const member = await ctx.db
        .query("businessMembers")
        .withIndex("by_business_and_user", (q) => q.eq("businessId", businessId).eq("userId", userId))
        .first();
    return !!member;
}

export async function getG50DataLogic(ctx: QueryCtx, args: { businessId: Id<"businesses">, month: number, year: number }, userId: Id<"users">) {
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
            totalInvoicesCount: 0,
            totalPurchasesCount: 0,
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
        if (inv.paymentMethod === "CASH" && inv.status === "paid") {
            stampDutyTotal += inv.stampDutyAmount || 0;
        }

        const items = await ctx.db
            .query("invoiceItems")
            .withIndex("by_invoice", q => q.eq("invoiceId", inv._id))
            .collect();
        
        for (const item of items) {
            if (inv.fiscalType === "EXPORT") {
                turnoverExport += item.lineTotalHt || 0;
            } else if (inv.fiscalType === "EXEMPT" || item.tvaRate === 0) {
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

    // 3. Imports
    const imports = await ctx.db
        .query("g50Imports")
        .withIndex("by_business_and_period", q => q.eq("businessId", args.businessId).eq("year", args.year).eq("month", args.month))
        .collect();
    
    const importVat = imports.reduce((sum, imp) => sum + imp.vatPaid, 0);

    // 4. Totals
    const vatCollectedTotal = vatCollected19 + vatCollected9;
    const vatDeductibleTotal = purchaseVat19 + purchaseVat9 + importVat;
    
    const vatNetBeforeCredit = vatCollectedTotal - vatDeductibleTotal;
    
    // 5. Previous Credit
    let previousCredit = 0;
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
      turnover19, vatCollected19,
      turnover9, vatCollected9,
      turnoverExport, turnoverExempt,
      purchaseVat19, purchaseVat9,
      importVat, regularizationVat: 0,
      vatCollectedTotal, vatDeductibleTotal,
      vatNetBeforeCredit, previousCredit,
      vatNetAfterCredit, newCredit, vatPayable,
      stampDutyTotal,
      tap: 0,
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
}

export async function finalizeG50Logic(ctx: MutationCtx, args: any, userId: Id<"users">) {
    const business = await ctx.db.get(args.businessId as Id<"businesses">);
    if (!business || business.userId !== userId) throw new Error("Unauthorized");

    const existing = await ctx.db
        .query("g50Declarations")
        .withIndex("by_business_and_period", q => q.eq("businessId", args.businessId).eq("year", args.year).eq("month", args.month))
        .first();
    
    if (existing && existing.status === "FINALIZED") {
        throw new Error("Declaration already finalized");
    }

    // Re-calculate logic (simplified reuse of logic would be better, but for now we duplicate the calculation steps for safety in mutation)
    // In a real refactor, we'd extract the calculation core to a shared pure function.
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
        tap: 0,
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

    await ctx.db.patch(business._id, {
        vatCreditCarriedForward: newCredit
    });
}