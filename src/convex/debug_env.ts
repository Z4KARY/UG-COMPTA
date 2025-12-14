"use node";
import { action } from "./_generated/server";

export const listEnv = action({
  args: {},
  handler: async (ctx) => {
    return {
      CONVEX_SITE_URL: process.env.CONVEX_SITE_URL,
      SITE_URL: process.env.SITE_URL,
      CONVEX_CLOUD_URL: process.env.CONVEX_CLOUD_URL,
      ALL_KEYS: Object.keys(process.env).filter(k => k.startsWith("CONVEX") || k.includes("URL")),
    };
  },
});
