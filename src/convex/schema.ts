import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
      roleGlobal: v.optional(v.union(v.literal("NORMAL"), v.literal("ACCOUNTANT"), v.literal("ADMIN"))), // Added for accountant mode
      isSuspended: v.optional(v.boolean()), // Added for admin suspension
    }).index("email", ["email"]), // index for the email. do not remove or modify

    businesses: defineTable({
      userId: v.id("users"),
      name: v.string(),
      tradeName: v.optional(v.string()), // Added trade_name
      address: v.string(),
      city: v.optional(v.string()), // Added city
      rc: v.optional(v.string()),
      nif: v.optional(v.string()),
      ai: v.optional(v.string()),
      logoUrl: v.optional(v.string()),
      currency: v.string(),
      tvaDefault: v.number(),
      
      // New fields based on strict requirements
      type: v.optional(v.union(
        v.literal("societe"),
        v.literal("personne_physique"),
        v.literal("auto_entrepreneur")
      )),
      
      fiscalRegime: v.optional(v.union(
        v.literal("reel"), // G50
        v.literal("forfaitaire"), // G12/G12bis
        v.literal("auto_entrepreneur"), // VAT=0, no G50
        // Legacy support
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
      )), // Added legal form
      customLegalForm: v.optional(v.string()), // Added for Other (specify)
      bankName: v.optional(v.string()),
      bankIban: v.optional(v.string()),
      isSuspended: v.optional(v.boolean()), // Added for admin suspension

      // Auto-Entrepreneur specific fields
      autoEntrepreneurCardNumber: v.optional(v.string()),
      activityCodes: v.optional(v.array(v.string())),
      ssNumber: v.optional(v.string()), // CASNOS

      // G50 Specific
      vatCreditCarriedForward: v.optional(v.number()),
    }).index("by_user", ["userId"])
      .index("by_ae_card", ["autoEntrepreneurCardNumber"]),

    // New table for multi-user access to businesses
    businessMembers: defineTable({
      businessId: v.id("businesses"),
      userId: v.id("users"),
      role: v.union(v.literal("owner"), v.literal("accountant"), v.literal("staff")), // Updated to match spec (STAFF)
      joinedAt: v.number(),
    })
      .index("by_business", ["businessId"])
      .index("by_user", ["userId"])
      .index("by_business_and_user", ["businessId", "userId"]),

    periodClosures: defineTable({
      businessId: v.id("businesses"),
      periodType: v.union(v.literal("MONTH"), v.literal("YEAR")),
      startDate: v.number(),
      endDate: v.number(),
      closedByUserId: v.id("users"),
      closedAt: v.number(),
      notes: v.optional(v.string()),
    }).index("by_business", ["businessId"]),

    customers: defineTable({
      businessId: v.id("businesses"),
      name: v.string(),
      contactPerson: v.optional(v.string()), // Added contact person
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      address: v.optional(v.string()),
      notes: v.optional(v.string()),
      taxId: v.optional(v.string()), // NIF
      rc: v.optional(v.string()), // Registre de Commerce
      ai: v.optional(v.string()), // Article d'Imposition
      nis: v.optional(v.string()), // Numéro d'Identification Statistique
    })
      .index("by_business", ["businessId"])
      .searchIndex("search_name", {
        searchField: "name",
        filterFields: ["businessId"],
      }),

    products: defineTable({
      businessId: v.id("businesses"),
      name: v.string(),
      description: v.optional(v.string()), // Added description
      unitPrice: v.number(),
      tvaRate: v.number(),
      defaultDiscount: v.optional(v.number()),
      unitLabel: v.optional(v.string()), // Added unit label
      isActive: v.optional(v.boolean()), // Added is_active
      type: v.optional(v.union(v.literal("goods"), v.literal("service"))), // Added product type
    })
      .index("by_business", ["businessId"])
      .searchIndex("search_name", {
        searchField: "name",
        filterFields: ["businessId"],
      }),

    invoices: defineTable({
      businessId: v.id("businesses"),
      customerId: v.id("customers"),
      invoiceNumber: v.string(),
      // Added type field
      type: v.union(
        v.literal("invoice"),
        v.literal("quote"),
        v.literal("credit_note")
      ),
      fiscalType: v.optional(v.union(v.literal("LOCAL"), v.literal("EXPORT"), v.literal("EXEMPT"))), // Added for G50
      issueDate: v.number(), // timestamp
      dueDate: v.number(), // timestamp
      currency: v.string(),
      status: v.union(
        v.literal("draft"),
        v.literal("issued"), // Changed from sent
        v.literal("paid"),
        v.literal("overdue"),
        v.literal("cancelled")
      ),
      notes: v.optional(v.string()),
      
      // Payment & Fiscal
      paymentMethod: v.optional(v.union(
        v.literal("CASH"),
        v.literal("BANK_TRANSFER"),
        v.literal("CHEQUE"),
        v.literal("CARD"),
        v.literal("OTHER")
      )),
      
      // Totals
      subtotalHt: v.number(), // Sum of line HT
      discountTotal: v.optional(v.number()), // global discount if applied
      totalTva: v.number(),
      stampDutyAmount: v.optional(v.number()), // Droit de timbre
      totalTtc: v.number(),
      
      // Deprecated/Legacy fields (keeping for compatibility if needed, but logic moves to stampDutyAmount)
      timbre: v.optional(v.boolean()), 
      cashPenaltyPercentage: v.optional(v.number()),
      totalHt: v.optional(v.number()), // Alias for subtotalHt
      
      pdfUrl: v.optional(v.string()),
      pdfHash: v.optional(v.string()), // SHA256 hash for integrity/traceability
    })
      .index("by_business", ["businessId"])
      .index("by_customer", ["customerId"])
      .index("by_status", ["status"]), // Added index for cron jobs

    invoiceItems: defineTable({
      invoiceId: v.id("invoices"),
      productId: v.optional(v.id("products")), // Link to product
      description: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
      discountRate: v.optional(v.number()),
      discountAmount: v.optional(v.number()), // line_discount_amount
      tvaRate: v.number(),
      tvaAmount: v.optional(v.number()), // vat_amount
      lineTotal: v.number(), // This is usually TTC or HT depending on implementation, we'll clarify in logic
      lineTotalHt: v.optional(v.number()),
      lineTotalTtc: v.optional(v.number()),
      productType: v.optional(v.union(v.literal("goods"), v.literal("service"))), // Added for G12 breakdown
    }).index("by_invoice", ["invoiceId"]),

    payments: defineTable({
      invoiceId: v.id("invoices"),
      amount: v.number(),
      paymentDate: v.number(),
      paymentMethod: v.union(
        v.literal("CASH"),
        v.literal("BANK_TRANSFER"),
        v.literal("CHEQUE"),
        v.literal("CARD"),
        v.literal("OTHER")
      ),
      reference: v.optional(v.string()),
    }).index("by_invoice", ["invoiceId"]),

    fiscalParameters: defineTable({
      businessId: v.optional(v.id("businesses")), // Null for global defaults
      code: v.string(), // e.g., "STAMP_DUTY_BRACKETS", "VAT_STANDARD_RATE"
      value: v.any(), // JSON object
      lawReference: v.optional(v.string()),
      effectiveFrom: v.number(), // Date timestamp
      effectiveTo: v.optional(v.number()), // Date timestamp, nullable
    }).index("by_business_and_code", ["businessId", "code"]),

    // New table for G12 Forecasts (IFU Regime)
    g12Forecasts: defineTable({
      businessId: v.id("businesses"),
      year: v.number(),
      forecastTurnover: v.number(),
      ifuRate: v.number(), // Percentage
      taxDueInitial: v.number(),
      submissionDate: v.number(),
    }).index("by_business_and_year", ["businessId", "year"]),

    // G50 Declarations
    g50Declarations: defineTable({
      businessId: v.id("businesses"),
      month: v.number(),
      year: v.number(),
      
      // Sales
      turnover19: v.number(),
      vatCollected19: v.number(),
      turnover9: v.number(),
      vatCollected9: v.number(),
      turnoverExport: v.number(),
      turnoverExempt: v.number(),
      
      // Purchases
      purchaseVat19: v.number(),
      purchaseVat9: v.number(),
      importVat: v.number(),
      regularizationVat: v.number(),
      
      // Totals
      vatCollectedTotal: v.number(),
      vatDeductibleTotal: v.number(),
      vatNetBeforeCredit: v.number(),
      previousCredit: v.number(),
      vatNetAfterCredit: v.number(),
      newCredit: v.number(),
      vatPayable: v.number(),
      
      stampDutyTotal: v.number(),
      
      status: v.union(v.literal("DRAFT"), v.literal("FINALIZED")),
      finalizedAt: v.optional(v.number()),
    }).index("by_business_and_period", ["businessId", "year", "month"]),

    g50Imports: defineTable({
      businessId: v.id("businesses"),
      month: v.number(),
      year: v.number(),
      customsValue: v.number(),
      vatPaid: v.number(),
      description: v.optional(v.string()),
    }).index("by_business_and_period", ["businessId", "year", "month"]),

    suppliers: defineTable({
      businessId: v.id("businesses"),
      name: v.string(),
      nif: v.optional(v.string()),
      rc: v.optional(v.string()),
      address: v.optional(v.string()),
      phone: v.optional(v.string()),
      email: v.optional(v.string()),
      notes: v.optional(v.string()),
    })
      .index("by_business", ["businessId"])
      .searchIndex("search_name", {
        searchField: "name",
        filterFields: ["businessId"],
      }),

    purchaseInvoices: defineTable({
      businessId: v.id("businesses"),
      supplierId: v.id("suppliers"),
      invoiceNumber: v.string(),
      invoiceDate: v.number(),
      paymentDate: v.optional(v.number()),
      paymentMethod: v.optional(v.union(
        v.literal("CASH"),
        v.literal("BANK_TRANSFER"),
        v.literal("CHEQUE"),
        v.literal("CARD"),
        v.literal("OTHER")
      )),
      description: v.optional(v.string()),
      subtotalHt: v.number(),
      vatTotal: v.number(),
      totalTtc: v.number(),
      vatDeductible: v.number(), // Actual amount claimed
      pdfUrl: v.optional(v.string()),
    })
      .index("by_business", ["businessId"])
      .index("by_supplier", ["supplierId"])
      .index("by_business_and_date", ["businessId", "invoiceDate"]),

    purchaseInvoiceItems: defineTable({
      purchaseInvoiceId: v.id("purchaseInvoices"),
      description: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
      vatRate: v.number(),
      vatAmount: v.number(),
      lineTotalHt: v.number(),
      lineTotalTtc: v.number(),
    }).index("by_purchase_invoice", ["purchaseInvoiceId"]),

    importJobs: defineTable({
      businessId: v.id("businesses"),
      userId: v.id("users"),
      type: v.union(v.literal("CUSTOMERS"), v.literal("PRODUCTS"), v.literal("INVOICES")),
      status: v.union(
        v.literal("PENDING"),
        v.literal("PROCESSING"),
        v.literal("DONE"),
        v.literal("FAILED"),
        v.literal("PARTIAL")
      ),
      storageId: v.id("_storage"),
      mapping: v.string(), // JSON string of column mapping { "csvHeader": "dbField" }
      report: v.optional(v.string()), // JSON string of errors/results
      startedAt: v.optional(v.number()),
      finishedAt: v.optional(v.number()),
    }).index("by_business", ["businessId"]),

    auditLogs: defineTable({
      businessId: v.id("businesses"),
      userId: v.id("users"),
      entityType: v.union(
        v.literal("INVOICE"),
        v.literal("CUSTOMER"),
        v.literal("PRODUCT"),
        v.literal("FISCAL_CONFIG"),
        v.literal("BUSINESS"),
        v.literal("IMPORT_JOB") // Added IMPORT_JOB
      ),
      entityId: v.string(),
      action: v.union(
        v.literal("CREATE"),
        v.literal("UPDATE"),
        v.literal("DELETE"),
        v.literal("ISSUE"),
        v.literal("MARK_PAID"),
        v.literal("CONFIG_CHANGE"),
        v.literal("IMPORT") // Added IMPORT
      ),
      payloadBefore: v.optional(v.any()),
      payloadAfter: v.optional(v.any()),
      timestamp: v.optional(v.number()),
    }).index("by_business", ["businessId"]),

    invoiceReminders: defineTable({
      invoiceId: v.id("invoices"),
      status: v.union(v.literal("PENDING"), v.literal("SENT"), v.literal("FAILED")),
      reminderType: v.union(v.literal("BEFORE_DUE"), v.literal("ON_DUE"), v.literal("AFTER_DUE")),
      offsetDays: v.number(),
      channel: v.union(v.literal("EMAIL"), v.literal("NONE")),
      sentAt: v.optional(v.number()),
      error: v.optional(v.string()),
    })
      .index("by_invoice", ["invoiceId"])
      .index("by_status", ["status"]),

    webhookSubscriptions: defineTable({
      businessId: v.id("businesses"),
      targetUrl: v.string(),
      secret: v.string(),
      events: v.array(v.string()),
      isActive: v.boolean(),
    }).index("by_business", ["businessId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;