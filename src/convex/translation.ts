"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

// Simplified translation actions that do not rely on external APIs.
// These serve as placeholders or pass-throughs to maintain API compatibility
// while strictly adhering to the "no api key" requirement.

export const translateInvoice = action({
  args: {
    invoiceText: v.string(),
    targetLanguage: v.string(),
    documentType: v.string(),
    documentTitle: v.string(),
  },
  handler: async (_ctx, args) => {
    // Pass-through: Return original text
    return { translation: args.invoiceText };
  },
});

export const translateInvoiceContent = action({
  args: {
    items: v.array(v.object({
      description: v.string(),
    })),
    notes: v.optional(v.string()),
    targetLanguage: v.string(),
  },
  handler: async (_ctx, args) => {
    // Pass-through: Return original content
    // We are not using OpenAI or any external API.
    return {
      items: args.items,
      notes: args.notes,
    };
  },
});