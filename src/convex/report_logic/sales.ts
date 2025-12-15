import { v } from "convex/values";
import { QueryCtx } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "../_generated/dataModel";

export interface SalesStatsArgs {
    businessId: Id<"businesses">;
    year?: number;
    month?: number;
}

export const getSalesStatsHandler = async (ctx: QueryCtx, args: SalesStatsArgs) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const now = new Date();
    const year = args.year ?? now.getFullYear();
    const month = args.month ?? now.getMonth();
    
    const startDate = new Date(year, month, 1).getTime();
    const endDate = new Date(year, month + 1, 0, 23, 59, 59).getTime();

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

    // Daily Sales
    const dailySales = new Map<number, number>();
    for (const inv of periodInvoices) {
        const day = new Date(inv.issueDate).getDate();
        dailySales.set(day, (dailySales.get(day) || 0) + inv.totalTtc);
    }

    const chartData = Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, i) => {
        const day = i + 1;
        return {
            day: day.toString(),
            amount: dailySales.get(day) || 0
        };
    });

    // Sales by Status
    const byStatus = {
        paid: 0,
        issued: 0,
        overdue: 0
    };

    // Payment Methods
    const paymentMethods = new Map<string, number>();

    for (const inv of periodInvoices) {
        if (inv.status === "paid") byStatus.paid += inv.totalTtc;
        else if (inv.status === "issued") byStatus.issued += inv.totalTtc;
        else if (inv.status === "overdue") byStatus.overdue += inv.totalTtc;

        if (inv.paymentMethod) {
            paymentMethods.set(inv.paymentMethod, (paymentMethods.get(inv.paymentMethod) || 0) + inv.totalTtc);
        }
    }

    // DSO Calculation (Days Sales Outstanding)
    // DSO = (Accounts Receivable / Total Credit Sales) * Number of Days
    // We'll use outstanding from ALL invoices for AR, and period sales for Credit Sales
    let totalOutstanding = 0;
    for (const inv of invoices) {
        if (inv.status === "issued" || inv.status === "overdue") {
            totalOutstanding += inv.totalTtc;
        }
    }
    const totalPeriodSales = periodInvoices.reduce((sum, inv) => sum + inv.totalTtc, 0);
    const dso = totalPeriodSales > 0 ? (totalOutstanding / totalPeriodSales) * 30 : 0;

    return {
        totalSales: totalPeriodSales,
        count: periodInvoices.length,
        chartData,
        byStatus,
        paymentMethods: Array.from(paymentMethods.entries()).map(([method, amount]) => ({ method, amount })),
        dso
    };
};

export interface TopPerformersArgs {
    businessId: Id<"businesses">;
}

export const getTopPerformersHandler = async (ctx: QueryCtx, args: TopPerformersArgs) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { customers: [], products: [] };

    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const validInvoices = invoices.filter(i => i.status !== "cancelled" && i.status !== "draft");

    // Top Customers
    const customerMap = new Map<string, number>();
    for (const inv of validInvoices) {
        const current = customerMap.get(inv.customerId) || 0;
        customerMap.set(inv.customerId, current + inv.totalTtc);
    }

    const sortedCustomers = Array.from(customerMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const topCustomers = await Promise.all(sortedCustomers.map(async ([id, amount]) => {
        const customer = await ctx.db.get(id as Id<"customers">);
        return { name: customer?.name || "Unknown", amount };
    }));

    // Top Products (requires fetching items)
    // This is expensive, so we'll limit to recent invoices or just do a best effort
    // For a scalable solution, we should aggregate this on write or use a separate analytics table.
    // Here we'll just scan the last 100 invoices.
    const recentInvoices = validInvoices.sort((a, b) => b.issueDate - a.issueDate).slice(0, 100);
    const productMap = new Map<string, number>();

    for (const inv of recentInvoices) {
        const items = await ctx.db
            .query("invoiceItems")
            .withIndex("by_invoice", (q) => q.eq("invoiceId", inv._id))
            .collect();
        
        for (const item of items) {
            const key = item.description; // Group by name as productId might be optional or deleted
            const current = productMap.get(key) || 0;
            productMap.set(key, current + item.lineTotal);
        }
    }

    const topProducts = Array.from(productMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, amount]) => ({ name, amount }));

    return { customers: topCustomers, products: topProducts };
};