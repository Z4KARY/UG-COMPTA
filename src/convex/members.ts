import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Check if current user is a member
    const membership = await ctx.db
      .query("businessMembers")
      .withIndex("by_business_and_user", (q) =>
        q.eq("businessId", args.businessId).eq("userId", userId)
      )
      .first();

    if (!membership) return [];

    const members = await ctx.db
      .query("businessMembers")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const membersWithDetails = await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        return {
          ...member,
          user,
        };
      })
    );

    return membersWithDetails;
  },
});

export const add = mutation({
  args: {
    businessId: v.id("businesses"),
    email: v.string(),
    role: v.union(v.literal("accountant"), v.literal("staff")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // Check permissions (must be owner)
    const currentMembership = await ctx.db
      .query("businessMembers")
      .withIndex("by_business_and_user", (q) =>
        q.eq("businessId", args.businessId).eq("userId", userId)
      )
      .first();

    if (!currentMembership || currentMembership.role !== "owner") {
      throw new Error("Only owners can add members");
    }

    // Find user by email
    const userToAdd = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (!userToAdd) {
      throw new Error("User not found. They must sign up first.");
    }

    // Check if already member
    const existingMembership = await ctx.db
      .query("businessMembers")
      .withIndex("by_business_and_user", (q) =>
        q.eq("businessId", args.businessId).eq("userId", userToAdd._id)
      )
      .first();

    if (existingMembership) {
      throw new Error("User is already a member");
    }

    await ctx.db.insert("businessMembers", {
      businessId: args.businessId,
      userId: userToAdd._id,
      role: args.role,
      joinedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    memberId: v.id("businessMembers"),
    role: v.union(v.literal("owner"), v.literal("accountant"), v.literal("staff")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const memberToUpdate = await ctx.db.get(args.memberId);
    if (!memberToUpdate) throw new Error("Member not found");

    // Check permissions (must be owner of the business)
    const currentMembership = await ctx.db
      .query("businessMembers")
      .withIndex("by_business_and_user", (q) =>
        q.eq("businessId", memberToUpdate.businessId).eq("userId", userId)
      )
      .first();

    if (!currentMembership || currentMembership.role !== "owner") {
      throw new Error("Only owners can update members");
    }

    // Prevent removing the last owner
    if (memberToUpdate.userId === userId && args.role !== "owner") {
         const owners = await ctx.db
            .query("businessMembers")
            .withIndex("by_business", q => q.eq("businessId", memberToUpdate.businessId))
            .filter(q => q.eq(q.field("role"), "owner"))
            .collect();
        if (owners.length <= 1) {
            throw new Error("Cannot remove the last owner");
        }
    }

    await ctx.db.patch(args.memberId, { role: args.role });
  },
});

export const remove = mutation({
  args: {
    memberId: v.id("businessMembers"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const memberToRemove = await ctx.db.get(args.memberId);
    if (!memberToRemove) throw new Error("Member not found");

    // Check permissions (must be owner)
    const currentMembership = await ctx.db
      .query("businessMembers")
      .withIndex("by_business_and_user", (q) =>
        q.eq("businessId", memberToRemove.businessId).eq("userId", userId)
      )
      .first();

    if (!currentMembership || currentMembership.role !== "owner") {
      throw new Error("Only owners can remove members");
    }

    // Prevent removing self if last owner
    if (memberToRemove.userId === userId) {
         const owners = await ctx.db
            .query("businessMembers")
            .withIndex("by_business", q => q.eq("businessId", memberToRemove.businessId))
            .filter(q => q.eq(q.field("role"), "owner"))
            .collect();
        if (owners.length <= 1) {
            throw new Error("Cannot remove the last owner");
        }
    }

    await ctx.db.delete(args.memberId);
  },
});
