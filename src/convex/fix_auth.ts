import { internalMutation } from "./_generated/server";

export const cleanupOrphans = internalMutation({
  args: {},
  handler: async (ctx) => {
    let deletedAccounts = 0;
    let deletedSessions = 0;

    // Cleanup Auth Accounts
    const accounts = await ctx.db.query("authAccounts").collect();
    for (const account of accounts) {
      const user = await ctx.db.get(account.userId);
      if (!user) {
        await ctx.db.delete(account._id);
        deletedAccounts++;
      }
    }

    // Cleanup Auth Sessions
    const sessions = await ctx.db.query("authSessions").collect();
    for (const session of sessions) {
      const user = await ctx.db.get(session.userId);
      if (!user) {
        await ctx.db.delete(session._id);
        deletedSessions++;
      }
    }

    return { deletedAccounts, deletedSessions };
  },
});
