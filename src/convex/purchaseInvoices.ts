import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const business = await ctx.db.get(args.businessId);
    if (!business) return [];
    
    if (business.userId !== userId) {
        const member = await ctx.db
            .query("businessMembers")
            .withIndex("by_business_and_user", (q) => q.eq("businessId", args.businessId).eq("userId", userId))
            .first();
        if (!member) return [];
    }

    const invoices = await ctx.db
      .query("purchaseInvoices")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .collect();

    // Enrich with supplier name
    const enriched = await Promise.all(invoices.map(async (inv) => {
        const supplier = await ctx.db.get(inv.supplierId);
        return {
            ...inv,
            supplierName: supplier?.name || "Unknown Supplier"
        };
    }));

    return enriched;
  },
});

export const create = mutation({
  args: {
    businessId: v.id("businesses"),
    supplierId: v.id("suppliers"),
    invoiceNumber: v.string(),
    invoiceDate: v.number(),
    paymentDate: v.optional(v.number()),
    paymentMethod: v.optional(v.union(
        v.literal("CASH"),
        v.literal("BANK_TRANSFER"),
        v.literal("CHEQUE"),
        v.literal("CARD"),
        v.literal("OTHER")
    )),
    description: v.optional(v.string()),
    items: v.array(v.object({
        description: v.string(),
        quantity: v.number(),
        unitPrice: v.number(),
        vatRate: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const business = await ctx.db.get(args.businessId);
    if (!business) throw new Error("Business not found");

    if (business.userId !== userId) {
         const member = await ctx.db
            .query("businessMembers")
            .withIndex("by_business_and_user", (q) => q.eq("businessId", args.businessId).eq("userId", userId))
            .first();
        if (!member) throw new Error("Unauthorized");
    }

    // Calculate totals
    let subtotalHt = 0;
    let vatTotal = 0;
    let totalTtc = 0;

    const calculatedItems = args.items.map(item => {
        const lineTotalHt = item.quantity * item.unitPrice;
        const vatAmount = lineTotalHt * (item.vatRate / 100);
        const lineTotalTtc = lineTotalHt + vatAmount;

        subtotalHt += lineTotalHt;
        vatTotal += vatAmount;
        totalTtc += lineTotalTtc;

        return {
            ...item,
            vatAmount,
            lineTotalHt,
            lineTotalTtc
        };
    });

    // Determine VAT deductible
    // If fiscal regime is VAT, usually 100% deductible unless specific rules apply.
    // For now, we assume full deductibility if the business is in VAT regime.
    let vatDeductible = 0;
    if (business.fiscalRegime === "VAT") {
        vatDeductible = vatTotal;
    }

    const purchaseInvoiceId = await ctx.db.insert("purchaseInvoices", {
        businessId: args.businessId,
        supplierId: args.supplierId,
        invoiceNumber: args.invoiceNumber,
        invoiceDate: args.invoiceDate,
        paymentDate: args.paymentDate,
        paymentMethod: args.paymentMethod,
        description: args.description,
        subtotalHt,
        vatTotal,
        totalTtc,
        vatDeductible,
    });

    for (const item of calculatedItems) {
        await ctx.db.insert("purchaseInvoiceItems", {
            purchaseInvoiceId,
            ...item
        });
    }

    return purchaseInvoiceId;
  },
});

export const remove = mutation({
    args: { id: v.id("purchaseInvoices") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const invoice = await ctx.db.get(args.id);
        if (!invoice) throw new Error("Invoice not found");

        const business = await ctx.db.get(invoice.businessId);
        if (!business) throw new Error("Business not found");

        if (business.userId !== userId) {
            const member = await ctx.db
                .query("businessMembers")
                .withIndex("by_business_and_user", (q) => q.eq("businessId", invoice.businessId).eq("userId", userId))
                .first();
            if (!member) throw new Error("Unauthorized");
        }

        // Delete items
        const items = await ctx.db
            .query("purchaseInvoiceItems")
            .withIndex("by_purchase_invoice", (q) => q.eq("purchaseInvoiceId", args.id))
            .collect();
        
        for (const item of items) {
            await ctx.db.delete(item._id);
        }

        await ctx.db.delete(args.id);
    }
});
