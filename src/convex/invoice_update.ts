import { MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { calculateLineItem, calculateStampDuty, FISCAL_CONSTANTS, StampDutyConfig } from "./fiscal";
import { internal } from "./_generated/api";
import { requireBusinessAccess } from "./permissions";
import { decrementInvoiceCounterIfLast } from "./invoice_utils";

export async function updateInvoiceLogic(ctx: MutationCtx, args: any, userId: Id<"users">) {
    console.log(`[updateInvoiceLogic] Starting update for invoice ${args.id} by user ${userId}`);
    const invoice = await ctx.db.get(args.id as Id<"invoices">);
    if (!invoice) {
        console.error(`[updateInvoiceLogic] Invoice ${args.id} not found`);
        throw new Error("Not found");
    }
    console.log(`[updateInvoiceLogic] Invoice found. Status: ${invoice.status}, BusinessId: ${invoice.businessId}`);

    const business = await requireBusinessAccess(ctx, invoice.businessId, userId);
    if (!business || business.userId !== userId) {
        console.error(`[updateInvoiceLogic] Unauthorized access to business ${invoice.businessId}`);
        throw new Error("Unauthorized");
    }

    // Separate special fields that shouldn't be patched to the invoice
    const { id, items, ipAddress, userAgent, ...fields } = args;

    // Identify what is actually being updated (ignoring undefined values)
    const updates = Object.keys(fields).filter(key => fields[key] !== undefined);
    const hasItemUpdates = items !== undefined;
    
    console.log(`[updateInvoiceLogic] Updates requested: ${JSON.stringify(updates)}`);
    console.log(`[updateInvoiceLogic] Has item updates: ${hasItemUpdates}`);
    
    // Define what fields are allowed to be changed on a finalized (Paid/Cancelled) invoice
    // We only allow cosmetic changes that don't affect fiscal data
    const ALLOWED_FINALIZED_UPDATES = ["language"];
    
    const isRestrictedUpdate = hasItemUpdates || updates.some(key => !ALLOWED_FINALIZED_UPDATES.includes(key));
    console.log(`[updateInvoiceLogic] Is restricted update: ${isRestrictedUpdate}`);

    // Prevent editing restricted fields if paid or cancelled
    if (invoice.status === "paid" || invoice.status === "cancelled") {
        if (isRestrictedUpdate) {
            console.error(`[updateInvoiceLogic] Attempted restricted update on finalized invoice ${invoice.status}`);
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

    // BACKFILL: Check for missing required fields in the existing invoice that might cause validation errors
    // This handles legacy data migration on the fly for documents created before schema updates
    const invoiceAny = invoice as any;

    if (!invoice.type && !cleanFields.type) {
        console.log(`[updateInvoiceLogic] Backfilling missing type for invoice ${id}`);
        cleanFields.type = "invoice";
    }
    // Ensure status is present (it should be, but just in case)
    if (!invoice.status && !cleanFields.status) {
         console.log(`[updateInvoiceLogic] Backfilling missing status for invoice ${id}`);
         cleanFields.status = "draft";
    }

    // Prepare new items data if items are provided
    let newItemsData: any[] = [];
    
    if (items) {
        // Server-side calculation to ensure fiscal compliance
        let calculatedSubtotalHt = 0;
        let calculatedTotalTva = 0;
        let calculatedDiscountTotal = 0;

        // Auto-Entrepreneur Logic Enforcement: NO VAT
        const isAE = business.type === "auto_entrepreneur";

        for (const item of items) {
            // Force TVA to 0 for Auto-Entrepreneur
            const effectiveTvaRate = isAE ? 0 : item.tvaRate;

            let calculation;
            try {
                calculation = calculateLineItem(
                    item.quantity,
                    item.unitPrice,
                    item.discountRate || 0,
                    effectiveTvaRate
                );
            } catch (e: any) {
                throw new Error(`Error calculating item "${item.description}": ${e.message}`);
            }
            const { discountAmount, lineTotalHt, tvaAmount, lineTotalTtc } = calculation;

            calculatedSubtotalHt += lineTotalHt;
            calculatedTotalTva += tvaAmount;
            calculatedDiscountTotal += discountAmount;

            // Explicitly construct itemData to ensure no extra fields are passed
            // and to ensure type safety against the schema
            const itemData: any = {
                invoiceId: id,
                productId: item.productId,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discountRate: item.discountRate,
                tvaRate: effectiveTvaRate,
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

        // Round totals
        calculatedSubtotalHt = Math.round((calculatedSubtotalHt + Number.EPSILON) * 100) / 100;
        calculatedTotalTva = Math.round((calculatedTotalTva + Number.EPSILON) * 100) / 100;
        calculatedDiscountTotal = Math.round((calculatedDiscountTotal + Number.EPSILON) * 100) / 100;

        const totalBeforeStamp = calculatedSubtotalHt + calculatedTotalTva;

        // Fetch Fiscal Parameters (Stamp Duty) if needed
        // We need this to recalculate stamp duty if items changed
        let stampDutyConfig: StampDutyConfig = FISCAL_CONSTANTS.STAMP_DUTY;
        
        const businessParam = await ctx.db
            .query("fiscalParameters")
            .withIndex("by_business_and_code", (q) => 
            q.eq("businessId", invoice.businessId).eq("code", "STAMP_DUTY")
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

        const paymentMethod = cleanFields.paymentMethod !== undefined ? cleanFields.paymentMethod : invoice.paymentMethod;
        
        const stampDutyAmount = calculateStampDuty(
            totalBeforeStamp, 
            paymentMethod || "OTHER",
            stampDutyConfig
        );

        const finalTotalTtc = totalBeforeStamp + stampDutyAmount;

        // Update cleanFields with calculated totals
        cleanFields.subtotalHt = calculatedSubtotalHt;
        cleanFields.totalHt = calculatedSubtotalHt; // Legacy alias
        cleanFields.discountTotal = calculatedDiscountTotal;
        cleanFields.totalTva = calculatedTotalTva;
        cleanFields.stampDutyAmount = stampDutyAmount;
        cleanFields.totalTtc = finalTotalTtc;
        cleanFields.timbre = stampDutyAmount > 0;
    }

    // Backfill other required fields to satisfy schema validation
    // We use invoiceAny because TypeScript expects these fields to exist on the Doc type, 
    // but they might be missing in the actual DB document for legacy data.
    if (invoiceAny.subtotalHt === undefined && cleanFields.subtotalHt === undefined) {
        console.log(`[updateInvoiceLogic] Backfilling missing subtotalHt for invoice ${id}`);
        cleanFields.subtotalHt = invoiceAny.totalHt || 0;
    }
    if (invoiceAny.totalTva === undefined && cleanFields.totalTva === undefined) {
        console.log(`[updateInvoiceLogic] Backfilling missing totalTva for invoice ${id}`);
        cleanFields.totalTva = 0;
    }
    if (invoiceAny.totalTtc === undefined && cleanFields.totalTtc === undefined) {
        console.log(`[updateInvoiceLogic] Backfilling missing totalTtc for invoice ${id}`);
        // If we have subtotal and tva (even if backfilled), use them, otherwise 0
        const ht = cleanFields.subtotalHt ?? invoiceAny.subtotalHt ?? invoiceAny.totalHt ?? 0;
        const tva = cleanFields.totalTva ?? invoiceAny.totalTva ?? 0;
        cleanFields.totalTtc = ht + tva;
    }
    if (!invoice.currency && !cleanFields.currency) {
        console.log(`[updateInvoiceLogic] Backfilling missing currency for invoice ${id}`);
        cleanFields.currency = "DZD";
    }
    if (invoice.issueDate === undefined && cleanFields.issueDate === undefined) {
        console.log(`[updateInvoiceLogic] Backfilling missing issueDate for invoice ${id}`);
        cleanFields.issueDate = invoice._creationTime;
    }
    if (invoice.dueDate === undefined && cleanFields.dueDate === undefined) {
        console.log(`[updateInvoiceLogic] Backfilling missing dueDate for invoice ${id}`);
        cleanFields.dueDate = invoice._creationTime;
    }
    if (!invoice.invoiceNumber && !cleanFields.invoiceNumber) {
         console.log(`[updateInvoiceLogic] Backfilling missing invoiceNumber for invoice ${id}`);
         cleanFields.invoiceNumber = "DRAFT-" + Date.now();
    }

    // Update invoice fields
    // Note: cleanFields does NOT contain ipAddress or userAgent due to destructuring above
    if (Object.keys(cleanFields).length > 0) {
        console.log(`[updateInvoiceLogic] Patching invoice ${id} with fields:`, cleanFields);
        await ctx.db.patch(id, cleanFields);
    } else {
        console.log(`[updateInvoiceLogic] No fields to patch for invoice ${id}`);
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

      // Parallel insert for performance
      // newItemsData was prepared above
      await Promise.all(newItemsData.map(data => ctx.db.insert("invoiceItems", data)));
    }

    // Construct payloadAfter for audit log
    const payloadAfter = {
        ...invoice,
        ...cleanFields,
        ...(items !== undefined ? { items } : {})
    };

    console.log(`[updateInvoiceLogic] Creating audit log for invoice ${id}`);
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
    console.log(`[updateInvoiceLogic] Update complete for invoice ${id}`);
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