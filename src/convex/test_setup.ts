import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const setupTestInvoice = mutation({
  args: {},
  handler: async (ctx) => {
    // Find a user
    const user = await ctx.db.query("users").first();
    if (!user) return null;

    // Find a business
    let business = await ctx.db.query("businesses").first();
    if (!business) {
        // Create dummy business
        const businessId = await ctx.db.insert("businesses", {
            userId: user._id,
            name: "Test Business",
            address: "123 Test St",
            currency: "DZD",
            tvaDefault: 19,
        });
        business = await ctx.db.get(businessId);
    }
    if (!business) return null;

    // Find a customer
    let customer = await ctx.db.query("customers").withIndex("by_business", q => q.eq("businessId", business!._id)).first();
    if (!customer) {
        const customerId = await ctx.db.insert("customers", {
            businessId: business._id,
            name: "Test Customer",
        });
        customer = await ctx.db.get(customerId);
    }
    if (!customer) return null;

    // Create invoice
    const invoiceId = await ctx.db.insert("invoices", {
        businessId: business._id,
        customerId: customer._id,
        invoiceNumber: "TEST-001",
        type: "invoice",
        issueDate: Date.now(),
        dueDate: Date.now() + 86400000,
        currency: "DZD",
        status: "draft",
        subtotalHt: 1000,
        totalTva: 190,
        totalTtc: 1190,
    });

    // Create items
    const itemId = await ctx.db.insert("invoiceItems", {
        invoiceId,
        description: "Test Item",
        quantity: 1,
        unitPrice: 1000,
        tvaRate: 19,
        lineTotal: 1190,
        lineTotalHt: 1000,
        lineTotalTtc: 1190,
    });

    const items = await ctx.db.query("invoiceItems").withIndex("by_invoice", q => q.eq("invoiceId", invoiceId)).collect();

    return { invoiceId, items };
  }
});