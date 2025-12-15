import { QueryCtx } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "../_generated/dataModel";

export interface ExpenseStatsArgs {
    businessId: Id<"businesses">;
    year?: number;
    month?: number;
}

export const getExpenseStatsHandler = async (ctx: QueryCtx, args: ExpenseStatsArgs) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const now = new Date();
    const year = args.year ?? now.getFullYear();
    const month = args.month ?? now.getMonth();
    
    const startDate = new Date(year, month, 1).getTime();
    const endDate = new Date(year, month + 1, 0, 23, 59, 59).getTime();

    const purchases = await ctx.db
      .query("purchaseInvoices")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const periodPurchases = purchases.filter(
      (p) => p.invoiceDate >= startDate && p.invoiceDate <= endDate
    );

    // By Category
    const byCategory = new Map<string, number>();
    let accountsPayable = 0;
    let paidExpenses = 0;

    for (const p of periodPurchases) {
        const cat = p.category || "Uncategorized";
        byCategory.set(cat, (byCategory.get(cat) || 0) + p.totalTtc);
        
        if (p.status === "unpaid") accountsPayable += p.totalTtc;
        else paidExpenses += p.totalTtc;
    }
    
    // Calculate Burn Rate (Average monthly expenses over last 3 months)
    // For simplicity, we'll just use current month for now, or fetch more if needed.
    // Let's stick to current month burn rate.
    const burnRate = periodPurchases.reduce((sum, p) => sum + p.totalTtc, 0);

    return {
        totalExpenses: burnRate,
        count: periodPurchases.length,
        byCategory: Array.from(byCategory.entries()).map(([name, value]) => ({ name, value })),
        accountsPayable,
        paidExpenses,
        burnRate
    };
};