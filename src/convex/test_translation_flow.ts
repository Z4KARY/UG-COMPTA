"use node";

import { action } from "./_generated/server";
import { api } from "./_generated/api";

export const testTranslation = action({
  args: {},
  handler: async (ctx) => {
    console.log("Testing translation...");
    
    // Test data
    const items = [
      { description: "Web Development Services" },
      { description: "Hosting Fee" }
    ];
    const notes = "Thank you for your business.";
    const targetLanguage = "fr";

    try {
      // Call the translation action
      // We use any cast to avoid circular type inference issues with api object
      const result: any = await ctx.runAction(api.translation.translateInvoiceContent, {
        items,
        notes,
        targetLanguage
      });

      console.log("Translation Result:", JSON.stringify(result, null, 2));
      
      if (result.items[0].description === items[0].description) {
          console.warn("Warning: Description didn't change. It might be because translation failed or returned same text.");
      } else {
          console.log("Success: Text changed.");
      }

      return result;
    } catch (error) {
      console.error("Translation failed:", error);
      throw error;
    }
  },
});