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

    // Separate special fields that shouldn't be patched to the invoice
    const { id, items, ipAddress, userAgent, ...fields } = args;

    // Identify what is actually being updated (ignoring undefined values)
    const updates = Object.keys(fields).filter(key => fields[key] !== undefined);
    const hasItemUpdates = items !== undefined;
    
    // Define what fields are allowed to be changed on a finalized (Paid/Cancelled) invoice
    // We only allow cosmetic changes that don't affect fiscal data
    const ALLOWED_FINALIZED_UPDATES = ["language"];
    
    const isRestrictedUpdate = hasItemUpdates || updates.some(key => !ALLOWED_FINALIZED_UPDATES.includes(key));

    // Prevent editing restricted fields if paid or cancelled
    if (invoice.status === "paid" || invoice.status === "cancelled") {
        if (isRestrictedUpdate) {
            throw new Error("Cannot edit finalized invoice");
        }
    }

    // Check if existing invoice date is in closed period
    // We only enforce this for restricted updates (fiscal changes)
    if (isRestrictedUpdate) {
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
    }

    // Sanitize fields to remove undefined values
    // We allow null values to pass through to clear fields (if schema allows)
    const cleanFields: any = { ...fields };
    Object.keys(cleanFields).forEach(key => {
        if (cleanFields[key] === undefined) {
            delete cleanFields[key];
        }
    });

    // Update invoice fields
    // Note: cleanFields does NOT contain ipAddress or userAgent due to destructuring above
    if (Object.keys(cleanFields).length > 0) {
        await ctx.db.patch(id, cleanFields);
    }

    // If items are provided, replace them
    if (items) {
      // Delete existing items
      const existingItems = await ctx.db
        .query("invoiceItems")
        .withIndex("by_invoice", (q) => q.eq("invoiceId", id))
        .collect();
      
      // Parallel delete for performance
      await Promise.all(existingItems.map(item => ctx.db.delete(item._id)));

      // Prepare new items
      const newItemsData = [];
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

        // Explicitly construct itemData to ensure no extra fields are passed
        // and to ensure type safety against the schema
        const itemData: any = {
          invoiceId: id,
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountRate: item.discountRate,
          tvaRate: item.tvaRate,
          productType: item.productType || "service",
          
          // Calculated fields
          discountAmount,
          tvaAmount,
          lineTotal: lineTotalHt, // Using HT as lineTotal
          lineTotalHt,
          lineTotalTtc,
        };

        // Sanitize itemData
        Object.keys(itemData).forEach(key => {
            if (itemData[key] === undefined) {
                delete itemData[key];
            }
        });
        
        newItemsData.push(itemData);
      }

      // Parallel insert for performance
      await Promise.all(newItemsData.map(data => ctx.db.insert("invoiceItems", data)));
    }

    // Construct payloadAfter for audit log
    const payloadAfter = {
        ...invoice,
        ...cleanFields,
        ...(items !== undefined ? { items } : {})
    };

    await ctx.scheduler.runAfter(0, internal.audit.log, {
        businessId: invoice.businessId,
        userId,
        entityType: "INVOICE",
        entityId: id,
        action: "UPDATE",
        payloadBefore: invoice,
        payloadAfter: payloadAfter,
        ipAddress: ipAddress, // Use the extracted variable
        userAgent: userAgent, // Use the extracted variable
    });
}

export async function deleteInvoiceLogic(ctx: MutationCtx, args: { id: Id<"invoices">, ipAddress?: string, userAgent?: string }, userId: Id<"users">) {
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

    // Parallel delete
    await Promise.all(items.map(item => ctx.db.delete(item._id)));

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
        ipAddress: args.ipAddress,
        userAgent: args.userAgent,
    });
}