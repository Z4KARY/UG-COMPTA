import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const getMyBusiness = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    if (args.businessId) {
        const business = await ctx.db.get(args.businessId);
        // Check ownership or membership
        if (business?.userId === userId) return business;
        
        const member = await ctx.db
            .query("businessMembers")
            .withIndex("by_business_and_user", (q) => q.eq("businessId", args.businessId!).eq("userId", userId))
            .first();
            
        if (member) return business;
        return null;
    }

    // Default: return first owned business
    const business = await ctx.db
      .query("businesses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (business) return business;

    // Or first member business
    const member = await ctx.db
        .query("businessMembers")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();
    
    if (member) {
        return await ctx.db.get(member.businessId);
    }

    return null;
  },
});

export const listMyBusinesses = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return [];

        const owned = await ctx.db
            .query("businesses")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        const memberships = await ctx.db
            .query("businessMembers")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        const memberBusinesses = await Promise.all(
            memberships.map(m => ctx.db.get(m.businessId))
        );

        // Deduplicate and return
        const all = [...owned, ...memberBusinesses.filter(b => b !== null)];
        const seen = new Set();
        return all.filter(b => {
            if (!b) return false;
            if (seen.has(b._id)) return false;
            seen.add(b._id);
            return true;
        });
    }
});

export const create = mutation({
  args: {
    name: v.string(),
    tradeName: v.optional(v.string()),
    address: v.string(),
    city: v.optional(v.string()),
    rc: v.optional(v.string()),
    nif: v.optional(v.string()),
    ai: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    currency: v.string(),
    tvaDefault: v.number(),
    
    type: v.optional(v.union(
        v.literal("societe"),
        v.literal("personne_physique"),
        v.literal("auto_entrepreneur")
    )),
    fiscalRegime: v.optional(v.union(
        v.literal("reel"), 
        v.literal("forfaitaire"), 
        v.literal("auto_entrepreneur"),
        v.literal("VAT"), v.literal("IFU"), v.literal("OTHER")
    )),
    legalForm: v.optional(v.union(
      v.literal("PERSONNE_PHYSIQUE"),
      v.literal("EURL"),
      v.literal("SARL"),
      v.literal("SPA"),
      v.literal("SNC"),
      v.literal("OTHER")
    )),
    bankName: v.optional(v.string()),
    bankIban: v.optional(v.string()),
    
    // AE fields
    autoEntrepreneurCardNumber: v.optional(v.string()),
    activityCodes: v.optional(v.array(v.string())),
    ssNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // Enforce Logic Binding
    let finalFiscalRegime = args.fiscalRegime;
    let finalTvaDefault = args.tvaDefault;
    let finalRc = args.rc;
    let finalAi = args.ai;

    if (args.type === "societe") {
        finalFiscalRegime = "reel";
        // VAT is mandatory (19 or 9), usually passed in args, but ensure it's not 0 if user tries to set it? 
        // We'll trust the input for rate value but enforce regime.
    } else if (args.type === "auto_entrepreneur") {
        finalFiscalRegime = "auto_entrepreneur";
        finalTvaDefault = 0; // Force VAT = 0
        finalRc = undefined; // No RC for AE
        finalAi = undefined; // No AI for AE
    } else if (args.type === "personne_physique") {
        // Can be reel or forfaitaire.
        if (args.fiscalRegime === "IFU") finalFiscalRegime = "forfaitaire"; // Map legacy
        if (args.fiscalRegime === "VAT") finalFiscalRegime = "reel"; // Map legacy
        
        if (finalFiscalRegime === "forfaitaire") {
            finalTvaDefault = 0; // IFU usually implies no VAT collection for small entities, though technically IFU includes VAT in the rate. 
            // User instructions: "PERSONNE PHYSIQUE (FORFAITAIRE) -> VAT OFF"
            finalTvaDefault = 0;
        }
    }

    const businessId = await ctx.db.insert("businesses", {
      userId,
      ...args,
      rc: finalRc,
      ai: finalAi,
      fiscalRegime: finalFiscalRegime,
      tvaDefault: finalTvaDefault,
    });

    // Add creator as owner
    await ctx.db.insert("businessMembers", {
      businessId,
      userId,
      role: "owner",
      joinedAt: Date.now(),
    });

    return businessId;
  },
});

export const update = mutation({
  args: {
    id: v.id("businesses"),
    name: v.optional(v.string()),
    tradeName: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    rc: v.optional(v.string()),
    nif: v.optional(v.string()),
    ai: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    currency: v.optional(v.string()),
    tvaDefault: v.optional(v.number()),
    
    type: v.optional(v.union(
        v.literal("societe"),
        v.literal("personne_physique"),
        v.literal("auto_entrepreneur")
    )),
    fiscalRegime: v.optional(v.union(
        v.literal("reel"), 
        v.literal("forfaitaire"), 
        v.literal("auto_entrepreneur"),
        v.literal("VAT"), v.literal("IFU"), v.literal("OTHER")
    )),
    legalForm: v.optional(v.union(
      v.literal("PERSONNE_PHYSIQUE"),
      v.literal("EURL"),
      v.literal("SARL"),
      v.literal("SPA"),
      v.literal("SNC"),
      v.literal("OTHER")
    )),
    bankName: v.optional(v.string()),
    bankIban: v.optional(v.string()),

    // AE fields
    autoEntrepreneurCardNumber: v.optional(v.string()),
    activityCodes: v.optional(v.array(v.string())),
    ssNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const business = await ctx.db.get(args.id);
    if (!business) throw new Error("Business not found");

    // Check if user is a member with sufficient permissions (owner or admin)
    // For simplicity, checking if user is the creator (userId on business) or has owner role in members
    // In a real app, we'd check the members table.
    // Let's check members table for permission
    const member = await ctx.db
      .query("businessMembers")
      .withIndex("by_business_and_user", (q) => 
        q.eq("businessId", args.id).eq("userId", userId)
      )
      .first();

    if (!member || (member.role !== "owner" && member.role !== "accountant")) {
       // Fallback to checking if they are the creator (legacy support)
       if (business.userId !== userId) {
         throw new Error("Unauthorized");
       }
    }

    const { id, ...updates } = args;
    
    // Enforce Logic Binding on Update
    if (updates.type === "societe") {
        updates.fiscalRegime = "reel";
    } else if (updates.type === "auto_entrepreneur") {
        updates.fiscalRegime = "auto_entrepreneur";
        updates.tvaDefault = 0;
        updates.rc = undefined; // Clear RC
        updates.ai = undefined; // Clear AI
    } else if (updates.type === "personne_physique") {
        if (updates.fiscalRegime === "IFU") updates.fiscalRegime = "forfaitaire";
        if (updates.fiscalRegime === "VAT") updates.fiscalRegime = "reel";
        
        if (updates.fiscalRegime === "forfaitaire") {
            updates.tvaDefault = 0;
        }
    }

    await ctx.db.patch(id, updates);
  },
});

// Internal query for export action
export const exportDataInternal = internalQuery({
  args: { businessId: v.id("businesses"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const { businessId, userId } = args;
    
    const business = await ctx.db.get(businessId);
    if (!business) return null;
    
    // Authorization check
    if (business.userId !== userId) {
        const member = await ctx.db
            .query("businessMembers")
            .withIndex("by_business_and_user", (q) => q.eq("businessId", businessId).eq("userId", userId))
            .first();
        if (!member) return null;
    }

    // Fetch all related data
    const customers = await ctx.db.query("customers").withIndex("by_business", q => q.eq("businessId", businessId)).collect();
    const products = await ctx.db.query("products").withIndex("by_business", q => q.eq("businessId", businessId)).collect();
    const invoices = await ctx.db.query("invoices").withIndex("by_business", q => q.eq("businessId", businessId)).collect();
    
    const invoiceItems = await Promise.all(invoices.map(inv => 
        ctx.db.query("invoiceItems").withIndex("by_invoice", q => q.eq("invoiceId", inv._id)).collect()
    ));
    
    const payments = await Promise.all(invoices.map(inv => 
        ctx.db.query("payments").withIndex("by_invoice", q => q.eq("invoiceId", inv._id)).collect()
    ));

    const suppliers = await ctx.db.query("suppliers").withIndex("by_business", q => q.eq("businessId", businessId)).collect();
    const purchaseInvoices = await ctx.db.query("purchaseInvoices").withIndex("by_business", q => q.eq("businessId", businessId)).collect();
    
    const purchaseInvoiceItems = await Promise.all(purchaseInvoices.map(inv =>
        ctx.db.query("purchaseInvoiceItems").withIndex("by_purchase_invoice", q => q.eq("purchaseInvoiceId", inv._id)).collect()
    ));

    return {
        business,
        customers,
        products,
        invoices,
        invoiceItems: invoiceItems.flat(),
        payments: payments.flat(),
        suppliers,
        purchaseInvoices,
        purchaseInvoiceItems: purchaseInvoiceItems.flat(),
        exportedAt: Date.now(),
    };
  }
});

export const exportData = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const business = await ctx.db.get(args.businessId);
    if (!business) return null;
    
    // Authorization check
    if (business.userId !== userId) {
        const member = await ctx.db
            .query("businessMembers")
            .withIndex("by_business_and_user", (q) => q.eq("businessId", args.businessId).eq("userId", userId))
            .first();
        if (!member) return null;
    }

    // Fetch all related data
    const customers = await ctx.db.query("customers").withIndex("by_business", q => q.eq("businessId", args.businessId)).collect();
    const products = await ctx.db.query("products").withIndex("by_business", q => q.eq("businessId", args.businessId)).collect();
    const invoices = await ctx.db.query("invoices").withIndex("by_business", q => q.eq("businessId", args.businessId)).collect();
    
    const invoiceItems = await Promise.all(invoices.map(inv => 
        ctx.db.query("invoiceItems").withIndex("by_invoice", q => q.eq("invoiceId", inv._id)).collect()
    ));
    
    const payments = await Promise.all(invoices.map(inv => 
        ctx.db.query("payments").withIndex("by_invoice", q => q.eq("invoiceId", inv._id)).collect()
    ));

    const suppliers = await ctx.db.query("suppliers").withIndex("by_business", q => q.eq("businessId", args.businessId)).collect();
    const purchaseInvoices = await ctx.db.query("purchaseInvoices").withIndex("by_business", q => q.eq("businessId", args.businessId)).collect();
    
    const purchaseInvoiceItems = await Promise.all(purchaseInvoices.map(inv =>
        ctx.db.query("purchaseInvoiceItems").withIndex("by_purchase_invoice", q => q.eq("purchaseInvoiceId", inv._id)).collect()
    ));

    return {
        business,
        customers,
        products,
        invoices,
        invoiceItems: invoiceItems.flat(),
        payments: payments.flat(),
        suppliers,
        purchaseInvoices,
        purchaseInvoiceItems: purchaseInvoiceItems.flat(),
        exportedAt: Date.now(),
    };
  }
});