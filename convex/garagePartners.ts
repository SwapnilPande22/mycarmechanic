import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const location=v.object({latitude:v.number(),longitude:v.number()});
const record={placeId:v.string(),name:v.string(),address:v.string(),mapUrl:v.string(),location,rating:v.optional(v.number()),reviewCount:v.number()};
export const list=internalQuery({args:{},handler:async ctx=>ctx.db.query("garagePartners").collect()});
export const save=internalMutation({
  args:{...record,enabled:v.boolean()},
  handler:async(ctx,args)=>{const existing=await ctx.db.query("garagePartners").withIndex("byPlaceId",q=>q.eq("placeId",args.placeId)).unique();if(existing){await ctx.db.patch(existing._id,{...args,updatedAt:Date.now()});return existing._id;}return ctx.db.insert("garagePartners",{...args,updatedAt:Date.now()});},
});
export const toggle=internalMutation({args:{placeId:v.string(),enabled:v.boolean()},handler:async(ctx,{placeId,enabled})=>{const row=await ctx.db.query("garagePartners").withIndex("byPlaceId",q=>q.eq("placeId",placeId)).unique();if(!row)throw new Error("Partner garage not found.");await ctx.db.patch(row._id,{enabled,updatedAt:Date.now()});}});

export async function findPartnerPlaces(input:string){
  const key=process.env.GOOGLE_PLACES_KEY;if(!key)throw new Error("Garage search is unavailable.");
  const response=await fetch("https://places.googleapis.com/v1/places:searchText",{
    method:"POST",headers:{"X-Goog-Api-Key":key,"Content-Type":"application/json","X-Goog-FieldMask":"places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri,places.rating,places.userRatingCount,places.types"},
    body:JSON.stringify({textQuery:input.trim().slice(0,160),languageCode:"en",regionCode:"IN",pageSize:6,includedType:"car_repair",locationBias:{circle:{center:{latitude:18.5204,longitude:73.8567},radius:45000}}}),signal:AbortSignal.timeout(15000),
  });
  if(!response.ok)throw new Error("Garage search is unavailable. Please try again.");
  const body=await response.json();return (body.places || []).filter((p:any)=>p.id&&p.displayName?.text&&p.types?.includes("car_repair")&&typeof p.location?.latitude==="number"&&typeof p.location?.longitude==="number")
    .map((p:any)=>({placeId:p.id,name:p.displayName.text,address:p.formattedAddress || "",mapUrl:p.googleMapsUri || `https://www.google.com/maps/search/?api=1&query_place_id=${p.id}&query=${encodeURIComponent(p.displayName.text)}`,location:p.location,...(typeof p.rating==="number"?{rating:p.rating}:{}),reviewCount:p.userRatingCount || 0}));
}

// Discover canonical Google identities before marking the four requested garages.
export const discoverInitial=internalAction({args:{},handler:async()=>{
  const names=["Auto Excellence Kharadi","Morya Motors and Car Service","KGN Motors","Sai Car Care"];
  return Promise.all(names.map(async name=>({name,candidates:await findPartnerPlaces(name+", Pune")})));
}});

export function distanceKm(from:{latitude:number;longitude:number},to:{latitude:number;longitude:number}){
  const rad=(n:number)=>n*Math.PI/180,a=Math.sin(rad(to.latitude-from.latitude)/2)**2+Math.cos(rad(from.latitude))*Math.cos(rad(to.latitude))*Math.sin(rad(to.longitude-from.longitude)/2)**2;
  return 6371*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
export function mergePartners<T extends {placeId?:string}>(normal:T[],partners:T[]){const ids=new Set(partners.map(p=>p.placeId));return [...partners,...normal.filter(p=>!ids.has(p.placeId))];}

export async function nearbyPartners(ctx:any,center:{latitude:number;longitude:number},key:string):Promise<any[]>{
  const rows=await ctx.runQuery(internal.garagePartners.list,{});
  const nearby=rows.filter((row:any)=>row.enabled&&distanceKm(center,row.location)<=10).sort((a:any,b:any)=>distanceKm(center,a.location)-distanceKm(center,b.location));
  return Promise.all(nearby.map(async(row:any)=>{
    let place:any={};try{const response=await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(row.placeId)}`,{headers:{"X-Goog-Api-Key":key,"X-Goog-FieldMask":"rating,userRatingCount,currentOpeningHours.openNow"},signal:AbortSignal.timeout(8000)});if(response.ok)place=await response.json();}catch{}
    return {name:row.name,placeId:row.placeId,mapUrl:row.mapUrl,address:row.address,area:row.address,rating:typeof place.rating==="number"?place.rating:row.rating??null,reviewCount:place.userRatingCount??row.reviewCount,distanceKm:Math.round(distanceKm(center,row.location)*10)/10,openNow:place.currentOpeningHours?.openNow??null,phone:"",attributions:[],quotePartner:true};
  }));
}
