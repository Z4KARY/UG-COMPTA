import { query } from "../_generated/server";
import { checkAdmin } from "./utils";

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    await checkAdmin(ctx);
    
    // In a production environment with millions of records, we should use a dedicated counters table
    // or the Convex dashboard metrics. For now, we optimize by fetching only necessary fields if possible,
    // but .collect().length is the standard way in Convex for exact counts on moderate datasets.
    
    const usersCount = (await ctx.db.query("users").collect()).length;
    const businessesCount = (await ctx.db.query("businesses").collect()).length;
    const activeSubs = (await ctx.db.query("subscriptions").withIndex("by_status", q => q.eq("status", "active")).collect()).length;
    const contactRequestsNew = (await ctx.db.query("contactRequests").withIndex("by_status", q => q.eq("status", "new")).collect()).length;

    // Calculate MRR (approximate)
    const subscriptions = await ctx.db.query("subscriptions").withIndex("by_status", q => q.eq("status", "active")).collect();
    const mrr = subscriptions.reduce((acc, sub) => {
        if (sub.interval === "month") return acc + sub.amount;
        if (sub.interval === "year") return acc + (sub.amount / 12);
        return acc;
    }, 0);

    return {
        usersCount,
        businessesCount,
        activeSubs,
        contactRequestsNew,
        mrr
    };
  }
});
