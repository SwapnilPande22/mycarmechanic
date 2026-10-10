import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const part = v.object({ panel: v.string(), partName: v.string(), workNeeded: v.string(), low: v.optional(v.number()), high: v.optional(v.number()) });

export const isAvailable = action({
  args: {},
  handler: async () => Boolean(process.env.QUOTE_PHONE?.replace(/\D/g, "").match(/^\d{7,15}$/)),
});

export const create = action({
  args: {
    name: v.string(), whatsappNumber: v.string(), carModel: v.string(), make: v.optional(v.string()), model: v.optional(v.string()), variant: v.optional(v.string()), vehicleSize: v.union(v.literal("small"), v.literal("medium"), v.literal("large")),
    area: v.string(), city: v.optional(v.string()), parts: v.array(part), totalLow: v.optional(v.number()), totalHigh: v.optional(v.number()), garages: v.array(v.string()), photos: v.array(v.id("_storage")), siteOrigin: v.string(),
  },
  handler: async (ctx, args) => {
    const destination = (process.env.QUOTE_PHONE || "").replace(/\D/g, "");
    if (!/^\d{7,15}$/.test(destination)) {
      await Promise.all(args.photos.map((id) => ctx.storage.delete(id)));
      return { paused: true as const };
    }
    let origin: URL;
    try { origin = new URL(args.siteOrigin); } catch { throw new Error("The quote page address is invalid."); }
    if (origin.protocol !== "https:" || !origin.hostname.endsWith(".convex.site")) throw new Error("The quote page address is invalid.");
    const locationParts = [args.area, args.city].filter((value): value is string => typeof value === "string")
      .map((value) => value.trim()).filter((value) => value && !/^(undefined|null)$/i.test(value))
      .filter((value, index, values) => values.findIndex((other) => other.toLowerCase() === value.toLowerCase()) === index);
    const location = locationParts.join(", ");
    if (!location) throw new Error("Enter your area or city before requesting quotes.");
    const name = args.name.trim().slice(0, 100);
    const whatsappNumber = args.whatsappNumber.trim();
    if (!/^[6-9]\d{9}$/.test(whatsappNumber)) throw new Error("Please enter a valid 10-digit WhatsApp number.");
    if (!name || !whatsappNumber || !args.carModel || !args.area || !args.parts.length || args.parts.length > 20 || args.garages.length > 20 || args.photos.length > 8) {
      throw new Error("Complete your details and make sure the estimate is ready.");
    }
    
    const id = await ctx.runMutation(internal.quoteRequests.insert, {
      name, whatsappNumber, carModel: args.carModel.slice(0, 100),
      ...(args.make ? {make:args.make.trim().slice(0,100)} : {}), ...(args.model ? {model:args.model.trim().slice(0,100)} : {}), ...(args.variant ? {variant:args.variant.trim().slice(0,100)} : {}), vehicleSize: args.vehicleSize, area: args.area.slice(0, 160), ...(args.city ? { city:args.city.trim().slice(0, 100) } : {}), parts: args.parts.map(({panel,partName,workNeeded}) => ({panel,partName,workNeeded})),
      garages: args.garages.map((garage) => garage.slice(0, 140)), photos: args.photos,
    });
    return { paused: false as const, id };
  },
});

export const insert = internalMutation({
  args: {
    name: v.string(), whatsappNumber: v.string(), carModel: v.string(), make: v.optional(v.string()), model: v.optional(v.string()), variant: v.optional(v.string()), vehicleSize: v.union(v.literal("small"), v.literal("medium"), v.literal("large")),
    area: v.string(), city: v.optional(v.string()), parts: v.array(part), totalLow: v.optional(v.number()), totalHigh: v.optional(v.number()), garages: v.array(v.string()), photos: v.array(v.id("_storage")),
  },
  handler: async (ctx, args) => ctx.db.insert("quoteRequests", { ...args, quotes: [], status: "new", createdAt: Date.now() }),
});

export const confirmSubmitted = action({
  args: { id: v.id("quoteRequests") },
  handler: async (ctx, { id }) => {
    await ctx.runMutation(internal.quoteRequests.markSubmitted, { id });
    return true;
  },
});

export const markSubmitted = internalMutation({
  args: { id: v.id("quoteRequests") },
  handler: async (ctx, { id }) => {
    const request = await ctx.db.get(id);
    if (!request) throw new Error("Quote request not found.");
    if (request.status === "draft") await ctx.db.patch(id, { status: "submitted" });
  },
});

export const listForAdmin = internalQuery({
  args: {},
  handler: async (ctx) => await ctx.db.query("quoteRequests").withIndex("byCreatedAt").order("desc").collect(),
});

export const addGarageQuote = internalMutation({
  args: { id: v.id("quoteRequests"), garageName: v.string(), price: v.number(), note: v.string() },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.id);
    if (!request) throw new Error("Quote request not found.");
    await ctx.db.patch(args.id, { quotes: [...request.quotes, { garageName: args.garageName.trim().slice(0, 140), price: args.price, note: args.note.trim().slice(0, 1000), createdAt: Date.now() }] });
  },
});

export const markAsSent = internalMutation({
  args: { id: v.id("quoteRequests") },
  handler: async (ctx, { id }) => {
    const request = await ctx.db.get(id);
    if (!request) throw new Error("Quote request not found.");
    await ctx.db.patch(id, { status: "sent to garages" });
  },
});

export const remove = internalMutation({
  args: { id: v.id("quoteRequests") },
  handler: async (ctx, { id }) => {
    const request = await ctx.db.get(id);
    if (!request) return;
    await Promise.all(request.photos.map((photo) => ctx.storage.delete(photo)));
    await ctx.db.delete(id);
  },
});

export const publicQuote = query({
  args: { id: v.id("quoteRequests") },
  handler: async (ctx, { id }) => {
    const request = await ctx.db.get(id);
    if (!request) return null;
    return {
      carModel: request.carModel,
      area: request.area,
      parts: request.parts.map(({ panel, partName, workNeeded }) => ({ panel, partName, workNeeded })),
      photos: await Promise.all(request.photos.map((id) => ctx.storage.getUrl(id))),
    };
  },
});
