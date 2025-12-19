// THIS FILE IS READ ONLY. Do not touch this file unless you are correctly adding a new auth provider in accordance to the vly auth documentation

import { convexAuth } from "@convex-dev/auth/server";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { Email } from "@convex-dev/auth/providers/Email";

// --- Helper Functions ---

function generateOTP(length: number = 6): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => (byte % 10).toString()).join("");
}

// --- Providers ---

const emailOtp = Email({
  id: "email-otp",
  maxAge: 60 * 15, // 15 minutes
  generateVerificationToken() {
    return generateOTP(6);
  },
  async sendVerificationRequest({ identifier: email, token }) {
    try {
      // Safe process.env access
      const appName = (typeof process !== "undefined" ? process.env.VLY_APP_NAME : undefined) || "a vly.ai application";
      
      const response = await fetch("https://email.vly.ai/send_otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "vlytothemoon2025",
        },
        body: JSON.stringify({
          to: email,
          otp: token,
          appName: appName,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send OTP: ${response.statusText}`);
      }
    } catch (error) {
      throw new Error(JSON.stringify(error));
    }
  },
});

// --- Auth Configuration ---

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [emailOtp, Anonymous()],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      if (args.existingUserId) {
        return args.existingUserId;
      }

      const email = args.profile.email;
      if (email) {
        // Check for existing user by email (e.g. created by Admin)
        // Check for existing user by email (e.g. created by Admin)
        // Note: Using filter instead of withIndex due to type inference issues with authTables
        const existingUser = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("email"), email))
          .first();

        if (existingUser) {
          // Link to existing user instead of creating a new one
          // Update verification time if provided and not set
          if (args.profile.emailVerificationTime && !existingUser.emailVerificationTime) {
             await ctx.db.patch(existingUser._id, {
               emailVerificationTime: args.profile.emailVerificationTime
             });
          }
          return existingUser._id;
        }
      }

      // Create new user
      return await ctx.db.insert("users", {
        ...args.profile,
        role: "user",
        roleGlobal: "NORMAL",
      });
    },
  },
});