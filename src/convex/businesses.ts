import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { configureTaxModules } from "./taxEngine";

export const getMyBusiness = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    let business;
    if (args.businessId) {
        business = await ctx.db.get(args.businessId);
        // Check ownership or membership
        if (business?.userId === userId) {
            // authorized
        } else {
            const member = await ctx.db
                .query("businessMembers")
                .withIndex("by_business_and_user", (q) => q.eq("businessId", args.businessId!).eq("userId", userId))
                .first();
            
            if (!member) business = null;
        }
    } else {
        // Default: return first owned business
        business = await ctx.db
        .query("businesses")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();

        if (!business) {
            // Or first member business
            const member = await ctx.db
                .query("businessMembers")
                .withIndex("by_user", (q) => q.eq("userId", userId))
                .first();
            
            if (member) {
                business = await ctx.db.get(member.businessId);
            }
        }
    }

    if (business && business.logoStorageId) {
        const url = await ctx.storage.getUrl(business.logoStorageId);
        if (url) {
            business = { ...business, logoUrl: url };
        }
    }

    if (business && business.signatureStorageId) {
        const url = await ctx.storage.getUrl(business.signatureStorageId);
        if (url) {
            business = { ...business, signatureUrl: url };
        }
    }

    if (business && business.stampStorageId) {
        const url = await ctx.storage.getUrl(business.stampStorageId);
        if (url) {
            business = { ...business, stampUrl: url };
        }
    }

    if (business) {
        // Inject Tax Configuration
        const taxConfig = configureTaxModules(business);
        return { ...business, taxConfig };
    }

    return business;
  },
});

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
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
        
        // Map to include tax config
        return all.filter(b => {
            if (!b) return false;
            if (seen.has(b._id)) return false;
            seen.add(b._id);
            return true;
        }).map(b => {
            if (!b) return b;
            const taxConfig = configureTaxModules(b);
            return { ...b, taxConfig };
        });
    }
});

export const create = mutation({
  args: {
    name: v.string(),
    tradeName: v.optional(v.string()),
    address: v.string(),
    city: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    rc: v.optional(v.string()),
    nif: v.optional(v.string()),
    ai: v.optional(v.string()),
    nis: v.optional(v.string()),
    capital: v.optional(v.number()),
    logoUrl: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
    signatureUrl: v.optional(v.string()),
    signatureStorageId: v.optional(v.id("_storage")),
    stampUrl: v.optional(v.string()),
    stampStorageId: v.optional(v.id("_storage")),
    primaryColor: v.optional(v.string()),
    secondaryColor: v.optional(v.string()),
    font: v.optional(v.string()),
    template: v.optional(v.string()),
    currency: v.string(),
    tvaDefault: v.number(),
    
    mainActivity: v.optional(v.union(
        v.literal("PRODUCTION"),
        v.literal("SERVICES"),
        v.literal("DISTRIBUTION")
    )),

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
      v.literal("AUTO_ENTREPRENEUR"),
      v.literal("EURL"),
      v.literal("SARL"),
      v.literal("SPA"),
      v.literal("SPAS"),
      v.literal("SPASU"),
      v.literal("SCA"),
      v.literal("SNC"),
      v.literal("SCS"),
      v.literal("SOCIETE_PARTICIPATION"),
      v.literal("EPE"),
      v.literal("EPIC"),
      v.literal("ASSOCIATION"),
      v.literal("COOPERATIVE"),
      v.literal("ONG"),
      v.literal("OTHER")
    )),
    customLegalForm: v.optional(v.string()),
    bankName: v.optional(v.string()),
    bankIban: v.optional(v.string()),
    
    // AE fields
    autoEntrepreneurCardNumber: v.optional(v.string()),
    activityCodes: v.optional(v.array(v.string())),
    ssNumber: v.optional(v.string()),
    ifuNumber: v.optional(v.string()), // Added IFU Number

    // Sequencing
    invoicePrefix: v.optional(v.string()),
    quotePrefix: v.optional(v.string()),
    creditNotePrefix: v.optional(v.string()),
    
    // Subscription Plan (for onboarding)
    plan: v.optional(v.union(
        v.literal("free"), 
        v.literal("startup"), 
        v.literal("pro"), 
        v.literal("premium"), 
        v.literal("enterprise")
    )),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // Enforce Logic Binding
    let finalFiscalRegime = args.fiscalRegime;
    let finalTvaDefault = args.tvaDefault;
    let finalRc = args.rc;
    let finalAi = args.ai;
    let finalNis = args.nis;

    if (args.type === "societe") {
        finalFiscalRegime = "reel";
        // VAT is mandatory (19 or 9)
        if (finalTvaDefault === 0) finalTvaDefault = 19; // Default to 19 if 0 passed
    } else if (args.type === "personne_physique") {
        // Force IFU as per technical file for PP
        finalFiscalRegime = "forfaitaire"; // Maps to IFU
        finalTvaDefault = 0; // IFU -> VAT OFF
        
        // Legacy support or override if explicitly passed as VAT/reel (though technical file says PP -> IFU)
        if (args.fiscalRegime === "reel" || args.fiscalRegime === "VAT") {
             finalFiscalRegime = "reel";
             if (finalTvaDefault === 0) finalTvaDefault = 19;
        }
    } else if (args.type === "auto_entrepreneur") {
        finalFiscalRegime = "auto_entrepreneur";
        finalTvaDefault = 0; // Force VAT = 0
        finalRc = undefined; // No RC for AE
        finalAi = undefined; // No AI for AE
        finalNis = undefined; // No NIS for AE usually, or optional

        // Check for AE Card Number Uniqueness
        if (args.autoEntrepreneurCardNumber) {
            const existing = await ctx.db
                .query("businesses")
                .withIndex("by_ae_card", (q) => q.eq("autoEntrepreneurCardNumber", args.autoEntrepreneurCardNumber))
                .first();
            
            if (existing) {
                throw new Error("This Auto-Entrepreneur Card Number is already registered.");
            }
        }
    }

    // Calculate Trial Logic
    const selectedPlan = args.plan || "free";
    let trialDuration = 30 * 24 * 60 * 60 * 1000; // 30 days default (Startup, Pro, Premium)
    
    if (selectedPlan === "free") {
        trialDuration = 90 * 24 * 60 * 60 * 1000; // 90 days for Auto-Entrepreneur
    }

    const subscriptionEndsAt = Date.now() + trialDuration;

    const businessId = await ctx.db.insert("businesses", {
      userId,
      ...args,
      rc: finalRc,
      ai: finalAi,
      nis: finalNis,
      fiscalRegime: finalFiscalRegime,
      tvaDefault: finalTvaDefault,
      // Set Trial
      plan: selectedPlan,
      subscriptionStatus: "trial",
      subscriptionEndsAt,
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
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    rc: v.optional(v.string()),
    nif: v.optional(v.string()),
    ai: v.optional(v.string()),
    nis: v.optional(v.string()),
    capital: v.optional(v.number()),
    logoStorageId: v.optional(v.id("_storage")),
    logoUrl: v.optional(v.string()),
    
    // Added missing fields for signature and stamp
    signatureStorageId: v.optional(v.id("_storage")),
    signatureUrl: v.optional(v.string()),
    stampStorageId: v.optional(v.id("_storage")),
    stampUrl: v.optional(v.string()),
    
    primaryColor: v.optional(v.string()),
    secondaryColor: v.optional(v.string()),
    font: v.optional(v.string()),
    template: v.optional(v.string()),

    // Sequencing
    invoicePrefix: v.optional(v.string()),
    quotePrefix: v.optional(v.string()),
    creditNotePrefix: v.optional(v.string()),

    // Purchase Sequencing
    purchaseInvoicePrefix: v.optional(v.string()),
    receiptPrefix: v.optional(v.string()),
    purchaseOrderPrefix: v.optional(v.string()),
    purchaseCreditNotePrefix: v.optional(v.string()),
    purchaseDeliveryNotePrefix: v.optional(v.string()),

    currency: v.optional(v.string()),
    tvaDefault: v.optional(v.number()),
    
    mainActivity: v.optional(v.union(
        v.literal("PRODUCTION"),
        v.literal("SERVICES"),
        v.literal("DISTRIBUTION")
    )),

    type: v.optional(v.union(
      v.literal("societe"),
      v.literal("personne_physique"),
      v.literal("auto_entrepreneur")
    )),
    fiscalRegime: v.optional(v.union(
      v.literal("reel"),
      v.literal("forfaitaire"),
      v.literal("auto_entrepreneur"),
      v.literal("VAT"),
      v.literal("IFU"),
      v.literal("OTHER")
    )),
    legalForm: v.optional(v.union(
        v.literal("PERSONNE_PHYSIQUE"),
        v.literal("AUTO_ENTREPRENEUR"),
        v.literal("EURL"),
        v.literal("SARL"),
        v.literal("SPA"),
        v.literal("SPAS"),
        v.literal("SPASU"),
        v.literal("SCA"),
        v.literal("SNC"),
        v.literal("SCS"),
        v.literal("SOCIETE_PARTICIPATION"),
        v.literal("EPE"),
        v.literal("EPIC"),
        v.literal("ASSOCIATION"),
        v.literal("COOPERATIVE"),
        v.literal("ONG"),
        v.literal("OTHER")
    )),
    customLegalForm: v.optional(v.string()),
    bankName: v.optional(v.string()),
    bankIban: v.optional(v.string()),
    
    autoEntrepreneurCardNumber: v.optional(v.string()),
    activityCodes: v.optional(v.array(v.string())),
    ssNumber: v.optional(v.string()),
    ifuNumber: v.optional(v.string()), // Added IFU Number
    
    // Allow updating plan during onboarding/setup if needed
    plan: v.optional(v.union(
        v.literal("free"), 
        v.literal("startup"), 
        v.literal("pro"), 
        v.literal("premium"), 
        v.literal("enterprise")
    )),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const business = await ctx.db.get(args.id);
    if (!business || business.userId !== userId) throw new Error("Unauthorized");

    const { id, plan, ...updates } = args;
    
    const patchData: any = { ...updates };

    // If plan is being updated and current status is not active/valid, set up trial
    // This handles cases where user might restart onboarding or update plan before paying
    if (plan && business.subscriptionStatus !== "active") {
        patchData.plan = plan;
        
        // Only reset trial if not already in a valid trial or if switching plans? 
        // For simplicity, if they are in onboarding phase (implied by calling this), we ensure they have a trial.
        // But we shouldn't extend trial indefinitely by switching plans.
        // Let's only set trial if it's not currently a valid trial or active.
        
        const isValidTrial = business.subscriptionStatus === "trial" && business.subscriptionEndsAt && business.subscriptionEndsAt > Date.now();
        
        if (!isValidTrial) {
             let trialDuration = 30 * 24 * 60 * 60 * 1000;
             if (plan === "free") {
                 trialDuration = 90 * 24 * 60 * 60 * 1000;
             }
             patchData.subscriptionStatus = "trial";
             patchData.subscriptionEndsAt = Date.now() + trialDuration;
        } else if (plan !== business.plan) {
            // If switching plans during trial, maybe adjust end date? 
            // For now, let's keep the existing trial end date to prevent abuse, or just update the plan.
            // The prompt implies specific trial lengths per plan. 
            // If I switch from Pro (1mo) to Free (3mo), should I get more time?
            // Let's recalculate trial end date if they are switching plans during onboarding.
             let trialDuration = 30 * 24 * 60 * 60 * 1000;
             if (plan === "free") {
                 trialDuration = 90 * 24 * 60 * 60 * 1000;
             }
             // Reset trial start to now? Or keep original start? 
             // Simple approach: Reset trial from now.
             patchData.subscriptionStatus = "trial";
             patchData.subscriptionEndsAt = Date.now() + trialDuration;
        }
    }

    await ctx.db.patch(id, patchData);
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