"use node";
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import crypto from "crypto";

export const trigger = internalAction({
  args: {
    businessId: v.id("businesses"),
    event: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    const subs = await ctx.runQuery(internal.webhooks.getSubscriptionsForEvent, {
        businessId: args.businessId,
        event: args.event
    });

    if (subs.length === 0) return;

    console.log(`[WEBHOOK] Triggering ${args.event} for business ${args.businessId} (${subs.length} subs)`);

    for (const sub of subs) {
        const signature = crypto
            .createHmac("sha256", sub.secret)
            .update(JSON.stringify(args.payload))
            .digest("hex");

        try {
            const response = await fetch(sub.targetUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Webhook-Signature": signature,
                    "X-Webhook-Event": args.event,
                },
                body: JSON.stringify(args.payload),
            });
            
            if (!response.ok) {
                console.warn(`[WEBHOOK] Failed to send to ${sub.targetUrl}: ${response.statusText}`);
            }
        } catch (err: any) {
            console.error(`[WEBHOOK] Error sending to ${sub.targetUrl}:`, err.message);
        }
    }
  },
});
