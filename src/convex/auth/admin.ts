import { Password } from "@convex-dev/auth/providers/Password";

const adminPasswordProvider = Password({
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
    // params contains the credentials directly
    const { password, email } = params as any;
    
    const adminEmailEnv = process.env.ADMIN_EMAIL;
    const adminPasswordEnv = process.env.ADMIN_PASSWORD;

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

// Ensure ID is set (workaround for potential bug where ID is not propagated)
if (!(adminPasswordProvider as any).id) {
    (adminPasswordProvider as any).id = "admin-password";
}

export const AdminPassword = adminPasswordProvider;