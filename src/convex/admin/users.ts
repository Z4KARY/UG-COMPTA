import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { checkAdmin } from "./utils";

export const getUserDetails = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    const user = await ctx.db.get(args.id);
    if (!user) return null;

    const businesses = await ctx.db
      .query("businesses")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return {
      ...user,
      businesses,
    };
  },
});

export const listUsers = query({
  args: {
    search: v.optional(v.string()),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    
    let users;
    
    // Optimize filtering by using indexes where possible
    if (args.role && args.role !== "all") {
        // Map generic roles to specific DB values if needed, or use the index directly
        // Note: The roleGlobal field has mixed casing in the schema definition vs usage, 
        // but we added an index on roleGlobal.
        
        // Since the role logic is complex (legacy vs new), we might still need some in-memory filtering
        // unless we strictly normalize data. For now, we fetch all and filter to maintain logic compatibility,
        // but we limit the fetch size for safety.
        users = await ctx.db.query("users").order("desc").take(1000);
        
        users = users.filter(u => {
            if (args.role === "admin") return u.role === "admin" || u.roleGlobal === "ADMIN" || u.roleGlobal === "admin";
            if (args.role === "accountant") return u.roleGlobal === "ACCOUNTANT" || u.roleGlobal === "accountant";
            if (args.role === "owner") return u.roleGlobal === "owner";
            if (args.role === "staff") return u.roleGlobal === "staff" || u.roleGlobal === "NORMAL";
            
            // Legacy fallback
            if (args.role === "ADMIN") return u.role === "admin" || u.roleGlobal === "ADMIN";
            if (args.role === "ACCOUNTANT") return u.roleGlobal === "ACCOUNTANT";
            if (args.role === "NORMAL") return (!u.roleGlobal || u.roleGlobal === "NORMAL") && u.role !== "admin";
            
            return u.roleGlobal === args.role;
        });
    } else {
        users = await ctx.db.query("users").order("desc").take(500);
    }

    // Filter by search
    if (args.search) {
        const query = args.search.toLowerCase();
        users = users.filter(u => 
            (u.name && u.name.toLowerCase().includes(query)) ||
            (u.email && u.email.toLowerCase().includes(query))
        );
    }

    return users;
  },
});

export const toggleUserSuspension = mutation({
  args: { id: v.id("users"), suspend: v.boolean() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    await ctx.db.patch(args.id, { isSuspended: args.suspend });
  },
});

export const updateUserRole = mutation({
  args: { 
    id: v.id("users"), 
    role: v.union(
      v.literal("NORMAL"), 
      v.literal("ACCOUNTANT"), 
      v.literal("ADMIN"),
      v.literal("admin"),
      v.literal("owner"),
      v.literal("accountant"),
      v.literal("staff")
    ) 
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    
    const updates: any = { roleGlobal: args.role };
    
    // Sync legacy/auth role field for compatibility
    if (args.role === "ADMIN" || args.role === "admin") {
      updates.role = "admin";
    } else {
      updates.role = "user";
    }
    
    await ctx.db.patch(args.id, updates);
  },
});

export const deleteUsers = mutation({
  args: { ids: v.array(v.id("users")) },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    for (const id of args.ids) {
      // Delete auth accounts associated with the user
      const authAccounts = await ctx.db
        .query("authAccounts")
        .filter((q) => q.eq(q.field("userId"), id))
        .collect();
      
      for (const account of authAccounts) {
        await ctx.db.delete(account._id);
      }

      // Delete auth sessions associated with the user
      const authSessions = await ctx.db
        .query("authSessions")
        .filter((q) => q.eq(q.field("userId"), id))
        .collect();
        
      for (const session of authSessions) {
        await ctx.db.delete(session._id);
      }

      await ctx.db.delete(id);
      // Delete associated businesses
      const businesses = await ctx.db
        .query("businesses")
        .withIndex("by_user", (q) => q.eq("userId", id))
        .collect();
      for (const business of businesses) {
        await ctx.db.delete(business._id);
      }
    }
  },
});

export const createAccount = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    role: v.union(
      v.literal("NORMAL"), 
      v.literal("ACCOUNTANT"), 
      v.literal("ADMIN"),
      v.literal("admin"),
      v.literal("owner"),
      v.literal("accountant"),
      v.literal("staff")
    ),
    createBusiness: v.boolean(),
    businessName: v.optional(v.string()),
    plan: v.optional(v.union(v.literal("free"), v.literal("startup"), v.literal("pro"), v.literal("premium"), v.literal("enterprise"))),
    durationMonths: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    
    const existing = await ctx.db.query("users").withIndex("email", q => q.eq("email", args.email)).first();
    if (existing) throw new Error("Email already in use");

    // If creating a business, force role to owner if it was set to staff/normal
    let roleGlobal = args.role;
    if (args.createBusiness && (roleGlobal === "staff" || roleGlobal === "NORMAL")) {
        roleGlobal = "owner";
    }

    const userId = await ctx.db.insert("users", {
        name: args.name,
        email: args.email,
        role: (args.role === "ADMIN" || args.role === "admin") ? "admin" : "user",
        roleGlobal: roleGlobal,
    });

    if (args.createBusiness && args.businessName) {
        if (!args.plan) throw new Error("Subscription plan is required");
        if (!args.durationMonths) throw new Error("Subscription duration is required");

        const plan = args.plan;
        const durationMonths = args.durationMonths;
        const subscriptionEndsAt = Date.now() + (durationMonths * 30 * 24 * 60 * 60 * 1000); 
        
        const businessId = await ctx.db.insert("businesses", {
            userId,
            name: args.businessName,
            address: "Alger, Algérie", // Default
            currency: "DZD",
            tvaDefault: 19,
            subscriptionStatus: "active",
            plan: plan,
            subscriptionEndsAt,
        });

        // Determine interval based on duration
        let interval: "year" | "2_years" | "3_years" | "month" = "year";
        if (durationMonths === 24) interval = "2_years";
        if (durationMonths === 36) interval = "3_years";
        if (durationMonths < 12) interval = "month";

        // Create Subscription Record
        await ctx.db.insert("subscriptions", {
            businessId,
            planId: plan,
            status: "active",
            amount: 0,
            currency: "DZD",
            interval: interval,
            startDate: Date.now(),
            endDate: subscriptionEndsAt,
            paymentMethod: "manual_admin",
        });

        // Add owner member
        await ctx.db.insert("businessMembers", {
            businessId,
            userId,
            role: "owner",
            joinedAt: Date.now(),
        });
    }
  }
});
