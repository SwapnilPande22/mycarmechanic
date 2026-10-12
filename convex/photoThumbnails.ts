import { internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Separate presentation cache: quote records and original photo IDs are unchanged.
export const attach=mutation({args:{requestId:v.id("quoteRequests"),photos:v.array(v.object({photo:v.id("_storage"),thumbnail:v.string()}))},handler:async(ctx,{requestId,photos})=>{
  const request=await ctx.db.get(requestId);
  if(!request || photos.length>8)throw new Error("Request not found.");
  for(const {photo,thumbnail} of photos){
    if(!request.photos.includes(photo)||thumbnail.length>80000||!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(thumbnail))throw new Error("Invalid photo preview.");
    if(!await ctx.db.system.get("_storage",photo))throw new Error("Photo not found.");
    const cached=await ctx.db.query("photoThumbnails").withIndex("byPhoto",q=>q.eq("photo",photo)).unique();
    if(!cached)await ctx.db.insert("photoThumbnails",{photo,thumbnail});
  }
}});
export const get=internalQuery({args:{photo:v.id("_storage")},handler:async(ctx,{photo})=>ctx.db.query("photoThumbnails").withIndex("byPhoto",q=>q.eq("photo",photo)).unique()});
export const forRequest=query({args:{requestId:v.id("quoteRequests")},handler:async(ctx,{requestId})=>{
  const request=await ctx.db.get(requestId);if(!request)return [];
  return Promise.all(request.photos.map(async photo=>(await ctx.db.query("photoThumbnails").withIndex("byPhoto",q=>q.eq("photo",photo)).unique())?.thumbnail || null));
}});
