import { v } from "convex/values";
import { MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { calculateLineItem, calculateStampDuty, FISCAL_CONSTANTS, StampDutyConfig } from "./fiscal";
import { internal } from "./_generated/api";

// Helper to generate next invoice number
export async function generateInvoiceNumber(
  ctx: MutationCtx, 
  businessId: Id<"businesses">, 
  type: "invoice" | "quote" | "credit_note", 
  dateTimestamp: number
) {
  const date = new Date(dateTimestamp);
  const year = date.getFullYear();
  
  // Get business settings for prefixes
  const business = await ctx.db.get(businessId);
  let prefix = "";
  if (type === "invoice") prefix = business?.invoicePrefix || "INV-";
  if (type === "quote") prefix = business?.quotePrefix || "DEV-";
  if (type === "credit_note") prefix = business?.creditNotePrefix || "AV-";

  // Get current counter
  const counter = await ctx.db
    .query("invoiceCounters")
    .withIndex("by_business_type_year", (q) => 
      q.eq("businessId", businessId).eq("type", type).eq("year", year)
    )
    .first();

  let nextCount = 1;
  if (counter) {
    nextCount = counter.count + 1;
    await ctx.db.patch(counter._id, { count: nextCount });
  } else {
    await ctx.db.insert("invoiceCounters", {
      businessId,
      type,
      year,
      count: nextCount,
    });
  }
  
  const paddedNumber = nextCount.toString().padStart(3, "0");
  return `${prefix}${year}-${paddedNumber}`;
}

export async function createInvoiceLogic(ctx: MutationCtx, args: any, userId: string) {
    const business = await ctx.db.get(args.businessId);
    if (!business || business.userId !== userId) throw new Error("Unauthorized");

    // Generate Invoice Number if not provided
    let finalInvoiceNumber = args.invoiceNumber;
    if (!finalInvoiceNumber || finalInvoiceNumber === "AUTO") {
        finalInvoiceNumber = await generateInvoiceNumber(ctx, args.businessId, args.type, args.issueDate);
    }

    // Auto-Entrepreneur Logic Enforcement: NO VAT
    const isAE = business.type === "auto_entrepreneur";

    // Fetch Fiscal Parameters (Stamp Duty)
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

    // Check for closed period
    const closure = await ctx.db.query("periodClosures")
        .withIndex("by_business", q => q.eq("businessId", args.businessId))
        .filter(q => q.and(q.lte(q.field("startDate"), args.issueDate), q.gte(q.field("endDate"), args.issueDate)))
        .first();
    
    if (closure) {
        throw new Error(`Cannot create invoice in a closed period (${new Date(closure.startDate).toLocaleDateString()} - ${new Date(closure.endDate).toLocaleDateString()})`);
    }

    // Server-side calculation to ensure fiscal compliance
    let calculatedSubtotalHt = 0;
    let calculatedTotalTva = 0;
    let calculatedDiscountTotal = 0;

    const processedItems = args.items.map((item: any) => {
      // Force TVA to 0 for Auto-Entrepreneur
      const effectiveTvaRate = isAE ? 0 : item.tvaRate;

      const { discountAmount, lineTotalHt, tvaAmount, lineTotalTtc } = calculateLineItem(
        item.quantity,
        item.unitPrice,
        item.discountRate || 0,
        effectiveTvaRate
      );

      calculatedSubtotalHt += lineTotalHt;
      calculatedTotalTva += tvaAmount;
      calculatedDiscountTotal += discountAmount;

      return {
        ...item,
        tvaRate: effectiveTvaRate, // Enforce 0 in storage
        discountAmount,
        tvaAmount,
        lineTotal: lineTotalHt, // Storing HT as lineTotal
        lineTotalHt,
        lineTotalTtc
      };
    });

    calculatedSubtotalHt = Math.round((calculatedSubtotalHt + Number.EPSILON) * 100) / 100;
    calculatedTotalTva = Math.round((calculatedTotalTva + Number.EPSILON) * 100) / 100;
    calculatedDiscountTotal = Math.round((calculatedDiscountTotal + Number.EPSILON) * 100) / 100;

    const totalBeforeStamp = calculatedSubtotalHt + calculatedTotalTva;
    
    const stampDutyAmount = calculateStampDuty(
      totalBeforeStamp, 
      args.paymentMethod || "OTHER",
      stampDutyConfig
    );

    const finalTotalTtc = totalBeforeStamp + stampDutyAmount;

    const invoiceData = {
      businessId: args.businessId,
      customerId: args.customerId,
      invoiceNumber: finalInvoiceNumber!,
      type: args.type,
      fiscalType: args.fiscalType,
      language: args.language || "fr",
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
      amountPaid: 0,
      
      timbre: stampDutyAmount > 0,
    };

    const invoiceId = await ctx.db.insert("invoices", invoiceData);

    for (const item of processedItems) {
      await ctx.db.insert("invoiceItems", {
        invoiceId,
        ...item,
        productType: item.productType || "service",
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

    await ctx.scheduler.runAfter(0, internal.webhookActions.trigger, {
        businessId: args.businessId,
        event: "invoice.created",
        payload: {
            id: invoiceId,
            invoiceNumber: args.invoiceNumber,
            totalTtc: finalTotalTtc,
            customerId: args.customerId,
            createdAt: Date.now(),
        }
    });

    return invoiceId;
}

export async function updateInvoiceLogic(ctx: MutationCtx, args: any, userId: string) {
    const invoice = await ctx.db.get(args.id);
    if (!invoice) throw new Error("Not found");

    const business = await ctx.db.get(invoice.businessId);
    if (!business || business.userId !== userId) throw new Error("Unauthorized");

    // Prevent editing if paid or cancelled
    if (invoice.status === "paid" || invoice.status === "cancelled") {
        throw new Error("Cannot edit finalized invoice");
    }

    // Check if existing invoice date is in closed period
    const existingClosure = await ctx.db.query("periodClosures")
        .withIndex("by_business", q => q.eq("businessId", invoice.businessId))
        .filter(q => q.and(q.lte(q.field("startDate"), invoice.issueDate), q.gte(q.field("endDate"), invoice.issueDate)))
        .first();
    
    if (existingClosure) {
        throw new Error("Cannot edit invoice in a closed period");
    }

    // Check if new date is in closed period (if changing date)
    if (args.issueDate !== undefined) {
        const newIssueDate = args.issueDate;
        const newClosure = await ctx.db.query("periodClosures")
            .withIndex("by_business", q => q.eq("businessId", invoice.businessId))
            .filter(q => q.and(q.lte(q.field("startDate"), newIssueDate), q.gte(q.field("endDate"), newIssueDate)))
            .first();
        
        if (newClosure) {
            throw new Error("Cannot move invoice to a closed period");
        }
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
}

export async function deleteInvoiceLogic(ctx: MutationCtx, args: { id: Id<"invoices"> }, userId: string) {
    const invoice = await ctx.db.get(args.id);
    if (!invoice) throw new Error("Not found");

    const business = await ctx.db.get(invoice.businessId);
    if (!business || business.userId !== userId) throw new Error("Unauthorized");

    // Check for closed period
    const closure = await ctx.db.query("periodClosures")
        .withIndex("by_business", q => q.eq("businessId", invoice.businessId))
        .filter(q => q.and(q.lte(q.field("startDate"), invoice.issueDate), q.gte(q.field("endDate"), invoice.issueDate)))
        .first();
    
    if (closure) {
        throw new Error("Cannot delete invoice in a closed period");
    }

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
}

export async function updateInvoiceStatusLogic(ctx: MutationCtx, args: { id: Id<"invoices">, status: string }, userId: string) {
    const invoice = await ctx.db.get(args.id);
    if (!invoice) throw new Error("Not found");

    const business = await ctx.db.get(invoice.businessId);
    if (!business || business.userId !== userId) throw new Error("Unauthorized");

    await ctx.db.patch(args.id, { status: args.status as any });

    await ctx.scheduler.runAfter(0, internal.audit.log, {
        businessId: invoice.businessId,
        userId,
        entityType: "INVOICE",
        entityId: args.id,
        action: "UPDATE",
        payloadBefore: { status: invoice.status },
        payloadAfter: { status: args.status },
    });
}

export async function issueInvoiceLogic(ctx: MutationCtx, args: { id: Id<"invoices">, pdfHash?: string }, userId: string) {
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

    // Check for closed period
    const closure = await ctx.db.query("periodClosures")
        .withIndex("by_business", q => q.eq("businessId", invoice.businessId))
        .filter(q => q.and(q.lte(q.field("startDate"), invoice.issueDate), q.gte(q.field("endDate"), invoice.issueDate)))
        .first();
    
    if (closure) {
        throw new Error("Cannot issue invoice in a closed period");
    }

    await ctx.db.patch(args.id, { 
        status: "issued",
        pdfHash: args.pdfHash,
    });

    // Schedule creation of default reminders
    await ctx.scheduler.runAfter(0, internal.reminders.createDefaults, {
        invoiceId: args.id
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

    // Trigger Webhook
    await ctx.scheduler.runAfter(0, internal.webhookActions.trigger, {
        businessId: invoice.businessId,
        event: "invoice.issued",
        payload: {
            id: args.id,
            invoiceNumber: invoice.invoiceNumber,
            totalTtc: invoice.totalTtc,
            issuedAt: Date.now(),
        }
    });
}

export async function markInvoiceAsPaidLogic(ctx: MutationCtx, args: any, userId: string) {
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

    // Check for closed period (Payment Date)
    const closure = await ctx.db.query("periodClosures")
        .withIndex("by_business", q => q.eq("businessId", invoice.businessId))
        .filter(q => q.and(q.lte(q.field("startDate"), args.paymentDate), q.gte(q.field("endDate"), args.paymentDate)))
        .first();
    
    if (closure) {
        throw new Error("Cannot record payment in a closed period");
    }

    await ctx.db.insert("payments", {
        invoiceId: args.id,
        amount: args.amount,
        paymentMethod: args.paymentMethod,
        paymentDate: args.paymentDate,
        reference: args.reference,
        notes: args.notes,
    });

    const newAmountPaid = (invoice.amountPaid || 0) + args.amount;

    await ctx.db.patch(args.id, { 
        status: "paid",
        amountPaid: newAmountPaid
    });

    await ctx.scheduler.runAfter(0, internal.audit.log, {
        businessId: invoice.businessId,
        userId,
        entityType: "INVOICE",
        entityId: args.id,
        action: "MARK_PAID",
        payloadBefore: { status: invoice.status, amountPaid: invoice.amountPaid },
        payloadAfter: { status: "paid", amountPaid: newAmountPaid, payment: args },
    });

    // Trigger Webhook
    await ctx.scheduler.runAfter(0, internal.webhookActions.trigger, {
        businessId: invoice.businessId,
        event: "invoice.paid",
        payload: {
            id: args.id,
            invoiceNumber: invoice.invoiceNumber,
            amount: args.amount,
            paymentDate: args.paymentDate,
        }
    });
}

export async function markInvoiceAsUnpaidLogic(ctx: MutationCtx, args: { id: Id<"invoices"> }, userId: string) {
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

    // Check for closed period for any existing payments
    const payments = await ctx.db
        .query("payments")
        .withIndex("by_invoice", (q) => q.eq("invoiceId", args.id))
        .collect();

    for (const payment of payments) {
        const closure = await ctx.db.query("periodClosures")
            .withIndex("by_business", q => q.eq("businessId", invoice.businessId))
            .filter(q => q.and(q.lte(q.field("startDate"), payment.paymentDate), q.gte(q.field("endDate"), payment.paymentDate)))
            .first();
        
        if (closure) {
            throw new Error("Cannot remove payment from a closed period");
        }
    }

    // Delete payments
    for (const payment of payments) {
        await ctx.db.delete(payment._id);
    }

    // Reset status
    const now = Date.now();
    let newStatus = "issued";
    if (invoice.dueDate < now) {
        newStatus = "overdue";
    }
    
    await ctx.db.patch(args.id, { 
        status: newStatus as any,
        amountPaid: 0,
        paymentMethod: undefined 
    });

    await ctx.scheduler.runAfter(0, internal.audit.log, {
        businessId: invoice.businessId,
        userId,
        entityType: "INVOICE",
        entityId: args.id,
        action: "UPDATE",
        payloadBefore: { status: invoice.status, amountPaid: invoice.amountPaid },
        payloadAfter: { status: newStatus, amountPaid: 0 },
    });
}

export async function addInvoicePaymentLogic(ctx: MutationCtx, args: any, userId: string) {
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

    // Check for closed period (Payment Date)
    const closure = await ctx.db.query("periodClosures")
        .withIndex("by_business", q => q.eq("businessId", invoice.businessId))
        .filter(q => q.and(q.lte(q.field("startDate"), args.paymentDate), q.gte(q.field("endDate"), args.paymentDate)))
        .first();
    
    if (closure) {
        throw new Error("Cannot record payment in a closed period");
    }

    await ctx.db.insert("payments", {
        invoiceId: args.id,
        amount: args.amount,
        paymentMethod: args.paymentMethod,
        paymentDate: args.paymentDate,
        reference: args.reference,
        notes: args.notes,
    });

    // Update Invoice Status and Amount Paid
    const currentPaid = invoice.amountPaid || 0;
    const newPaid = currentPaid + args.amount;
    
    let newStatus = invoice.status;
    // Allow small floating point margin of error
    if (newPaid >= (invoice.totalTtc - 0.01)) {
        newStatus = "paid";
    } else if (newPaid > 0) {
        newStatus = "partial";
    }

    await ctx.db.patch(args.id, { 
        status: newStatus,
        amountPaid: newPaid
    });

    await ctx.scheduler.runAfter(0, internal.audit.log, {
        businessId: invoice.businessId,
        userId,
        entityType: "INVOICE",
        entityId: args.id,
        action: "MARK_PAID",
        payloadBefore: { status: invoice.status, amountPaid: invoice.amountPaid },
        payloadAfter: { status: newStatus, amountPaid: newPaid, payment: args },
    });

    // Trigger Webhook
    await ctx.scheduler.runAfter(0, internal.webhookActions.trigger, {
        businessId: invoice.businessId,
        event: "invoice.paid",
        payload: {
            id: args.id,
            invoiceNumber: invoice.invoiceNumber,
            amount: args.amount,
            paymentDate: args.paymentDate,
            newStatus
        }
    });
}