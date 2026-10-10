import { action } from "./_generated/server";
import { v } from "convex/values";

export const logStep = action({
  args: { step: v.union(v.literal("photo_upload"), v.literal("quote_photo_upload"), v.literal("ai_inspection"), v.literal("ai_pricing"), v.literal("garage_search")), durationMs: v.number() },
  handler: async (_ctx, { step, durationMs }) => {
    const safeDuration = Math.max(0, Math.min(Math.round(durationMs), 3600000));
    console.log(JSON.stringify({ event: "milestone1_timing", step, durationMs: safeDuration, at: new Date().toISOString() }));
    return true;
  },
});
