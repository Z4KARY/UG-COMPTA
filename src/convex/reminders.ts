import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const createDefaults = internalMutation({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) return;

    // Default reminders: -3 days (Before), 0 days (On Due), +7 days (After)
    const defaults = [
        { type: "BEFORE_DUE", offset: -3 },
        { type: "ON_DUE", offset: 0 },
        { type: "AFTER_DUE", offset: 7 },
    ] as const;

    for (const def of defaults) {
        await ctx.db.insert("invoiceReminders", {
            invoiceId: args.invoiceId,
            status: "PENDING",
            reminderType: def.type,
            offsetDays: def.offset,
            channel: "EMAIL", // Default channel
        });
    }
  }
});

export const processReminders = internalMutation({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        
        // 1. Check for overdue invoices
        // Find all issued invoices that are past their due date
        const issuedInvoices = await ctx.db
            .query("invoices")
            .withIndex("by_status", q => q.eq("status", "issued"))
            .collect();
        
        const partialInvoices = await ctx.db
            .query("invoices")
            .withIndex("by_status", q => q.eq("status", "partial"))
            .collect();
        
        const invoicesToCheck = [...issuedInvoices, ...partialInvoices];
        
        for (const invoice of invoicesToCheck) {
            // If due date is in the past (and not today, to be safe/strict, or just strictly less than now)
            // Using end of due date day would be better, but simple comparison for now.
            if (now > invoice.dueDate) {
                await ctx.db.patch(invoice._id, { status: "overdue" });
                // Log audit?
            }
        }

        // 2. Process pending reminders
        const pendingReminders = await ctx.db
            .query("invoiceReminders")
            .withIndex("by_status", q => q.eq("status", "PENDING"))
            .collect();

        for (const reminder of pendingReminders) {
            const invoice = await ctx.db.get(reminder.invoiceId);
            
            // If invoice deleted or paid/cancelled, mark reminder as failed/skipped
            if (!invoice || invoice.status === "paid" || invoice.status === "cancelled") {
                await ctx.db.patch(reminder._id, { 
                    status: "FAILED", 
                    error: "Invoice paid, cancelled, or deleted",
                    sentAt: now 
                });
                continue;
            }

            // Calculate target date for reminder
            // offsetDays is relative to dueDate. 
            // e.g. dueDate = 10th, offset = -3 -> 7th.
            const targetDate = invoice.dueDate + (reminder.offsetDays * 24 * 60 * 60 * 1000);
            
            // If we are past the target date, send it
            if (now >= targetDate) {
                try {
                    // TODO: Integrate actual Email/SMS sending here
                    console.log(`[REMINDER] Sending ${reminder.reminderType} reminder for Invoice #${invoice.invoiceNumber} via ${reminder.channel}`);
                    
                    await ctx.db.patch(reminder._id, {
                        status: "SENT",
                        sentAt: now
                    });
                } catch (error: any) {
                    await ctx.db.patch(reminder._id, {
                        status: "FAILED",
                        error: error.message,
                        sentAt: now
                    });
                }
            }
        }
    }
});