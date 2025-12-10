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
      console.error("Missing OPENAI_API_KEY env var");
      throw new Error("OpenAI API Key is missing. Please add OPENAI_API_KEY in the Dashboard > Settings > Environment Variables.");
    }

    if (!args.invoiceText) {
      throw new Error("Invoice text is empty.");
    }

    console.log(`Translating ${args.documentType} "${args.documentTitle}" to ${args.targetLanguage}`);

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
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
        console.error("OpenAI API Error Response:", errorText);
        
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
    } catch (error: any) {
      console.error("Translation Action Error:", error);
      // Ensure we throw a string or Error that Convex can serialize and the client can read
      throw new Error(error.message || "Unknown translation error");
    }
  },
});