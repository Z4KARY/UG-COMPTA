import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { 
  createInvoiceLogic 
} from "./invoice_create";
// import { 
//   generateInvoiceNumber 
// } from "./invoice_utils";
import { 
  updateInvoiceLogic,
  deleteInvoiceLogic
} from "./invoice_update";
import { 
  updateInvoiceStatusLogic,
  issueInvoiceLogic,
  markInvoiceAsPaidLogic,
  markInvoiceAsUnpaidLogic,
  addInvoicePaymentLogic
} from "./invoice_logic";
import { checkBusinessAccess } from "./permissions";

export const list = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const business = await checkBusinessAccess(ctx, args.businessId, userId);
    if (!business) return [];

    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .collect();

    // Fetch customer names for each invoice
    const invoicesWithCustomer = await Promise.all(
      invoices.map(async (invoice) => {
        const customer = await ctx.db.get(invoice.customerId);
        return { ...invoice, customerName: customer?.name || "Unknown" };
      })
    );

    return invoicesWithCustomer;
  },
});

export const get = query({
  args: { id: v.id("invoices") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const invoice = await ctx.db.get(args.id);
    if (!invoice) return null;

    const businessDoc = await checkBusinessAccess(ctx, invoice.businessId, userId);
    if (!businessDoc) return null;

    let business = businessDoc;
    if (business.logoStorageId) {
        const url = await ctx.storage.getUrl(business.logoStorageId);
        if (url) {
            business = { ...business, logoUrl: url };
        }
    }
    
    if (business.signatureStorageId) {
        const url = await ctx.storage.getUrl(business.signatureStorageId);
        if (url) {
            business = { ...business, signatureUrl: url };
        }
    }

    if (business.stampStorageId) {
        const url = await ctx.storage.getUrl(business.stampStorageId);
        if (url) {
            business = { ...business, stampUrl: url };
        }
    }

    const customer = await ctx.db.get(invoice.customerId);
    const items = await ctx.db
      .query("invoiceItems")
      .withIndex("by_invoice", (q) => q.eq("invoiceId", invoice._id))
      .collect();
      
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_invoice", (q) => q.eq("invoiceId", invoice._id))
      .collect();

    return { ...invoice, customer, items, business, payments };
  },
});

export const listByCustomer = query({
  args: { 
    businessId: v.id("businesses"), 
    customerId: v.id("customers") 
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const business = await checkBusinessAccess(ctx, args.businessId, userId);
    if (!business) return [];
    
    return await ctx.db
      .query("invoices")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    businessId: v.id("businesses"),
    customerId: v.id("customers"),
    invoiceNumber: v.optional(v.string()), // Made optional
    type: v.union(
      v.literal("invoice"),
      v.literal("quote"),
      v.literal("credit_note"),
      v.literal("pro_forma"),
      v.literal("delivery_note"),
      v.literal("sale_order")
    ),
    fiscalType: v.optional(v.union(v.literal("LOCAL"), v.literal("EXPORT"), v.literal("EXEMPT"))), // Added
    language: v.optional(v.string()), // Added language
    issueDate: v.number(),
    dueDate: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("issued"),
      v.literal("paid"),
      v.literal("overdue"),
      v.literal("cancelled")
    ),
    notes: v.optional(v.union(v.string(), v.null())),
    
    paymentMethod: v.optional(v.union(
      v.literal("CASH"),
      v.literal("BANK_TRANSFER"),
      v.literal("CHEQUE"),
      v.literal("CARD"),
      v.literal("OTHER"),
      v.null()
    )),
    
    // We accept these but will recalculate them server-side for security
    subtotalHt: v.number(),
    discountTotal: v.optional(v.union(v.number(), v.null())),
    totalTva: v.number(),
    stampDutyAmount: v.optional(v.union(v.number(), v.null())),
    totalTtc: v.number(),
    
    // Legacy/Optional
    timbre: v.optional(v.boolean()),
    cashPenaltyPercentage: v.optional(v.number()),
    totalHt: v.optional(v.number()),

    items: v.array(
      v.object({
        productId: v.optional(v.id("products")),
        description: v.string(),
        quantity: v.number(),
        unitPrice: v.number(),
        discountRate: v.optional(v.number()),
        tvaRate: v.number(),
        lineTotal: v.number(),
        lineTotalHt: v.optional(v.number()),
        lineTotalTtc: v.optional(v.number()),
        productType: v.optional(v.union(v.literal("goods"), v.literal("service"))),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    return await createInvoiceLogic(ctx, args, userId);
  },
});

export const update = mutation({
  args: {
    id: v.id("invoices"),
    customerId: v.optional(v.id("customers")),
    invoiceNumber: v.optional(v.string()),
    type: v.optional(v.union(
      v.literal("invoice"),
      v.literal("quote"),
      v.literal("credit_note"),
      v.literal("pro_forma"),
      v.literal("delivery_note"),
      v.literal("sale_order")
    )),
    fiscalType: v.optional(v.union(v.literal("LOCAL"), v.literal("EXPORT"), v.literal("EXEMPT"))), // Added
    language: v.optional(v.string()), // Added language
    issueDate: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    currency: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("issued"),
      v.literal("paid"),
      v.literal("overdue"),
      v.literal("cancelled")
    )),
    notes: v.optional(v.union(v.string(), v.null())),
    paymentMethod: v.optional(v.union(
      v.literal("CASH"),
      v.literal("BANK_TRANSFER"),
      v.literal("CHEQUE"),
      v.literal("CARD"),
      v.literal("OTHER"),
      v.null()
    )),
    subtotalHt: v.optional(v.number()),
    discountTotal: v.optional(v.union(v.number(), v.null())),
    totalTva: v.optional(v.number()),
    stampDutyAmount: v.optional(v.union(v.number(), v.null())),
    totalTtc: v.optional(v.number()),
    items: v.optional(v.array(
      v.object({
        productId: v.optional(v.id("products")),
        description: v.string(),
        quantity: v.number(),
        unitPrice: v.number(),
        discountRate: v.optional(v.number()),
        tvaRate: v.number(),
        lineTotal: v.number(),
        lineTotalHt: v.optional(v.number()),
        lineTotalTtc: v.optional(v.number()),
        productType: v.optional(v.union(v.literal("goods"), v.literal("service"))),
        // Allow _id and other system fields to be passed but ignored, or we should strip them in frontend
        // But since we can't easily change all frontend calls, let's see if we can make validator more flexible or fix frontend.
        // Actually, strict validation is good. I should check frontend.
      })
    )),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    try {
      await updateInvoiceLogic(ctx, args, userId);
    } catch (error: any) {
      console.error("Failed to update invoice:", error);
      throw new Error(`Failed to update invoice: ${error.message}`);
    }
  },
});

export const remove = mutation({
  args: { id: v.id("invoices") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    await deleteInvoiceLogic(ctx, args, userId);
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("invoices"),
    status: v.union(
      v.literal("draft"),
      v.literal("issued"),
      v.literal("paid"),
      v.literal("overdue"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    await updateInvoiceStatusLogic(ctx, args, userId);
  },
});

export const issue = mutation({
  args: { 
    id: v.id("invoices"),
    pdfHash: v.optional(v.string()), // Optional hash of the generated PDF
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    await issueInvoiceLogic(ctx, args, userId);
  },
});

export const markAsPaid = mutation({
  args: { 
    id: v.id("invoices"),
    amount: v.number(),
    paymentMethod: v.union(
        v.literal("CASH"),
        v.literal("BANK_TRANSFER"),
        v.literal("CHEQUE"),
        v.literal("CARD"),
        v.literal("OTHER")
    ),
    paymentDate: v.number(),
    reference: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    await markInvoiceAsPaidLogic(ctx, args, userId);
  },
});

export const markAsUnpaid = mutation({
  args: { id: v.id("invoices") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    await markInvoiceAsUnpaidLogic(ctx, args, userId);
  },
});

export const addPayment = mutation({
  args: { 
    id: v.id("invoices"),
    amount: v.number(),
    paymentMethod: v.union(
        v.literal("CASH"),
        v.literal("BANK_TRANSFER"),
        v.literal("CHEQUE"),
        v.literal("CARD"),
        v.literal("OTHER")
    ),
    paymentDate: v.number(),
    reference: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    await addInvoicePaymentLogic(ctx, args, userId);
  },
});