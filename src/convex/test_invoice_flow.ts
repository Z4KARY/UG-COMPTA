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

export const simulateFrontendLoad = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db.query("users").withIndex("email", q => q.eq("email", args.email)).first();
    if (!user) return { error: "User not found" };

    // 1. Simulate getMyBusiness (Default behavior)
    let business = await ctx.db
        .query("businesses")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();

    if (!business) {
        const member = await ctx.db
            .query("businessMembers")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .first();
        
        if (member) {
            business = await ctx.db.get(member.businessId);
        }
    }

    if (!business) return { error: "No business found for user" };

    // 2. Simulate invoices.list for this business
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_business", (q) => q.eq("businessId", business._id))
      .order("desc")
      .collect();

    return {
        user: user.email,
        selectedBusiness: {
            id: business._id,
            name: business.name,
            type: business.type
        },
        invoicesFound: invoices.length,
        invoices: invoices.map(i => ({ 
            id: i._id,
            number: i.invoiceNumber, 
            total: i.totalTtc, 
            status: i.status,
            date: new Date(i.issueDate).toISOString()
        }))
    };
  }
});

export const getInvoice = query({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.invoiceId);
  }
});