import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { garageMessage, localizedGarageMessage } from "./quoteMessages";
import { findPartnerPlaces } from "./garagePartners";

function requirePassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || password.length !== expected.length) throw new Error("Admin password is incorrect or not configured.");
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) difference |= expected.charCodeAt(index) ^ password.charCodeAt(index);
  if (difference !== 0) throw new Error("Admin password is incorrect or not configured.");
}

export const list = action({
  args: { password: v.string() },
  handler: async (ctx, { password }) => {
    requirePassword(password);
    const requests = await ctx.runQuery(internal.quoteRequests.listForAdmin, {});
    return await Promise.all(requests.map(async (request) => ({
      ...request,
      garageMessage: garageMessage(request),
      thumbnailUrls: await Promise.all(request.photos.map(async(photo)=>(await ctx.runQuery(internal.photoThumbnails.get,{photo}))?.thumbnail || null)),
      photoUrls: await Promise.all(request.photos.map((photo) => ctx.storage.getUrl(photo))),
    })));
  },
});

export const partnerSettings=action({args:{password:v.string()},handler:async(ctx,{password})=>{requirePassword(password);return ctx.runQuery(internal.garagePartners.list,{});}});
export const findPartners=action({args:{password:v.string(),input:v.string()},handler:async(_ctx,{password,input})=>{requirePassword(password);if(input.trim().length<2)throw new Error("Enter a garage name and area.");return findPartnerPlaces(input);}});
export const setPartner=action({args:{password:v.string(),placeId:v.string(),enabled:v.boolean()},handler:async(ctx,{password,placeId,enabled})=>{
  requirePassword(password);
  const rows=await ctx.runQuery(internal.garagePartners.list,{});
  if(rows.some(row=>row.placeId===placeId)){await ctx.runMutation(internal.garagePartners.toggle,{placeId,enabled});return;}
  if(!enabled)return;
  const key=process.env.GOOGLE_PLACES_KEY;if(!key)throw new Error("Garage search is unavailable.");
  const response=await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,{headers:{"X-Goog-Api-Key":key,"X-Goog-FieldMask":"id,displayName,formattedAddress,googleMapsUri,location,rating,userRatingCount,types"},signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error("Could not confirm this garage.");const p=await response.json();
  if(!p.types?.includes("car_repair")||!p.id||!p.location||!p.displayName?.text)throw new Error("Choose a car repair garage.");
  await ctx.runMutation(internal.garagePartners.save,{placeId:p.id,name:p.displayName.text,address:p.formattedAddress || "",mapUrl:p.googleMapsUri || `https://www.google.com/maps/search/?api=1&query_place_id=${p.id}&query=${encodeURIComponent(p.displayName.text)}`,location:p.location,...(typeof p.rating==="number"?{rating:p.rating}:{}),reviewCount:p.userRatingCount || 0,enabled});
}});

export const copyForGarage = action({
  args:{password:v.string(),id:v.id("quoteRequests"),language:v.union(v.literal("en"),v.literal("hi"),v.literal("mr"))},
  handler:async(ctx,{password,id,language}):Promise<string>=>{
    requirePassword(password);
    const request=await ctx.runQuery(internal.quoteRequests.getForEmail,{id});
    if(!request)throw new Error("Quote request not found.");
    return localizedGarageMessage(request,`https://earnest-rhinoceros-454.convex.site/quotes/${id}`,language);
  },
});

export const addQuote = action({
  args: { password: v.string(), id: v.id("quoteRequests"), garageName: v.string(), price: v.number(), note: v.string() },
  handler: async (ctx, args) => {
    requirePassword(args.password);
    if (!args.garageName.trim() || !Number.isFinite(args.price) || args.price < 0 || args.price > 10000000) throw new Error("Enter a garage name and valid quote price.");
    await ctx.runMutation(internal.quoteRequests.addGarageQuote, { id: args.id, garageName: args.garageName, price: args.price, note: args.note });
    return true;
  },
});

export const markSent = action({
  args: { password: v.string(), id: v.id("quoteRequests") },
  handler: async (ctx, args) => {
    requirePassword(args.password);
    await ctx.runMutation(internal.quoteRequests.markAsSent, { id: args.id });
    return true;
  },
});

export const deleteRequest = action({
  args: { password: v.string(), id: v.id("quoteRequests") },
  handler: async (ctx, args) => {
    requirePassword(args.password);
    await ctx.runMutation(internal.quoteRequests.remove, { id: args.id });
    return true;
  },
});
