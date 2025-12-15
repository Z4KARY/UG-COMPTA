import { MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { requireBusinessAccess } from "./permissions";

// Note: createInvoiceLogic, updateInvoiceLogic, deleteInvoiceLogic, generateInvoiceNumber 
// have been moved to their respective files (invoice_create.ts, invoice_update.ts, invoice_utils.ts)
// to reduce file size and duplication.

export async function updateInvoiceStatusLogic(ctx: MutationCtx, args: { id: Id<"invoices">, status: string }, userId: Id<"users">) {
    const invoice = await ctx.db.get(args.id);
    if (!invoice) throw new Error("Not found");

    const business = await requireBusinessAccess(ctx, invoice.businessId, userId);
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

export async function issueInvoiceLogic(ctx: MutationCtx, args: { id: Id<"invoices">, pdfHash?: string }, userId: Id<"users">) {
    const invoice = await ctx.db.get(args.id);
    if (!invoice) throw new Error("Not found");

    const business = await requireBusinessAccess(ctx, invoice.businessId, userId);
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

export async function markInvoiceAsPaidLogic(ctx: MutationCtx, args: any, userId: Id<"users">) {
    const invoice = await ctx.db.get(args.id as Id<"invoices">);
    if (!invoice) throw new Error("Not found");

    const business = await requireBusinessAccess(ctx, invoice.businessId, userId);
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

export async function markInvoiceAsUnpaidLogic(ctx: MutationCtx, args: { id: Id<"invoices"> }, userId: Id<"users">) {
    const invoice = await ctx.db.get(args.id);
    if (!invoice) throw new Error("Not found");

    const business = await requireBusinessAccess(ctx, invoice.businessId, userId);
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

export async function addInvoicePaymentLogic(ctx: MutationCtx, args: any, userId: Id<"users">) {
    const invoice = await ctx.db.get(args.id as Id<"invoices">);
    if (!invoice) throw new Error("Not found");

    const business = await requireBusinessAccess(ctx, invoice.businessId, userId);
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