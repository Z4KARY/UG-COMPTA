import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const business = await ctx.db.get(args.businessId);
    if (!business || business.userId !== userId) return [];

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

    const business = await ctx.db.get(invoice.businessId);
    if (!business || business.userId !== userId) return null;

    const customer = await ctx.db.get(invoice.customerId);
    const items = await ctx.db
      .query("invoiceItems")
      .withIndex("by_invoice", (q) => q.eq("invoiceId", invoice._id))
      .collect();

    return { ...invoice, customer, items };
  },
});

export const create = mutation({
  args: {
    businessId: v.id("businesses"),
    customerId: v.id("customers"),
    invoiceNumber: v.string(),
    issueDate: v.number(),
    dueDate: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("paid"),
      v.literal("overdue")
    ),
    notes: v.optional(v.string()),
    timbre: v.boolean(),
    cashPenaltyPercentage: v.optional(v.number()),
    totalHt: v.number(),
    totalTva: v.number(),
    totalTtc: v.number(),
    items: v.array(
      v.object({
        description: v.string(),
        quantity: v.number(),
        unitPrice: v.number(),
        discountRate: v.optional(v.number()),
        tvaRate: v.number(),
        lineTotal: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const business = await ctx.db.get(args.businessId);
    if (!business || business.userId !== userId) throw new Error("Unauthorized");

    const { items, ...invoiceData } = args;

    const invoiceId = await ctx.db.insert("invoices", invoiceData);

    for (const item of items) {
      await ctx.db.insert("invoiceItems", {
        invoiceId,
        ...item,
      });
    }

    return invoiceId;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("invoices"),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("paid"),
      v.literal("overdue")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const invoice = await ctx.db.get(args.id);
    if (!invoice) throw new Error("Not found");

    const business = await ctx.db.get(invoice.businessId);
    if (!business || business.userId !== userId) throw new Error("Unauthorized");

    await ctx.db.patch(args.id, { status: args.status });
  },
});
