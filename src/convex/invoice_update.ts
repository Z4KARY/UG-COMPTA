import { MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { calculateLineItem } from "./fiscal";
import { internal } from "./_generated/api";
import { requireBusinessAccess } from "./permissions";
import { decrementInvoiceCounterIfLast } from "./invoice_utils";

export async function updateInvoiceLogic(ctx: MutationCtx, args: any, userId: Id<"users">) {
    const invoice = await ctx.db.get(args.id as Id<"invoices">);
    if (!invoice) throw new Error("Not found");

    const business = await requireBusinessAccess(ctx, invoice.businessId, userId);
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

    // Sanitize fields to remove undefined values
    // We allow null values to pass through to clear fields (if schema allows)
    const cleanFields: any = { ...fields };
    Object.keys(cleanFields).forEach(key => {
        if (cleanFields[key] === undefined) {
            delete cleanFields[key];
        }
    });

    // Update invoice fields
    await ctx.db.patch(id, cleanFields);

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
        let calculation;
        try {
            calculation = calculateLineItem(
                item.quantity,
                item.unitPrice,
                item.discountRate || 0,
                item.tvaRate
            );
        } catch (e: any) {
            throw new Error(`Error calculating item "${item.description}": ${e.message}`);
        }
        const { discountAmount, lineTotalHt, tvaAmount, lineTotalTtc } = calculation;

        const itemData: any = {
          invoiceId: id,
          ...item,
          discountAmount,
          tvaAmount,
          lineTotal: lineTotalHt,
          lineTotalHt,
          lineTotalTtc,
          productType: item.productType || "service",
        };

        // Sanitize itemData
        Object.keys(itemData).forEach(key => {
            if (itemData[key] === undefined) {
                delete itemData[key];
            }
        });

        await ctx.db.insert("invoiceItems", itemData);
      }
    }

    // Construct payloadAfter for audit log
    const payloadAfter = {
        ...invoice,
        ...cleanFields,
        items: items || undefined // Include items if they were updated
    };

    await ctx.scheduler.runAfter(0, internal.audit.log, {
        businessId: invoice.businessId,
        userId,
        entityType: "INVOICE",
        entityId: id,
        action: "UPDATE",
        payloadBefore: invoice,
        payloadAfter: payloadAfter,
    });
}

export async function deleteInvoiceLogic(ctx: MutationCtx, args: { id: Id<"invoices"> }, userId: Id<"users">) {
    const invoice = await ctx.db.get(args.id);
    if (!invoice) throw new Error("Not found");

    const business = await requireBusinessAccess(ctx, invoice.businessId, userId);
    if (!business || business.userId !== userId) throw new Error("Unauthorized");

    // Check for closed period
    const closure = await ctx.db.query("periodClosures")
        .withIndex("by_business", q => q.eq("businessId", invoice.businessId))
        .filter(q => q.and(q.lte(q.field("startDate"), invoice.issueDate), q.gte(q.field("endDate"), invoice.issueDate)))
        .first();
    
    if (closure) {
        throw new Error("Cannot delete invoice in a closed period");
    }

    // Prevent deletion if paid or partial
    if (invoice.status === "paid" || invoice.status === "partial") {
        throw new Error("Cannot delete an invoice that has been paid or partially paid");
    }

    // Check for payments
    const payment = await ctx.db.query("payments")
        .withIndex("by_invoice", q => q.eq("invoiceId", args.id))
        .first();
    
    if (payment) {
        throw new Error("Cannot delete invoice with recorded payments");
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

    // Try to decrement counter if this was the last invoice
    await decrementInvoiceCounterIfLast(
        ctx, 
        invoice.businessId, 
        invoice.type, 
        invoice.invoiceNumber, 
        invoice.issueDate
    );

    await ctx.scheduler.runAfter(0, internal.audit.log, {
        businessId: invoice.businessId,
        userId,
        entityType: "INVOICE",
        entityId: args.id,
        action: "DELETE",
        payloadBefore: invoice,
    });
}