import { v } from "convex/values";
import { query } from "./_generated/server";
import { getDashboardStatsHandler, getSummaryHandler } from "./report_logic/dashboard";
import { getFinancialBalanceHandler, getRevenueTrendHandler, getTreasuryStatsHandler } from "./report_logic/financial";
import { getSalesStatsHandler, getTopPerformersHandler } from "./report_logic/sales";
import { getExpenseStatsHandler } from "./report_logic/expenses";

export const getDashboardStats = query({
  args: {
    businessId: v.id("businesses"),
    year: v.optional(v.number()),
    month: v.optional(v.number()), // 0-11
  },
  handler: async (ctx, args) => {
    return getDashboardStatsHandler(ctx, args);
  },
});

export const getFinancialBalance = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    return getFinancialBalanceHandler(ctx, args);
  },
});

export const getRevenueTrend = query({
  args: { businessId: v.id("businesses"), year: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return getRevenueTrendHandler(ctx, args);
  },
});

export const getTopPerformers = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    return getTopPerformersHandler(ctx, args);
  },
});

export const getSummary = query({
  args: {
    businessId: v.id("businesses"),
    from: v.number(),
    to: v.number(),
  },
  handler: async (ctx, args) => {
    return getSummaryHandler(ctx, args);
  },
});

export const getSalesStats = query({
  args: { 
    businessId: v.id("businesses"), 
    year: v.optional(v.number()),
    month: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    return getSalesStatsHandler(ctx, args);
  },
});

export const getExpenseStats = query({
  args: { 
    businessId: v.id("businesses"),
    year: v.optional(v.number()),
    month: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    return getExpenseStatsHandler(ctx, args);
  },
});

export const getTreasuryStats = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    return getTreasuryStatsHandler(ctx, args);
  },
});