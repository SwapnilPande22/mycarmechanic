import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const priceRow = v.object({
  size: v.union(v.literal("small"), v.literal("medium"), v.literal("large")),
  part: v.union(v.literal("bumper"), v.literal("door"), v.literal("fender"), v.literal("bonnet"), v.literal("boot")),
  dentingPainting: v.optional(v.number()),
  replacement: v.optional(v.number()),
});

export const submit = mutation({
  args: {
    garageName: v.string(),
    area: v.string(),
    phone: v.string(),
    mapsUrl: v.string(),
    prices: v.array(priceRow),
  },
  handler: async (ctx, args) => {
    const garageName = args.garageName.trim().slice(0, 100);
    const area = args.area.trim().slice(0, 120);
    const phone = args.phone.trim().slice(0, 40);
    let maps: URL;
    try { maps = new URL(args.mapsUrl); } catch { throw new Error("Enter a valid Google Maps link."); }
    if (!garageName || !area || !phone || maps.protocol !== "https:" || !/(^|\.)google\.com$|(^|\.)google\.co\.in$|(^|\.)maps\.app\.goo\.gl$/.test(maps.hostname)) {
      throw new Error("Enter a garage name, area, phone number, and Google Maps link.");
    }
    if (args.prices.length !== 15 || args.prices.some((row) => [row.dentingPainting, row.replacement].some((price) => price != null && (!Number.isFinite(price) || price < 0 || price > 1000000)))) {
      throw new Error("Add a valid price sheet for all car sizes and parts.");
    }
    return await ctx.db.insert("partnerGarages", { garageName, area, phone, mapsUrl: maps.toString(), prices: args.prices, approved: false, createdAt: Date.now() });
  },
});

export const approved = query({
  args: {},
  handler: async (ctx) => await ctx.db.query("partnerGarages").withIndex("byApproved", (q) => q.eq("approved", true)).collect(),
});
