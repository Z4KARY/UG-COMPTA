"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { translate } from "google-translate-api-x";

export const translateInvoice = action({
  args: {
    invoiceText: v.string(),
    targetLanguage: v.string(),
    documentType: v.string(),
    documentTitle: v.string(),
  },
  handler: async (_ctx, args) => {
    if (!args.invoiceText) {
      throw new Error("Invoice text is empty.");
    }

    console.log(`Translating ${args.documentType} "${args.documentTitle}" to ${args.targetLanguage}`);

    try {
      const res = await translate(args.invoiceText, { to: args.targetLanguage });
      return { translation: res.text };
    } catch (error: any) {
      console.error("Translation Action Error:", error);
      throw new Error(error.message || "Unknown translation error");
    }
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
    try {
      // Translate items
      const translatedItems = await Promise.all(
        args.items.map(async (item) => {
          const res = await translate(item.description, { to: args.targetLanguage });
          return { ...item, description: res.text };
        })
      );

      // Translate notes if present
      let translatedNotes = args.notes;
      if (args.notes) {
        const res = await translate(args.notes, { to: args.targetLanguage });
        translatedNotes = res.text;
      }

      return {
        items: translatedItems,
        notes: translatedNotes,
      };
    } catch (error: any) {
      console.error("Content Translation Error:", error);
      throw new Error(error.message || "Failed to translate content");
    }
  },
});