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
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        max_tokens: 900,
        messages: [
          {
            role: "system",
            content:
              "You are an Algerian accounting translator. Preserve monetary values, VAT, payment terms, and structure. Reply only with the translated text using clear headings and bullet points when useful.",
          },
          {
            role: "user",
            content: `Translate the following ${args.documentType} invoice (${args.documentTitle}) into ${args.targetLanguage}:\n\n${args.invoiceText}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Translation failed: ${errorText}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const translation =
      data.choices?.[0]?.message?.content?.trim() ??
      "Translation not available.";

    return { translation };
  },
});
