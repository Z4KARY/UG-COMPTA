import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const debugUserInvoices = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { error: "Not logged in" };

    const user = await ctx.db.get(userId);

    // Get all businesses owned by user
    const ownedBusinesses = await ctx.db
      .query("businesses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Get all businesses user is a member of
    const memberships = await ctx.db
      .query("businessMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const memberBusinesses = await Promise.all(
      memberships.map(async (m) => {
        const b = await ctx.db.get(m.businessId);
        return { ...m, business: b };
      })
    );

    // Get all invoices for these businesses
    const allBusinessIds = [
      ...ownedBusinesses.map((b) => b._id),
      ...memberships.map((m) => m.businessId),
    ];

    const invoicesByBusiness = await Promise.all(
      allBusinessIds.map(async (businessId) => {
        const invoices = await ctx.db
          .query("invoices")
          .withIndex("by_business", (q) => q.eq("businessId", businessId))
          .collect();
        return { businessId, count: invoices.length, invoices };
      })
    );

    return {
      userId,
      user,
      ownedBusinesses,
      memberBusinesses,
      invoicesByBusiness,
    };
  },
});
