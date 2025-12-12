import { mutation } from "./_generated/server";
import { v } from "convex/values";

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
  },
});
