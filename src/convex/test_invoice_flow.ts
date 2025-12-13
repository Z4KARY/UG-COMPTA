import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { createInvoiceLogic } from "./invoice_create";

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  }
});

export const testCreate = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    let user = await ctx.db.query("users").withIndex("email", q => q.eq("email", args.email)).first();
    
    // Create user if not found (for testing)
    if (!user) {
        console.log("User not found, creating test user...");
        const userId = await ctx.db.insert("users", {
            email: args.email,
            name: "Test User",
            role: "user"
        });
        user = (await ctx.db.get(userId))!;
    }

    let business = await ctx.db.query("businesses").withIndex("by_user", q => q.eq("userId", user._id)).first();
    
    // Create business if not found
    if (!business) {
        console.log("Business not found, creating test business...");
        const businessId = await ctx.db.insert("businesses", {
            userId: user._id,
            name: "Test Business",
            address: "123 Test St, Algiers",
            currency: "DZD",
            tvaDefault: 19,
            type: "societe",
            fiscalRegime: "reel",
            invoicePrefix: "INV-",
            quotePrefix: "DEV-",
            creditNotePrefix: "AV-"
        });
        business = (await ctx.db.get(businessId))!;
        
        // Add user as owner in members
        await ctx.db.insert("businessMembers", {
            businessId: business._id,
            userId: user._id,
            role: "owner",
            joinedAt: Date.now()
        });
    }

    const customer = await ctx.db.query("customers").withIndex("by_business", q => q.eq("businessId", business._id)).first();
    let customerId = customer?._id;
    
    if (!customerId) {
        customerId = await ctx.db.insert("customers", {
            businessId: business._id,
            name: "Test Customer",
            email: "test@example.com",
            address: "456 Customer Rd"
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
                lineTotal: 1000,
                productType: "service"
            }],
            subtotalHt: 1000,
            totalTva: 190,
            totalTtc: 1190,
            paymentMethod: "CASH"
        }, user._id);
        
        return { success: true, invoiceId, message: "Invoice created successfully" };
    } catch (e: any) {
        return { success: false, error: e.message, stack: e.stack };
    }
  }
});