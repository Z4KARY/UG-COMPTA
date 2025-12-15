import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

export const testUpdateWithExistingItems = action({
  args: {},
  handler: async (ctx) => {
    console.log("Testing UI flow for invoice update...");

    // 1. Create a dummy invoice to test with
    // We need to call a mutation to create it.
    // Since we are in an action, we use runMutation
    
    // Create a business first if needed, or assume one exists.
    // For simplicity, we'll try to find an existing business or fail.
    // Actually, let's just try to find an existing invoice to update, or create one.
    
    // We can't easily query from an action without runQuery.
    
    // Let's try to run a setup mutation that creates data and returns it.
    const setupResult = await ctx.runMutation(api.test_setup.setupTestInvoice, {});
    
    if (!setupResult) {
        console.error("Failed to setup test data");
        return;
    }
    
    const { invoiceId, items } = setupResult;
    console.log("Created test invoice:", invoiceId);
    console.log("Original items:", items);

    // 2. Simulate the UI behavior:
    // The UI receives 'items' from the query, which include _id, _creationTime, invoiceId.
    // Then it calls update with these items (plus modified description).
    
    const uiItems = items.map((item: any) => ({
        ...item,
        description: item.description + " (Translated)",
    }));

    console.log("Items to send (simulating UI):", uiItems[0]);

    try {
        await ctx.runMutation(api.invoices.update, {
            id: invoiceId,
            items: uiItems,
            language: "fr"
        });
        console.log("Update successful!");
    } catch (e: any) {
        console.error("Update failed as expected (or unexpected):", e.message);
        if (e.message.includes("Validator error")) {
             console.log("Diagnosis: The update mutation rejects extra fields in items.");
        }
    }
  }
});
