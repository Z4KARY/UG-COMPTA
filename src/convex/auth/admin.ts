import Password from "@convex-dev/auth/providers/Password";
import { DataModel } from "../_generated/dataModel";
import { authenticator } from "otplib";

export const AdminPassword = Password<DataModel>({
  id: "admin-password",
  name: "Admin",
  profile(params) {
    return {
      email: "admin@ugcompta.com",
      role: "admin",
      roleGlobal: "ADMIN",
    };
  },
  verify: async (params, ctx) => {
    const { password } = params.params;
    // Expected format: "password|totp"
    const parts = password.split("|");
    if (parts.length !== 2) return null;
    const [inputPassword, inputTotp] = parts;

    const adminPasswordEnv = process.env.ADMIN_PASSWORD;
    const adminTotpSecret = process.env.ADMIN_TOTP_SECRET;

    if (!adminPasswordEnv) {
      console.error("ADMIN_PASSWORD env var not set");
      return null;
    }

    // Verify Password
    let passwordValid = false;
    const isHash = /^[a-f0-9]{64}$/i.test(adminPasswordEnv);
    
    if (isHash) {
        const encoder = new TextEncoder();
        const data = encoder.encode(inputPassword);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const inputHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        passwordValid = inputHash === adminPasswordEnv;
    } else {
        passwordValid = inputPassword === adminPasswordEnv;
    }

    if (!passwordValid) return null;

    // Verify TOTP if secret is set
    if (adminTotpSecret) {
        try {
            if (!authenticator.check(inputTotp, adminTotpSecret)) {
                return null;
            }
        } catch (e) {
            console.error("TOTP check error", e);
            return null;
        }
    } else {
        // If no TOTP secret is set, we fail because the requirement is "external otp"
        // However, for initial setup, we might want to allow it? 
        // The user said "only admin password and external otp". 
        // I will enforce it. If they haven't set the secret, they can't login.
        // But I'll log it.
        console.error("ADMIN_TOTP_SECRET env var not set");
        return null;
    }

    return {
        email: "admin@ugcompta.com",
    };
  },
});
