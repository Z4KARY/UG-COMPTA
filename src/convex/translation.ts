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
            model: "gpt-4o-mini", // Updated to gpt-4o-mini
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
        console.error("OpenAI Translation failed, falling back to Google:", error);
        // Fallback to Google below
      }
    }

    // 2. Fallback to Google Translate (Scraper)
    // We batch requests to avoid rate limits if possible, but this lib is tricky.
    // We'll use a small concurrency limit.
    try {
      const translatedItems = [];
      // Process in chunks of 5 to avoid rate limiting
      const chunkSize = 5;
      for (let i = 0; i < args.items.length; i += chunkSize) {
        const chunk = args.items.slice(i, i + chunkSize);
        const chunkPromises = chunk.map(async (item) => {
          try {
            const res = await translate(item.description, { to: args.targetLanguage });
            return { ...item, description: res.text };
          } catch (e) {
            console.error("Item translation error:", e);
            return item; // Return original item on error
          }
        });
        const chunkResults = await Promise.all(chunkPromises);
        translatedItems.push(...chunkResults);
      }

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