import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

// Helper to generate next purchase number
async function generatePurchaseNumber(
  ctx: any, 
  businessId: any, 
  dateTimestamp: number
) {
  const date = new Date(dateTimestamp);
  const year = date.getFullYear();
  const prefix = "ACH-"; // Default prefix for purchases

  // Get current counter
  const counter = await ctx.db
    .query("invoiceCounters")
    .withIndex("by_business_type_year", (q: any) => 
      q.eq("businessId", businessId).eq("type", "purchase").eq("year", year)
    )
    .first();

  let nextCount = 1;
  if (counter) {
    nextCount = counter.count + 1;
    await ctx.db.patch(counter._id, { count: nextCount });
  } else {
    await ctx.db.insert("invoiceCounters", {
      businessId,
      type: "purchase",
      year,
      count: nextCount,
    });
  }

  const paddedNumber = nextCount.toString().padStart(3, "0");
  return `${prefix}${year}-${paddedNumber}`;
}

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

export const listBySupplier = query({
  args: { 
    businessId: v.id("businesses"), 
    supplierId: v.id("suppliers") 
  },
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

    return await ctx.db
      .query("purchaseInvoices")
      .withIndex("by_supplier", (q) => q.eq("supplierId", args.supplierId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    businessId: v.id("businesses"),
    supplierId: v.id("suppliers"),
    invoiceNumber: v.optional(v.string()),
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

    // Generate Invoice Number if not provided or AUTO
    let finalInvoiceNumber = args.invoiceNumber;
    if (!finalInvoiceNumber || finalInvoiceNumber === "AUTO") {
        finalInvoiceNumber = await generatePurchaseNumber(ctx, args.businessId, args.invoiceDate);
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

    // Check for closed period
    const closure = await ctx.db.query("periodClosures")
        .withIndex("by_business", q => q.eq("businessId", args.businessId))
        .filter(q => q.and(q.lte(q.field("startDate"), args.invoiceDate), q.gte(q.field("endDate"), args.invoiceDate)))
        .first();
    
    if (closure) {
        throw new Error("Cannot record purchase in a closed period");
    }

    const purchaseInvoiceId = await ctx.db.insert("purchaseInvoices", {
        businessId: args.businessId,
        supplierId: args.supplierId,
        invoiceNumber: finalInvoiceNumber,
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

    // Trigger Webhook
    await ctx.scheduler.runAfter(0, internal.webhookActions.trigger, {
        businessId: args.businessId,
        event: "purchase_invoice.created",
        payload: {
            id: purchaseInvoiceId,
            invoiceNumber: finalInvoiceNumber,
            supplierId: args.supplierId,
            totalTtc,
            createdAt: Date.now(),
        }
    });

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

        // Check for closed period
        const closure = await ctx.db.query("periodClosures")
            .withIndex("by_business", q => q.eq("businessId", invoice.businessId))
            .filter(q => q.and(q.lte(q.field("startDate"), invoice.invoiceDate), q.gte(q.field("endDate"), invoice.invoiceDate)))
            .first();
        
        if (closure) {
            throw new Error("Cannot delete purchase from a closed period");
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