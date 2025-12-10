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
      // Use google-translate-api-x for free translation
      // Note: This library acts as a free client for Google Translate.
      const res = await translate(args.invoiceText, { to: args.targetLanguage });
      
      return { translation: res.text };
    } catch (error: any) {
      console.error("Translation Action Error:", error);
      throw new Error(error.message || "Unknown translation error");
    }
  },
});