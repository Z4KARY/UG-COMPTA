import { Password } from "@convex-dev/auth/providers/Password";
import { DataModel } from "../_generated/dataModel";
import * as OTPAuth from "otpauth";

export const AdminPassword = Password<DataModel>({
  id: "admin-password",
  name: "Admin",
  profile(params) {
    return {
      email: process.env.ADMIN_EMAIL || "admin@ugcompta.com",
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
            const totp = new OTPAuth.TOTP({
                issuer: "UGCOMPTA",
                label: "Admin",
                algorithm: "SHA1",
                digits: 6,
                period: 30,
                secret: OTPAuth.Secret.fromBase32(adminTotpSecret)
            });
            
            const delta = totp.validate({ token: inputTotp, window: 1 });
            
            if (delta === null) {
                return null;
            }
        } catch (e) {
            console.error("TOTP check error", e);
            return null;
        }
    } else {
        console.error("ADMIN_TOTP_SECRET env var not set");
        return null;
    }

    return {
        email: process.env.ADMIN_EMAIL || "admin@ugcompta.com",
    };
  },
});