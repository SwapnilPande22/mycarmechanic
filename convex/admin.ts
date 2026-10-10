import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { garageMessage } from "./quoteMessages";

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
      photoUrls: await Promise.all(request.photos.map((photo) => ctx.storage.getUrl(photo))),
    })));
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
