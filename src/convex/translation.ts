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
        // max_tokens: 900, // Removed max_tokens to avoid potential truncation issues if not needed, or keep it.
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
      console.error("OpenAI API Error:", errorText);
      
      let errorMessage = `Translation failed (${response.status})`;
      try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error && errorJson.error.message) {
              errorMessage = `OpenAI Error: ${errorJson.error.message}`;
          }
      } catch (e) {
          // Use raw text if not JSON
          errorMessage = `OpenAI Error: ${errorText}`;
      }
      
      throw new Error(errorMessage);
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