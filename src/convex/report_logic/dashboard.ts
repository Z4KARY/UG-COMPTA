import { v } from "convex/values";
import { QueryCtx } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "../_generated/dataModel";
import { FISCAL_CONSTANTS } from "../fiscal";

export interface DashboardStatsArgs {
  businessId: Id<"businesses">;
  year?: number;
  month?: number;
}

export const getDashboardStatsHandler = async (ctx: QueryCtx, args: DashboardStatsArgs) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // Verify access
    const member = await ctx.db
      .query("businessMembers")
      .withIndex("by_business_and_user", (q) =>
        q.eq("businessId", args.businessId).eq("userId", userId)
      )
      .first();
      
    const business = await ctx.db.get(args.businessId);
    if (!business) return null;
    
    // Allow if owner (legacy check) or member
    if (!member && business.userId !== userId) {
        return null;
    }

    const now = new Date();
    const year = args.year ?? now.getFullYear();
    const month = args.month ?? now.getMonth();

    const startDate = new Date(year, month, 1).getTime();
    const endDate = new Date(year, month + 1, 0, 23, 59, 59).getTime();
    const startOfDay = new Date(year, month, now.getDate()).getTime();

    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    // Fetch purchases for expenses calculation
    const purchases = await ctx.db
      .query("purchaseInvoices")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    // Fetch bank accounts for cash balance
    const accounts = await ctx.db
        .query("bankAccounts")
        .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
        .collect();
    const cashBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    // Fetch customer count
    const customers = await ctx.db
      .query("customers")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();
    const customerCount = customers.length;
    
    // New Customers this month
    const newCustomers = customers.filter(c => c._creationTime >= startDate && c._creationTime <= endDate).length;

    const periodInvoices = invoices.filter(
      (inv) =>
        inv.issueDate >= startDate &&
        inv.issueDate <= endDate &&
        inv.status !== "cancelled" &&
        inv.status !== "draft"
    );

    const periodPurchases = purchases.filter(
      (pur) =>
        pur.invoiceDate >= startDate &&
        pur.invoiceDate <= endDate
    );

    let turnover = 0;
    let tva = 0;
    let stampDuty = 0;
    let totalStampDuty = 0;
    let expenses = 0;
    let tvaDeductible = 0;
    let cashIn = 0; // Collected this month (approx based on paid invoices)

    for (const inv of periodInvoices) {
      turnover += inv.totalTtc || 0;
      tva += inv.totalTva || 0;
      totalStampDuty += inv.stampDutyAmount || 0;
      
      // Use amountPaid for cashIn
      const paidAmount = inv.amountPaid || 0;
      if (paidAmount > 0) {
        cashIn += paidAmount;
        if (inv.paymentMethod === "CASH" && inv.status === "paid") {
             stampDuty += inv.stampDutyAmount || 0;
        }
      }
    }

    for (const pur of periodPurchases) {
      expenses += pur.totalTtc || 0;
      tvaDeductible += pur.vatDeductible || 0;
    }

    // Calculate global stats (Outstanding & Overdue)
    let outstandingAmount = 0;
    let overdueCount = 0;
    let totalTurnover = 0;
    let accountsPayable = 0;
    let invoicesCreatedToday = 0;

    for (const inv of invoices) {
      if (inv.status !== "cancelled" && inv.status !== "draft") {
        totalTurnover += inv.totalTtc || 0;
      }

      if (inv.status === "issued" || inv.status === "overdue" || inv.status === "partial") {
        // Outstanding is Total - Paid
        outstandingAmount += (inv.totalTtc - (inv.amountPaid || 0));
      }
      if (inv.status === "overdue") {
        overdueCount++;
      }
      if (inv._creationTime >= startOfDay) {
        invoicesCreatedToday++;
      }
    }

    let expensesLoggedToday = 0;
    for (const pur of purchases) {
        if (pur.status === "unpaid" || pur.status === "partial") {
            accountsPayable += (pur.totalTtc - (pur.amountPaid || 0));
        }
        if (pur._creationTime >= startOfDay) {
            expensesLoggedToday++;
        }
    }

    // Net Profit = Revenue (HT) - Expenses (HT)
    // Revenue HT = Turnover (TTC) - TVA - Total Stamp Duty
    // Expenses HT = Expenses (TTC) - TVA Deductible
    const revenueHt = turnover - tva - totalStampDuty;
    const expensesHt = expenses - tvaDeductible;
    const netProfit = revenueHt - expensesHt;
    
    const netMargin = turnover > 0 ? (netProfit / turnover) * 100 : 0;
    const averageInvoiceValue = periodInvoices.length > 0 ? turnover / periodInvoices.length : 0;
    const tvaPayable = tva - tvaDeductible;

    // Advanced KPIs
    const ebitda = netProfit + tvaPayable; // Simplified approximation (Net + Taxes)
    const workingCapital = (cashBalance + outstandingAmount) - (accountsPayable + (tvaPayable > 0 ? tvaPayable : 0));
    
    // Cash Runway (Months)
    const monthlyBurnRate = expenses > 0 ? expenses : 1; 
    const cashRunway = cashBalance / monthlyBurnRate;

    // Tax Deadlines (Mock logic based on date)
    const nextG50Due = new Date(year, month + 1, 20).getTime(); // Usually 20th of next month
    const daysToG50 = Math.ceil((nextG50Due - now.getTime()) / (1000 * 60 * 60 * 24));

    // New Profitability & Tax Estimates
    // TAP (Taxe sur l'Activité Professionnelle) - Abrogated (0%)
    const tapEstimate = revenueHt * (FISCAL_CONSTANTS.TAP_RATE / 100);

    // IBS (Impôt sur les Bénéfices des Sociétés)
    // Rates: 19% (Production), 23% (Services/Construction), 26% (Distribution/Resale)
    const activity = business.mainActivity || "DISTRIBUTION";
    const ibsRate = FISCAL_CONSTANTS.IBS_RATES[activity as keyof typeof FISCAL_CONSTANTS.IBS_RATES] || FISCAL_CONSTANTS.IBS_RATES.DISTRIBUTION;
    
    const ibsEstimate = netProfit > 0 ? netProfit * (ibsRate / 100) : 0;

    // Cash Flow (Net Cash Movement)
    // Cash In (Paid Invoices) - Cash Out (Paid Expenses)
    // We need to know paid expenses.
    let paidExpenses = 0;
    for (const pur of periodPurchases) {
        paidExpenses += (pur.amountPaid || 0);
    }
    const cashFlow = cashIn - paidExpenses;

    return {
      turnover,
      totalTurnover,
      tva,
      tvaDeductible,
      tvaPayable,
      stampDuty: totalStampDuty,
      invoiceCount: periodInvoices.length,
      period: `${month + 1}/${year}`,
      expenses,
      netProfit,
      netMargin,
      averageInvoiceValue,
      outstandingAmount,
      overdueCount,
      customerCount,
      newCustomers,
      // New KPIs
      ebitda,
      workingCapital,
      cashRunway,
      accountsPayable,
      cashBalance,
      daysToG50,
      invoicesCreatedToday,
      expensesLoggedToday,
      tapEstimate,
      ibsEstimate,
      ibsRate,
      cashFlow,
    };
};

export interface SummaryArgs {
    businessId: Id<"businesses">;
    from: number;
    to: number;
}

export const getSummaryHandler = async (ctx: QueryCtx, args: SummaryArgs) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const business = await ctx.db.get(args.businessId);
    if (!business) return null;

    if (business.userId !== userId) {
        const member = await ctx.db
            .query("businessMembers")
            .withIndex("by_business_and_user", (q) => q.eq("businessId", args.businessId).eq("userId", userId))
            .first();
        if (!member) return null;
    }
    
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const periodInvoices = invoices.filter(
      (inv) =>
        inv.issueDate >= args.from &&
        inv.issueDate <= args.to &&
        inv.status !== "cancelled" &&
        inv.status !== "draft"
    );

    let turnover = 0;
    let tva = 0;
    let stampDuty = 0;
    let totalStampDuty = 0;
    let expenses = 0;
    let tvaDeductible = 0;

    for (const inv of periodInvoices) {
      turnover += inv.totalTtc || 0;
      tva += inv.totalTva || 0;
      totalStampDuty += inv.stampDutyAmount || 0;
      stampDuty += inv.stampDutyAmount || 0;
    }

    return {
      turnover,
      tva,
      stampDuty,
      invoiceCount: periodInvoices.length,
      period: `${new Date(args.from).toLocaleDateString()} - ${new Date(args.to).toLocaleDateString()}`,
    };
};