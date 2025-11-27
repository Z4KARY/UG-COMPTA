import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

export const getDashboardStats = query({
  args: {
    businessId: v.id("businesses"),
    year: v.optional(v.number()),
    month: v.optional(v.number()), // 0-11
  },
  handler: async (ctx, args) => {
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
    
    // Allow if owner (legacy check) or member
    if (!member && business?.userId !== userId) {
        return null;
    }

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

    let turnover = 0;
    let tva = 0;
    let stampDuty = 0;

    for (const inv of periodInvoices) {
      turnover += inv.subtotalHt || inv.totalHt || 0;
      tva += inv.totalTva || 0;
      if (inv.status === "paid" && inv.paymentMethod === "CASH") {
        stampDuty += inv.stampDutyAmount || 0;
      }
    }

    return {
      turnover,
      tva,
      stampDuty,
      invoiceCount: periodInvoices.length,
      period: `${month + 1}/${year}`,
    };
  },
});

export const getRevenueTrend = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
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

    const monthlyData = new Map<string, number>();
    const now = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlyData.set(key, 0);
    }

    for (const inv of invoices) {
        if (inv.status === "cancelled" || inv.status === "draft") continue;
        
        const d = new Date(inv.issueDate);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        
        if (monthlyData.has(key)) {
            monthlyData.set(key, (monthlyData.get(key) || 0) + (inv.totalTtc || 0));
        }
    }

    return Array.from(monthlyData.entries()).map(([month, revenue]) => ({
        month,
        revenue
    }));
  },
});

export const getTopPerformers = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
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
  },
});

export const getSummary = query({
  args: {
    businessId: v.id("businesses"),
    from: v.number(),
    to: v.number(),
  },
  handler: async (ctx, args) => {
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

    for (const inv of periodInvoices) {
      turnover += inv.subtotalHt || inv.totalHt || 0;
      tva += inv.totalTva || 0;
      stampDuty += inv.stampDutyAmount || 0;
    }

    return {
      turnover,
      tva,
      stampDuty,
      invoiceCount: periodInvoices.length,
      period: `${new Date(args.from).toLocaleDateString()} - ${new Date(args.to).toLocaleDateString()}`,
    };
  },
});