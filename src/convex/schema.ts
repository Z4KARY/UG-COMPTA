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
      // New fields
      fiscalRegime: v.optional(v.union(v.literal("VAT"), v.literal("IFU"), v.literal("OTHER"))),
      bankName: v.optional(v.string()),
      bankIban: v.optional(v.string()),
    }).index("by_user", ["userId"]),

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
    }).index("by_business", ["businessId"]),

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
    }).index("by_business", ["businessId"]),

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
    })
      .index("by_business", ["businessId"])
      .index("by_customer", ["customerId"]),

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
      code: v.string(), // e.g., "STAMP_DUTY_BRACKETS"
      value: v.any(), // JSON object
      lawReference: v.optional(v.string()),
      effectiveFrom: v.optional(v.number()),
    }).index("by_business_and_code", ["businessId", "code"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;