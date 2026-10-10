import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const get = internalQuery({
  args: { cacheKey:v.string() },
  handler: async (ctx, { cacheKey }) => (await ctx.db.query("inspections").withIndex("byCacheKey", (q) => q.eq("cacheKey", cacheKey)).unique())?.result ?? null,
});

export const save = internalMutation({
  args: { cacheKey:v.string(), photoHash:v.string(), variant:v.optional(v.string()), result:v.any() },
  handler: async (ctx, args) => {
    // Concurrent identical inspections all return the first committed result.
    const existing = await ctx.db.query("inspections").withIndex("byCacheKey", (q) => q.eq("cacheKey", args.cacheKey)).unique();
    if (existing) return existing.result;
    await ctx.db.insert("inspections", { ...args, ...(args.result.detectedModel ? {seenModel:args.result.detectedModel} : {}), ...(!args.result.confidentMismatch && args.result.selectedModel ? {userChoice:args.result.selectedModel} : {}), createdAt:Date.now() });
    return args.result;
  },
});

export const recordChoice = internalMutation({
  args: {cacheKey:v.string(), choice:v.string()},
  handler: async(ctx,{cacheKey,choice}) => {
    const inspection=await ctx.db.query("inspections").withIndex("byCacheKey",q=>q.eq("cacheKey",cacheKey)).unique();
    if(!inspection) throw new Error("Inspection not found. Please check your car again.");
    await ctx.db.patch(inspection._id,{userChoice:choice,...(inspection.result.detectedModel ? {seenModel:inspection.result.detectedModel} : {})});
  }
});
