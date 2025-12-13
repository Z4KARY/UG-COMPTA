import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { createInvoiceLogic } from "./invoice_create";

export const testCreate = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db.query("users").withIndex("email", q => q.eq("email", args.email)).first();
    if (!user) throw new Error("User not found");

    const business = await ctx.db.query("businesses").withIndex("by_user", q => q.eq("userId", user._id)).first();
    if (!business) throw new Error("Business not found");

    const customer = await ctx.db.query("customers").withIndex("by_business", q => q.eq("businessId", business._id)).first();
    let customerId = customer?._id;
    
    if (!customerId) {
        customerId = await ctx.db.insert("customers", {
            businessId: business._id,
            name: "Test Customer",
            email: "test@example.com"
        });
    }

    try {
        const invoiceId = await createInvoiceLogic(ctx, {
            businessId: business._id,
            customerId: customerId,
            type: "invoice",
            fiscalType: "LOCAL",
            issueDate: Date.now(),
            dueDate: Date.now() + 86400000,
            currency: "DZD",
            status: "draft",
            items: [{
                description: "Test Item",
                quantity: 1,
                unitPrice: 1000,
                tvaRate: 19,
                lineTotal: 1000
            }],
            subtotalHt: 1000,
            totalTva: 190,
            totalTtc: 1190,
            paymentMethod: "CASH"
        }, user._id);
        
        return { success: true, invoiceId };
    } catch (e: any) {
        return { success: false, error: e.message, stack: e.stack };
    }
  }
});
