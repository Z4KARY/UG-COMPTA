import { mutation, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const submitRequest = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    companyName: v.optional(v.string()),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("contactRequests", {
      ...args,
      status: "new",
      submittedAt: Date.now(),
    });

    // Schedule the email notification (logging)
    await ctx.scheduler.runAfter(0, internal.contact.sendContactNotification, {
      name: args.name,
      email: args.email,
      companyName: args.companyName,
      message: args.message,
    });
  },
});

export const sendContactNotification = internalAction({
  args: {
    name: v.string(),
    email: v.string(),
    companyName: v.optional(v.string()),
    message: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    // Since we are using a "no API / fully free" approach, we log the email details 
    // to the Convex dashboard logs instead of sending a real email via a provider like Resend.
    // You can view these logs in your Convex Dashboard > Logs.
    
    console.log("📨 [CONTACT REQUEST] New submission received:");
    console.log(`To: contact@upgrowth.dz`);
    console.log(`From: ${args.name} <${args.email}>`);
    console.log(`Company: ${args.companyName || "N/A"}`);
    console.log(`Message: ${args.message || "No message provided"}`);
    console.log("--------------------------------------------------");

    return { success: true, status: "logged" };
  },
});