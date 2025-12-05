import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";
import { FISCAL_CONSTANTS } from "./fiscal";

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
      if (inv.status === "paid") {
        cashIn += inv.totalTtc;
        if (inv.paymentMethod === "CASH") {
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
    let totalPaymentDelay = 0;
    let paidInvoiceCount = 0;

    for (const inv of invoices) {
      if (inv.status !== "cancelled" && inv.status !== "draft") {
        totalTurnover += inv.totalTtc || 0;
      }

      if (inv.status === "issued" || inv.status === "overdue") {
        outstandingAmount += inv.totalTtc;
      }
      if (inv.status === "overdue") {
        overdueCount++;
      }
      if (inv._creationTime >= startOfDay) {
        invoicesCreatedToday++;
      }
      
      // Calculate average payment delay for paid invoices
      // Note: We need a paymentDate field on invoices or payments table. 
      // Assuming we might not have it on invoice object directly in all cases, skipping for now or using creation vs update if status changed.
      // For now, we'll skip complex payment delay calc without a dedicated payment date field on invoice or join.
    }

    let expensesLoggedToday = 0;
    for (const pur of purchases) {
        if (pur.status === "unpaid") {
            accountsPayable += pur.totalTtc;
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
    // Defaulting to 26% (Distribution) as it's the common commercial rate if not specified.
    const ibsRate = FISCAL_CONSTANTS.IBS_RATES.DISTRIBUTION; 
    const ibsEstimate = netProfit > 0 ? netProfit * (ibsRate / 100) : 0;

    // Cash Flow (Net Cash Movement)
    // Cash In (Paid Invoices) - Cash Out (Paid Expenses)
    // We need to know paid expenses.
    let paidExpenses = 0;
    for (const pur of periodPurchases) {
        if (pur.status === "paid") paidExpenses += pur.totalTtc;
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
      cashFlow,
    };
  },
});

export const getFinancialBalance = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
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
            if (inv.status === "paid") {
                revenueCash += inv.totalTtc;
            } else {
                revenueCredit += inv.totalTtc;
            }
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
        if (inv.status === "paid") {
            cashTotal += inv.totalTtc;
        } else {
            // issued, overdue -> Considered as Credit (Créance)
            creditTotal += inv.totalTtc;
        }
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
  },
});

export const getRevenueTrend = query({
  args: { businessId: v.id("businesses"), year: v.optional(v.number()) },
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
            if (inv.status === "paid") {
                current.revenueCash += (inv.totalTtc || 0);
            } else {
                current.revenueCredit += (inv.totalTtc || 0);
            }
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
  },
});

export const getSalesStats = query({
  args: { 
    businessId: v.id("businesses"), 
    year: v.optional(v.number()),
    month: v.optional(v.number())
  },
  handler: async (ctx, args) => {
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
  },
});

export const getExpenseStats = query({
  args: { 
    businessId: v.id("businesses"),
    year: v.optional(v.number()),
    month: v.optional(v.number())
  },
  handler: async (ctx, args) => {
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
  },
});

export const getTreasuryStats = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
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
  },
});