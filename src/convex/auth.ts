// THIS FILE IS READ ONLY. Do not touch this file unless you are correctly adding a new auth provider in accordance to the vly auth documentation

import { convexAuth } from "@convex-dev/auth/server";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { Password } from "@convex-dev/auth/providers/Password";
import { Email } from "@convex-dev/auth/providers/Email";

// --- Helper Functions ---

function generateOTP(length: number = 6): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => (byte % 10).toString()).join("");
}

// --- Providers ---

const AdminPassword = Password({
  id: "admin-password",
  name: "Admin",
  profile(params) {
    return {
      email: params.email as string,
      role: "admin",
      roleGlobal: "ADMIN",
    };
  },
  verify: async (params, ctx) => {
    const { password, email } = params as any;
    
    // Safe process.env access
    const adminEmailEnv = typeof process !== "undefined" ? process.env.ADMIN_EMAIL : undefined;
    const adminPasswordEnv = typeof process !== "undefined" ? process.env.ADMIN_PASSWORD : undefined;

    if (!adminPasswordEnv) {
      console.error("ADMIN_PASSWORD env var not set");
      return null;
    }

    // Verify Email if provided
    if (adminEmailEnv && email) {
        if (email.toLowerCase() !== adminEmailEnv.toLowerCase()) {
            return null;
        }
    }

    // Verify Password
    let passwordValid = false;
    const isHash = /^[a-f0-9]{64}$/i.test(adminPasswordEnv);
    
    if (isHash) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const inputHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        passwordValid = inputHash === adminPasswordEnv;
    } else {
        passwordValid = password === adminPasswordEnv;
    }

    if (!passwordValid) return null;

    return {
        email: email,
    };
  },
});

const emailOtp = Email({
  id: "email-otp",
  maxAge: 60 * 15, // 15 minutes
  generateVerificationToken() {
    return generateOTP(6);
  },
  async sendVerificationRequest({ identifier: email, provider, token }) {
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
  providers: [emailOtp, Anonymous(), AdminPassword],
});