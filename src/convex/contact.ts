import { mutation } from "./_generated/server";
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

    // Schedule the email notification
    await ctx.scheduler.runAfter(0, internal.emails.sendContactNotification, {
      name: args.name,
      email: args.email,
      companyName: args.companyName,
      message: args.message,
    });
  },
});