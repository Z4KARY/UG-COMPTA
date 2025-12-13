import { Password } from "@convex-dev/auth/providers/Password";

export const AdminPassword = Password({
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
    
    // Safe process.env access with fallbacks
    const adminEmailEnv = (typeof process !== "undefined" ? process.env.ADMIN_EMAIL : undefined) || "admin@upgrowth.dz";
    // Default to the hash of "UG@dmin23"
    const adminPasswordEnv = (typeof process !== "undefined" ? process.env.ADMIN_PASSWORD : undefined) || "92cd579afa431fed705c6e706d8fac90f73fc90c5ea0236be5c5791d9e66e9a1";

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