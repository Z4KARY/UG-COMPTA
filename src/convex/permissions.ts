import { QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Checks if a user has access to a business.
 * Returns the business document if access is granted, null otherwise.
 */
export async function checkBusinessAccess(
  ctx: QueryCtx, 
  businessId: Id<"businesses">, 
  userId: Id<"users">
) {
  const business = await ctx.db.get(businessId);
  if (!business) return null;

  if (business.userId === userId) return business;

  const member = await ctx.db
    .query("businessMembers")
    .withIndex("by_business_and_user", (q) => q.eq("businessId", businessId).eq("userId", userId))
    .first();

  if (member) return business;

  return null;
}

/**
 * Checks if a user has access to a business and throws if not.
 */
export async function requireBusinessAccess(
  ctx: QueryCtx, 
  businessId: Id<"businesses">, 
  userId: Id<"users">
) {
  const business = await checkBusinessAccess(ctx, businessId, userId);
  if (!business) throw new Error("Unauthorized");
  return business;
}
