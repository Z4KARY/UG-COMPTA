"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

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

    // For now, we just return the original text if no robust translation service is available
    // This prevents server errors in production due to scraper blocking
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
    const apiKey = process.env.OPENAI_API_KEY;

    // 1. Try OpenAI if available (Production Ready approach)
    if (apiKey) {
      try {
        console.log("Using OpenAI for translation...");
        const descriptions = args.items.map(i => i.description);
        const textsToTranslate = args.notes ? [...descriptions, args.notes] : descriptions;

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { 
                role: "system", 
                content: `You are a professional translator for business invoices. Translate the provided array of strings to ${args.targetLanguage}. Return a JSON object with a key "translations" containing the array of translated strings in the exact same order.` 
              },
              { 
                role: "user", 
                content: JSON.stringify({ strings: textsToTranslate }) 
              }
            ],
            response_format: { type: "json_object" }
          }),
        });

        if (!response.ok) throw new Error(`OpenAI Error: ${response.statusText}`);
        
        const data = await response.json();
        const contentStr = data.choices[0].message.content;
        if (!contentStr) throw new Error("OpenAI returned empty content");

        const result = JSON.parse(contentStr);
        const translations = result.translations;

        if (!Array.isArray(translations) || translations.length !== textsToTranslate.length) {
           throw new Error("OpenAI returned mismatched translation count");
        }

        // Reconstruct items
        const translatedItems = args.items.map((item, idx) => ({
          ...item,
          description: translations[idx]
        }));

        const translatedNotes = args.notes ? translations[translations.length - 1] : undefined;

        return {
          items: translatedItems,
          notes: translatedNotes,
        };

      } catch (error) {
        console.error("OpenAI Translation failed:", error);
        // Fallback to original content on error
      }
    } else {
        console.log("OPENAI_API_KEY not set. Skipping translation.");
    }

    // 2. Fallback: Return original content
    // We removed the Google Translate scraper because it is unreliable in production environments
    // and can cause server errors due to IP blocking or rate limiting.
    return {
      items: args.items,
      notes: args.notes,
    };
  },
});