import { action, internalAction, internalMutation, internalQuery, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { quoteEmailText } from "./quoteEmail";

const part = v.object({ panel: v.string(), partName: v.string(), workNeeded: v.string(), customerDescription: v.optional(v.string()), photoObservation: v.optional(v.string()), low: v.optional(v.number()), high: v.optional(v.number()) });

export const isAvailable = action({
  args: {},
  handler: async () => Boolean(process.env.QUOTE_PHONE?.replace(/\D/g, "").match(/^\d{7,15}$/)),
});

export const create = action({
  args: {
    requestType: v.optional(v.literal("mechanical")),
    name: v.string(), whatsappNumber: v.string(), carModel: v.string(), year: v.optional(v.string()), customerConcern: v.optional(v.string()), make: v.optional(v.string()), model: v.optional(v.string()), variant: v.optional(v.string()), vehicleSize: v.union(v.literal("small"), v.literal("medium"), v.literal("large")),
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
    const mechanical = args.requestType === "mechanical";
    if (mechanical && (!args.customerConcern?.trim() || args.parts.length || args.photos.length)) throw new Error("Describe the problem before requesting a mechanical quote.");
    if (!name || !whatsappNumber || !args.carModel || !args.area || (!mechanical && !args.parts.length) || args.parts.length > 20 || args.garages.length > 20 || args.photos.length > 8) {
      throw new Error("Complete your details and make sure the estimate is ready.");
    }
    
    const id = await ctx.runMutation(internal.quoteRequests.insert, {
      ...(mechanical ? {requestType: "mechanical" as const} : {}),
      name, whatsappNumber, carModel: args.carModel.slice(0, 100),
      ...(args.year ? {year:args.year.slice(0,4)} : {}), ...(args.customerConcern ? {customerConcern:args.customerConcern.slice(0,2000)} : {}),
      ...(args.make ? {make:args.make.trim().slice(0,100)} : {}), ...(args.model ? {model:args.model.trim().slice(0,100)} : {}), ...(args.variant ? {variant:args.variant.trim().slice(0,100)} : {}), vehicleSize: args.vehicleSize, area: args.area.slice(0, 160), ...(args.city ? { city:args.city.trim().slice(0, 100) } : {}), parts: args.parts.map(({panel,partName,workNeeded,customerDescription,photoObservation}) => ({panel,partName,workNeeded,...(customerDescription ? {customerDescription:customerDescription.slice(0,2000)} : {}),...(photoObservation ? {photoObservation:photoObservation.slice(0,2000)} : {})})),
      garages: args.garages.map((garage) => garage.slice(0, 140)), photos: args.photos,
    });
    // The request is durable before any external email call begins.
    try {
      const key = process.env.RESEND_API_KEY;
      if (!key) throw new Error("Email is not configured.");
      const request = await ctx.runQuery(internal.quoteRequests.getForEmail, {id});
      if (!request) throw new Error("Request not found.");
      const urls = (await Promise.all(request.photos.map(photo => ctx.storage.getUrl(photo)))).filter((url): url is string => Boolean(url));
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {Authorization: "Bearer " + key, "Content-Type": "application/json", "Idempotency-Key": "quote-request-" + id},
        body: JSON.stringify({from: process.env.RESEND_FROM || "MyCarMechanic <onboarding@resend.dev>", to: ["swapnilraymond@gmail.com"], subject: "New MyCarMechanic quote request" + (mechanical ? " — No photo, mechanical" : ""), text: quoteEmailText(request, urls, origin.origin + "/admin?request=" + id)}),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error("Email provider rejected the request.");
      const result = await response.json();
      if (typeof result.id !== "string") throw new Error("Email provider returned no message ID.");
      await ctx.runMutation(internal.quoteRequests.setEmailStatus, {id, emailStatus:"sent", emailId:result.id});
    } catch {
      // Never expose provider responses, credentials or customer details in logs.
      await ctx.runMutation(internal.quoteRequests.setEmailStatus, {id, emailStatus:"failed"});
    }
    return { paused: false as const, id };
  },
});

export const insert = internalMutation({
  args: {
    requestType: v.optional(v.literal("mechanical")),
    name: v.string(), whatsappNumber: v.string(), carModel: v.string(), year: v.optional(v.string()), customerConcern: v.optional(v.string()), make: v.optional(v.string()), model: v.optional(v.string()), variant: v.optional(v.string()), vehicleSize: v.union(v.literal("small"), v.literal("medium"), v.literal("large")),
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

export const getForEmail = internalQuery({args:{id:v.id("quoteRequests")},handler:async(ctx,{id})=>ctx.db.get(id)});
export const setEmailStatus = internalMutation({
  args:{id:v.id("quoteRequests"),emailStatus:v.union(v.literal("sent"),v.literal("failed")),emailId:v.optional(v.string())},
  handler:async(ctx,{id,...fields})=>ctx.db.patch(id,fields),
});

// CLI-only delivery evidence. The Resend credential remains inside Convex.
export const emailDeliveryProof = internalAction({
  args: { id: v.id("quoteRequests") },
  handler: async (ctx, {id}): Promise<{id:string; text:string; lastEvent:string}> => {
    const request = await ctx.runQuery(internal.quoteRequests.getForEmail, {id});
    if (!request?.emailId || request.emailStatus !== "sent") throw new Error("No sent email exists for this request.");
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("Email is not configured.");
    const response = await fetch("https://api.resend.com/emails/" + encodeURIComponent(request.emailId), {
      headers: {Authorization: "Bearer " + key}, signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error("Could not retrieve email evidence. Confirm the Resend key allows reading sent emails.");
    const email = await response.json();
    if (typeof email.text !== "string") throw new Error("The provider returned no plain text email body.");
    return {id: request.emailId, text:email.text, lastEvent:typeof email.last_event === "string" ? email.last_event : "unknown"};
  },
});
