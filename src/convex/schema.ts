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
      address: v.string(),
      rc: v.optional(v.string()),
      nif: v.optional(v.string()),
      ai: v.optional(v.string()),
      logoUrl: v.optional(v.string()),
      currency: v.string(),
      tvaDefault: v.number(),
    }).index("by_user", ["userId"]),

    customers: defineTable({
      businessId: v.id("businesses"),
      name: v.string(),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      address: v.optional(v.string()),
      notes: v.optional(v.string()),
    }).index("by_business", ["businessId"]),

    products: defineTable({
      businessId: v.id("businesses"),
      name: v.string(),
      unitPrice: v.number(),
      tvaRate: v.number(),
      defaultDiscount: v.optional(v.number()),
    }).index("by_business", ["businessId"]),

    invoices: defineTable({
      businessId: v.id("businesses"),
      customerId: v.id("customers"),
      invoiceNumber: v.string(),
      issueDate: v.number(), // timestamp
      dueDate: v.number(), // timestamp
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
      pdfUrl: v.optional(v.string()),
    })
      .index("by_business", ["businessId"])
      .index("by_customer", ["customerId"]),

    invoiceItems: defineTable({
      invoiceId: v.id("invoices"),
      description: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
      discountRate: v.optional(v.number()),
      tvaRate: v.number(),
      lineTotal: v.number(),
    }).index("by_invoice", ["invoiceId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;