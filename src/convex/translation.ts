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
      // Fallback to original text to prevent crash
      return { translation: args.invoiceText };
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
          try {
            const res = await translate(item.description, { to: args.targetLanguage });
            return { ...item, description: res.text };
          } catch (e) {
            console.error("Item translation error:", e);
            return item; // Return original item on error
          }
        })
      );

      // Translate notes if present
      let translatedNotes = args.notes;
      if (args.notes) {
        try {
            const res = await translate(args.notes, { to: args.targetLanguage });
            translatedNotes = res.text;
        } catch (e) {
            console.error("Notes translation error:", e);
            // Keep original notes
        }
      }

      return {
        items: translatedItems,
        notes: translatedNotes,
      };
    } catch (error: any) {
      console.error("Content Translation Error:", error);
      // Fallback to original content
      return {
        items: args.items,
        notes: args.notes,
      };
    }
  },
});