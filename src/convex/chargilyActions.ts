"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { PLANS } from "./subscriptions";

export const createCheckoutSession = action({
  args: {
    businessId: v.id("businesses"),
    planId: v.string(),
    interval: v.union(v.literal("month"), v.literal("year")),
  },
  handler: async (_ctx, args) => {
    const plan = PLANS[args.planId as keyof typeof PLANS];
    if (!plan) throw new Error("Invalid plan");

    const price = plan.price;
    if (price === null) throw new Error("Contact sales for enterprise plan");

    const amount = price; 
    
    // Use CONVEX_SITE_URL for success/failure redirects
    // If running locally, this might be undefined or localhost.
    const domain = process.env.CONVEX_SITE_URL || "http://localhost:5173";
    
    const payload = {
      amount: amount,
      currency: "dzd",
      success_url: `${domain}/settings?payment=success`,
      failure_url: `${domain}/settings?payment=failed`,
      metadata: {
        businessId: args.businessId,
        planId: args.planId,
        interval: args.interval,
      },
    };

    const response = await fetch("https://pay.chargily.net/test/api/v2/checkouts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.CHARGILY_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Chargily Error:", text);
      throw new Error(`Payment gateway error: ${text}`);
    }

    const data = await response.json();
    return { checkoutUrl: data.checkout_url };
  },
});