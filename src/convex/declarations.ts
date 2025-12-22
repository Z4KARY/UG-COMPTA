import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { getG50DataLogic, finalizeG50Logic } from "./declarations_logic/g50";
import { getG12DataLogic, getG12IFUDataLogic, getAEInvoicesExportDataLogic, saveG12ForecastLogic } from "./declarations_logic/g12";

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
    return await getG50DataLogic(ctx, args, userId);
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
        await finalizeG50Logic(ctx, args, userId);
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

        const entryData: any = {
            businessId: args.businessId,
            month: args.month,
            year: args.year,
            customsValue: args.customsValue,
            vatPaid: args.vatPaid,
            description: args.description,
        };

        Object.keys(entryData).forEach(key => {
            if (entryData[key] === undefined) delete entryData[key];
        });

        await ctx.db.insert("g50Imports", entryData);
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
    return await getG12DataLogic(ctx, args, userId);
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
    return await getG12IFUDataLogic(ctx, args, userId);
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
    return await getAEInvoicesExportDataLogic(ctx, args, userId);
  }
});

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
    await saveG12ForecastLogic(ctx, args, userId);
  },
});