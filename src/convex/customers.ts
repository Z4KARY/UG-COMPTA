import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";

export const list = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const business = await ctx.db.get(args.businessId);
    if (!business) return [];
    
    // Authorization check
    if (business.userId !== userId) {
        const member = await ctx.db
            .query("businessMembers")
            .withIndex("by_business_and_user", (q) => q.eq("businessId", args.businessId).eq("userId", userId))
            .first();
        if (!member) return [];
    }

    const customers = await ctx.db
      .query("customers")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const customerStats = new Map<string, { totalSales: number; totalPaid: number; balanceDue: number }>();

    for (const inv of invoices) {
        if (inv.status === "cancelled" || inv.status === "draft") continue;
        
        const stats = customerStats.get(inv.customerId) || { totalSales: 0, totalPaid: 0, balanceDue: 0 };
        
        stats.totalSales += inv.totalTtc;
        
        if (inv.status === "paid") {
            stats.totalPaid += inv.totalTtc;
        } else {
            stats.balanceDue += inv.totalTtc;
        }
        
        customerStats.set(inv.customerId, stats);
    }

    return customers.map(c => ({
        ...c,
        financials: customerStats.get(c._id) || { totalSales: 0, totalPaid: 0, balanceDue: 0 }
    }));
  },
});

export const search = query({
  args: { businessId: v.id("businesses"), query: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const business = await ctx.db.get(args.businessId);
    if (!business) return [];

    // Authorization check
    if (business.userId !== userId) {
        const member = await ctx.db
            .query("businessMembers")
            .withIndex("by_business_and_user", (q) => q.eq("businessId", args.businessId).eq("userId", userId))
            .first();
        if (!member) return [];
    }

    return await ctx.db
      .query("customers")
      .withSearchIndex("search_name", (q) => 
        q.search("name", args.query).eq("businessId", args.businessId)
      )
      .take(10);
  },
});

export const create = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    contactPerson: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
    taxId: v.optional(v.string()),
    rc: v.optional(v.string()),
    ai: v.optional(v.string()),
    nis: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const business = await ctx.db.get(args.businessId);
    if (!business || business.userId !== userId) throw new Error("Unauthorized");

    const customerId = await ctx.db.insert("customers", args);

    await ctx.scheduler.runAfter(0, internal.audit.log, {
        businessId: args.businessId,
        userId,
        entityType: "CUSTOMER",
        entityId: customerId,
        action: "CREATE",
        payloadAfter: args,
    });

    return customerId;
  },
});

export const update = mutation({
  args: {
    id: v.id("customers"),
    name: v.optional(v.string()),
    contactPerson: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
    taxId: v.optional(v.string()),
    rc: v.optional(v.string()),
    ai: v.optional(v.string()),
    nis: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const customer = await ctx.db.get(args.id);
    if (!customer) throw new Error("Not found");

    const business = await ctx.db.get(customer.businessId);
    if (!business || business.userId !== userId) throw new Error("Unauthorized");

    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);

    await ctx.scheduler.runAfter(0, internal.audit.log, {
        businessId: customer.businessId,
        userId,
        entityType: "CUSTOMER",
        entityId: id,
        action: "UPDATE",
        payloadBefore: customer,
        payloadAfter: updates,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("customers") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const customer = await ctx.db.get(args.id);
    if (!customer) throw new Error("Not found");

    const business = await ctx.db.get(customer.businessId);
    if (!business || business.userId !== userId) throw new Error("Unauthorized");

    // Check for existing invoices
    const existingInvoice = await ctx.db.query("invoices")
        .withIndex("by_customer", q => q.eq("customerId", args.id))
        .first();
    
    if (existingInvoice) {
        throw new Error("Cannot delete customer with existing invoices. Please archive the customer instead or delete their invoices first.");
    }

    await ctx.db.delete(args.id);

    await ctx.scheduler.runAfter(0, internal.audit.log, {
        businessId: customer.businessId,
        userId,
        entityType: "CUSTOMER",
        entityId: args.id,
        action: "DELETE",
        payloadBefore: customer,
    });
  },
});

export const createBatch = internalMutation({
  args: {
    businessId: v.id("businesses"),
    userId: v.id("users"),
    customers: v.array(v.object({
      name: v.string(),
      contactPerson: v.optional(v.string()),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      address: v.optional(v.string()),
      notes: v.optional(v.string()),
      taxId: v.optional(v.string()),
      rc: v.optional(v.string()),
      ai: v.optional(v.string()),
      nis: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const results = [];
    for (const customer of args.customers) {
      try {
        const id = await ctx.db.insert("customers", {
          businessId: args.businessId,
          ...customer,
        });
        results.push({ success: true, id, name: customer.name });
      } catch (error: any) {
        results.push({ success: false, name: customer.name, error: error.message });
      }
    }
    
    // Log audit for the batch (simplified)
    await ctx.scheduler.runAfter(0, internal.audit.log, {
        businessId: args.businessId,
        userId: args.userId,
        entityType: "CUSTOMER",
        entityId: "BATCH",
        action: "CREATE",
        payloadAfter: { count: results.filter(r => r.success).length },
    });

    return results;
  },
});