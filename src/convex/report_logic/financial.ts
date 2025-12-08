import { v } from "convex/values";
import { QueryCtx } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "../_generated/dataModel";

export interface FinancialBalanceArgs {
    businessId: Id<"businesses">;
}

export const getFinancialBalanceHandler = async (ctx: QueryCtx, args: FinancialBalanceArgs) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const business = await ctx.db.get(args.businessId);
    if (!business) return null;
    
    // Check access
    if (business.userId !== userId) {
        const member = await ctx.db
            .query("businessMembers")
            .withIndex("by_business_and_user", (q) => q.eq("businessId", args.businessId).eq("userId", userId))
            .first();
        if (!member) return null;
    }

    const now = new Date();
    
    // Time ranges
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).getTime(); // Sunday start
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    // Fetch all active invoices
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    // Fetch all purchases
    const purchases = await ctx.db
      .query("purchaseInvoices")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    // Filter relevant documents (active only)
    const activeInvoices = invoices.filter(i => i.status !== "cancelled" && i.status !== "draft");
    
    // Helper to calculate balance for a period
    const calculateForPeriod = (startDate: number) => {
        const periodInvoices = activeInvoices.filter(i => i.issueDate >= startDate);
        const periodPurchases = purchases.filter(p => p.invoiceDate >= startDate);

        let revenueCash = 0;
        let revenueCredit = 0;

        for (const inv of periodInvoices) {
            const paid = inv.amountPaid || 0;
            revenueCash += paid;
            revenueCredit += (inv.totalTtc - paid);
        }

        const revenue = revenueCash + revenueCredit;
        const expenses = periodPurchases.reduce((sum, p) => sum + p.totalTtc, 0);

        return {
            revenue,
            revenueCash,
            revenueCredit,
            expenses,
            balance: revenue - expenses
        };
    };

    const daily = calculateForPeriod(startOfDay);
    const weekly = calculateForPeriod(startOfWeek);
    const monthly = calculateForPeriod(startOfMonth);

    // Cash vs Credit Breakdown (Current Month)
    // "Cash" = Paid (Recouvrement) - Money received
    // "Credit" = Unpaid (Créances) - Money owed
    const monthInvoices = activeInvoices.filter(i => i.issueDate >= startOfMonth);
    
    let cashTotal = 0;
    let creditTotal = 0; 

    for (const inv of monthInvoices) {
        const paid = inv.amountPaid || 0;
        cashTotal += paid;
        creditTotal += (inv.totalTtc - paid);
    }

    return {
        daily,
        weekly,
        monthly,
        distribution: {
            cash: cashTotal,
            credit: creditTotal
        }
    };
};

export interface RevenueTrendArgs {
    businessId: Id<"businesses">;
    year?: number;
}

export const getRevenueTrendHandler = async (ctx: QueryCtx, args: RevenueTrendArgs) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Verify access (simplified)
    const business = await ctx.db.get(args.businessId);
    if (!business) return [];
    // In real app, check membership

    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .take(500); // Limit for performance

    const purchases = await ctx.db
      .query("purchaseInvoices")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .take(500);

    const monthlyData = new Map<string, { revenue: number; revenueCash: number; revenueCredit: number; expenses: number }>();
    const now = new Date();
    const year = args.year ?? now.getFullYear();
    
    // Initialize for the requested year (Jan - Dec)
    for (let i = 0; i < 12; i++) {
        const key = `${year}-${String(i + 1).padStart(2, '0')}`;
        monthlyData.set(key, { revenue: 0, revenueCash: 0, revenueCredit: 0, expenses: 0 });
    }

    for (const inv of invoices) {
        if (inv.status === "cancelled" || inv.status === "draft") continue;
        
        const d = new Date(inv.issueDate);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        
        if (monthlyData.has(key)) {
            const current = monthlyData.get(key)!;
            current.revenue += (inv.totalTtc || 0);
            
            const paid = inv.amountPaid || 0;
            current.revenueCash += paid;
            current.revenueCredit += (inv.totalTtc - paid);
        }
    }

    for (const pur of purchases) {
        const d = new Date(pur.invoiceDate);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        
        if (monthlyData.has(key)) {
            const current = monthlyData.get(key)!;
            current.expenses += (pur.totalTtc || 0);
        }
    }

    // Sort by month
    return Array.from(monthlyData.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([month, data]) => ({
            month,
            revenue: data.revenue,
            revenueCash: data.revenueCash,
            revenueCredit: data.revenueCredit,
            expenses: data.expenses,
            balance: data.revenue - data.expenses
        }));
};

export interface TreasuryStatsArgs {
    businessId: Id<"businesses">;
}

export const getTreasuryStatsHandler = async (ctx: QueryCtx, args: TreasuryStatsArgs) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const accounts = await ctx.db
        .query("bankAccounts")
        .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
        .collect();

    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    return {
        accounts,
        totalBalance
    };
};
