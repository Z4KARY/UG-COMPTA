import { query } from "./_generated/server";
import { v } from "convex/values";
import { checkBusinessAccess } from "./permissions";

export const checkUserInvoices = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (!user) return { error: "User not found" };

    const businesses = await ctx.db
      .query("businesses")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const memberships = await ctx.db
      .query("businessMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const results = [];

    for (const b of businesses) {
        const access = await checkBusinessAccess(ctx, b._id, user._id);
        const invoices = await ctx.db
            .query("invoices")
            .withIndex("by_business", (q) => q.eq("businessId", b._id))
            .collect();
        results.push({
            businessId: b._id,
            name: b.name,
            role: "owner",
            hasAccess: !!access,
            invoiceCount: invoices.length,
            invoices: invoices.map(i => ({ id: i._id, number: i.invoiceNumber, status: i.status }))
        });
    }

    for (const m of memberships) {
        const b = await ctx.db.get(m.businessId);
        if (b) {
            const access = await checkBusinessAccess(ctx, b._id, user._id);
            const invoices = await ctx.db
                .query("invoices")
                .withIndex("by_business", (q) => q.eq("businessId", b._id))
                .collect();
            results.push({
                businessId: b._id,
                name: b.name,
                role: m.role,
                hasAccess: !!access,
                invoiceCount: invoices.length,
                invoices: invoices.map(i => ({ id: i._id, number: i.invoiceNumber, status: i.status }))
            });
        }
    }

    return { user: { id: user._id, email: user.email }, businesses: results };
  }
});