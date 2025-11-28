import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { calculateStampDuty, calculateLineItem, FISCAL_CONSTANTS, StampDutyConfig } from "./fiscal";
import { internal } from "./_generated/api";

export const list = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const business = await ctx.db.get(args.businessId);
    if (!business || business.userId !== userId) return [];

    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .collect();

    // Fetch customer names for each invoice
    const invoicesWithCustomer = await Promise.all(
      invoices.map(async (invoice) => {
        const customer = await ctx.db.get(invoice.customerId);
        return { ...invoice, customerName: customer?.name || "Unknown" };
      })
    );

    return invoicesWithCustomer;
  },
});

export const get = query({
  args: { id: v.id("invoices") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const invoice = await ctx.db.get(args.id);
    if (!invoice) return null;

    const business = await ctx.db.get(invoice.businessId);
    if (!business || business.userId !== userId) return null;

    const customer = await ctx.db.get(invoice.customerId);
    const items = await ctx.db
      .query("invoiceItems")
      .withIndex("by_invoice", (q) => q.eq("invoiceId", invoice._id))
      .collect();

    return { ...invoice, customer, items };
  },
});

export const create = mutation({
  args: {
    businessId: v.id("businesses"),
    customerId: v.id("customers"),
    invoiceNumber: v.string(),
    type: v.union(
      v.literal("invoice"),
      v.literal("quote"),
      v.literal("credit_note")
    ),
    issueDate: v.number(),
    dueDate: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("issued"),
      v.literal("paid"),
      v.literal("overdue"),
      v.literal("cancelled")
    ),
    notes: v.optional(v.string()),
    
    paymentMethod: v.optional(v.union(
      v.literal("CASH"),
      v.literal("BANK_TRANSFER"),
      v.literal("CHEQUE"),
      v.literal("CARD"),
      v.literal("OTHER")
    )),
    
    // We accept these but will recalculate them server-side for security
    subtotalHt: v.number(),
    discountTotal: v.optional(v.number()),
    totalTva: v.number(),
    stampDutyAmount: v.optional(v.number()),
    totalTtc: v.number(),
    
    // Legacy/Optional
    timbre: v.optional(v.boolean()),
    cashPenaltyPercentage: v.optional(v.number()),
    totalHt: v.optional(v.number()),

    items: v.array(
      v.object({
        productId: v.optional(v.id("products")),
        description: v.string(),
        quantity: v.number(),
        unitPrice: v.number(),
        discountRate: v.optional(v.number()),
        tvaRate: v.number(),
        lineTotal: v.number(),
        lineTotalHt: v.optional(v.number()),
        lineTotalTtc: v.optional(v.number()),
        productType: v.optional(v.union(v.literal("goods"), v.literal("service"))),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const business = await ctx.db.get(args.businessId);
    if (!business || business.userId !== userId) throw new Error("Unauthorized");

    // Fetch Fiscal Parameters (Stamp Duty)
    // Try business specific first, then global, then default
    let stampDutyConfig: StampDutyConfig = FISCAL_CONSTANTS.STAMP_DUTY;
    
    const businessParam = await ctx.db
        .query("fiscalParameters")
        .withIndex("by_business_and_code", (q) => 
          q.eq("businessId", args.businessId).eq("code", "STAMP_DUTY")
        )
        .first();
    
    if (businessParam) {
        stampDutyConfig = businessParam.value as StampDutyConfig;
    } else {
        const globalParam = await ctx.db
            .query("fiscalParameters")
            .withIndex("by_business_and_code", (q) => 
              q.eq("businessId", undefined).eq("code", "STAMP_DUTY")
            )
            .first();
        if (globalParam) {
            stampDutyConfig = globalParam.value as StampDutyConfig;
        }
    }

    // Server-side calculation to ensure fiscal compliance
    let calculatedSubtotalHt = 0;
    let calculatedTotalTva = 0;
    let calculatedDiscountTotal = 0;

    const processedItems = args.items.map(item => {
      const { discountAmount, lineTotalHt, tvaAmount, lineTotalTtc } = calculateLineItem(
        item.quantity,
        item.unitPrice,
        item.discountRate || 0,
        item.tvaRate
      );

      calculatedSubtotalHt += lineTotalHt;
      calculatedTotalTva += tvaAmount;
      calculatedDiscountTotal += discountAmount;

      return {
        ...item,
        discountAmount,
        tvaAmount,
        lineTotal: lineTotalHt, // Storing HT as lineTotal
        lineTotalHt,
        lineTotalTtc
      };
    });

    // Round totals after summation (or sum rounded lines? The prompt says:
    // subtotal_ht = Σ(line_total_ht)
    // vat_total = Σ(vat_amount)
    // So we sum the rounded line values.
    
    // Ensure totals are rounded too just in case of float errors during sum
    calculatedSubtotalHt = Math.round((calculatedSubtotalHt + Number.EPSILON) * 100) / 100;
    calculatedTotalTva = Math.round((calculatedTotalTva + Number.EPSILON) * 100) / 100;
    calculatedDiscountTotal = Math.round((calculatedDiscountTotal + Number.EPSILON) * 100) / 100;

    const totalBeforeStamp = calculatedSubtotalHt + calculatedTotalTva;
    
    // Calculate Stamp Duty (Droit de Timbre) using fetched config
    const stampDutyAmount = calculateStampDuty(
      totalBeforeStamp, 
      args.paymentMethod || "OTHER",
      stampDutyConfig
    );

    const finalTotalTtc = totalBeforeStamp + stampDutyAmount;

    const invoiceData = {
      businessId: args.businessId,
      customerId: args.customerId,
      invoiceNumber: args.invoiceNumber,
      type: args.type,
      issueDate: args.issueDate,
      dueDate: args.dueDate,
      currency: args.currency,
      status: args.status,
      notes: args.notes,
      paymentMethod: args.paymentMethod,
      
      subtotalHt: calculatedSubtotalHt,
      totalHt: calculatedSubtotalHt, // Legacy alias
      discountTotal: calculatedDiscountTotal,
      totalTva: calculatedTotalTva,
      stampDutyAmount: stampDutyAmount,
      totalTtc: finalTotalTtc,
      
      // Clear legacy fields if not needed or set them for compat
      timbre: stampDutyAmount > 0,
    };

    const invoiceId = await ctx.db.insert("invoices", invoiceData);

    for (const item of processedItems) {
      await ctx.db.insert("invoiceItems", {
        invoiceId,
        ...item,
        productType: item.productType || "service", // Default to service if not specified
      });
    }

    await ctx.scheduler.runAfter(0, internal.audit.log, {
        businessId: args.businessId,
        userId,
        entityType: "INVOICE",
        entityId: invoiceId,
        action: "CREATE",
        payloadAfter: invoiceData,
    });

    return invoiceId;
  },
});

export const update = mutation({
  args: {
    id: v.id("invoices"),
    customerId: v.optional(v.id("customers")),
    invoiceNumber: v.optional(v.string()),
    type: v.optional(v.union(
      v.literal("invoice"),
      v.literal("quote"),
      v.literal("credit_note")
    )),
    issueDate: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    currency: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("issued"),
      v.literal("paid"),
      v.literal("overdue"),
      v.literal("cancelled")
    )),
    notes: v.optional(v.string()),
    paymentMethod: v.optional(v.union(
      v.literal("CASH"),
      v.literal("BANK_TRANSFER"),
      v.literal("CHEQUE"),
      v.literal("CARD"),
      v.literal("OTHER")
    )),
    subtotalHt: v.optional(v.number()),
    discountTotal: v.optional(v.number()),
    totalTva: v.optional(v.number()),
    stampDutyAmount: v.optional(v.number()),
    totalTtc: v.optional(v.number()),
    items: v.optional(v.array(
      v.object({
        productId: v.optional(v.id("products")),
        description: v.string(),
        quantity: v.number(),
        unitPrice: v.number(),
        discountRate: v.optional(v.number()),
        tvaRate: v.number(),
        lineTotal: v.number(),
        lineTotalHt: v.optional(v.number()),
        lineTotalTtc: v.optional(v.number()),
        productType: v.optional(v.union(v.literal("goods"), v.literal("service"))),
      })
    )),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const invoice = await ctx.db.get(args.id);
    if (!invoice) throw new Error("Not found");

    const business = await ctx.db.get(invoice.businessId);
    if (!business || business.userId !== userId) throw new Error("Unauthorized");

    // Prevent editing if paid or cancelled
    if (invoice.status === "paid" || invoice.status === "cancelled") {
        throw new Error("Cannot edit finalized invoice");
    }

    const { id, items, ...fields } = args;

    // Update invoice fields
    await ctx.db.patch(id, fields);

    // If items are provided, replace them
    if (items) {
      // Delete existing items
      const existingItems = await ctx.db
        .query("invoiceItems")
        .withIndex("by_invoice", (q) => q.eq("invoiceId", id))
        .collect();
      
      for (const item of existingItems) {
        await ctx.db.delete(item._id);
      }

      // Insert new items
      for (const item of items) {
        const { discountAmount, lineTotalHt, tvaAmount, lineTotalTtc } = calculateLineItem(
            item.quantity,
            item.unitPrice,
            item.discountRate || 0,
            item.tvaRate
        );

        await ctx.db.insert("invoiceItems", {
          invoiceId: id,
          ...item,
          discountAmount,
          tvaAmount,
          lineTotal: lineTotalHt,
          lineTotalHt,
          lineTotalTtc,
          productType: item.productType || "service",
        });
      }
    }

    await ctx.scheduler.runAfter(0, internal.audit.log, {
        businessId: invoice.businessId,
        userId,
        entityType: "INVOICE",
        entityId: id,
        action: "UPDATE",
        payloadBefore: invoice,
        payloadAfter: args,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("invoices") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const invoice = await ctx.db.get(args.id);
    if (!invoice) throw new Error("Not found");

    const business = await ctx.db.get(invoice.businessId);
    if (!business || business.userId !== userId) throw new Error("Unauthorized");

    // Delete items first
    const items = await ctx.db
      .query("invoiceItems")
      .withIndex("by_invoice", (q) => q.eq("invoiceId", args.id))
      .collect();

    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    // Delete invoice
    await ctx.db.delete(args.id);

    await ctx.scheduler.runAfter(0, internal.audit.log, {
        businessId: invoice.businessId,
        userId,
        entityType: "INVOICE",
        entityId: args.id,
        action: "DELETE",
        payloadBefore: invoice,
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("invoices"),
    status: v.union(
      v.literal("draft"),
      v.literal("issued"),
      v.literal("paid"),
      v.literal("overdue"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const invoice = await ctx.db.get(args.id);
    if (!invoice) throw new Error("Not found");

    const business = await ctx.db.get(invoice.businessId);
    if (!business || business.userId !== userId) throw new Error("Unauthorized");

    await ctx.db.patch(args.id, { status: args.status });

    await ctx.scheduler.runAfter(0, internal.audit.log, {
        businessId: invoice.businessId,
        userId,
        entityType: "INVOICE",
        entityId: args.id,
        action: "UPDATE",
        payloadBefore: { status: invoice.status },
        payloadAfter: { status: args.status },
    });
  },
});

export const issue = mutation({
  args: { 
    id: v.id("invoices"),
    pdfHash: v.optional(v.string()), // Optional hash of the generated PDF
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const invoice = await ctx.db.get(args.id);
    if (!invoice) throw new Error("Not found");

    const business = await ctx.db.get(invoice.businessId);
    if (!business || business.userId !== userId) {
         // Check member role
         const member = await ctx.db
            .query("businessMembers")
            .withIndex("by_business_and_user", (q) => q.eq("businessId", invoice.businessId).eq("userId", userId))
            .first();
         if (!member) {
             throw new Error("Unauthorized");
         }
    }

    if (invoice.status !== "draft") throw new Error("Invoice already issued or processed");

    await ctx.db.patch(args.id, { 
        status: "issued",
        pdfHash: args.pdfHash,
    });

    await ctx.scheduler.runAfter(0, internal.audit.log, {
        businessId: invoice.businessId,
        userId,
        entityType: "INVOICE",
        entityId: args.id,
        action: "ISSUE",
        payloadBefore: { status: invoice.status },
        payloadAfter: { status: "issued", pdfHash: args.pdfHash },
    });
  },
});

export const markAsPaid = mutation({
  args: { 
    id: v.id("invoices"),
    amount: v.number(),
    paymentMethod: v.union(
        v.literal("CASH"),
        v.literal("BANK_TRANSFER"),
        v.literal("CHEQUE"),
        v.literal("CARD"),
        v.literal("OTHER")
    ),
    paymentDate: v.number(),
    reference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const invoice = await ctx.db.get(args.id);
    if (!invoice) throw new Error("Not found");

    const business = await ctx.db.get(invoice.businessId);
    if (!business || business.userId !== userId) {
         const member = await ctx.db
            .query("businessMembers")
            .withIndex("by_business_and_user", (q) => q.eq("businessId", invoice.businessId).eq("userId", userId))
            .first();
         if (!member) throw new Error("Unauthorized");
    }

    await ctx.db.insert("payments", {
        invoiceId: args.id,
        amount: args.amount,
        paymentMethod: args.paymentMethod,
        paymentDate: args.paymentDate,
        reference: args.reference,
    });

    await ctx.db.patch(args.id, { status: "paid" });

    await ctx.scheduler.runAfter(0, internal.audit.log, {
        businessId: invoice.businessId,
        userId,
        entityType: "INVOICE",
        entityId: args.id,
        action: "MARK_PAID",
        payloadBefore: { status: invoice.status },
        payloadAfter: { status: "paid", payment: args },
    });
  },
});