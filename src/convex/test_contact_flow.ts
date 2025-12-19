import { internalAction, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

export const testContactSubmission = internalAction({
  args: {},
  handler: async (ctx) => {
    const testData = {
      name: "Test User " + Date.now(),
      email: "test@example.com",
      companyName: "Test Corp",
      message: "This is a test message for verification.",
    };

    console.log("1. Submitting contact request...");
    await ctx.runMutation(api.contact.submitRequest, testData);

    console.log("2. Verifying persistence...");
    const result = await ctx.runQuery(internal.test_contact_flow.verifyContactRequest, {
      email: testData.email,
      name: testData.name
    });

    if (result) {
      console.log("✅ Contact request verified successfully!");
      console.log("Stored Data:", result);
    } else {
      console.error("❌ Failed to verify contact request.");
    }
  },
});

export const verifyContactRequest = internalQuery({
  args: { email: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    const request = await ctx.db
      .query("contactRequests")
      .filter((q) => q.and(
        q.eq(q.field("email"), args.email),
        q.eq(q.field("name"), args.name)
      ))
      .order("desc")
      .first();
    return request;
  },
});