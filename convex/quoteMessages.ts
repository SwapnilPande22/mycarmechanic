import { garageSafe } from "./garageSafety";
import { translateTexts } from "./presentation";
type Request={name?:string;whatsappNumber?:string;carModel:string;make?:string;model?:string;variant?:string;year?:string;area:string;city?:string;customerConcern?:string;requestType?:"mechanical";parts:{partName:string;workNeeded:string;photoObservation?:string}[]};
function clean(value:string|undefined,request:Request):string {
  let text=garageSafe(value || " ",request.whatsappNumber || "0000000000");
  if(request.name)text=text.split(request.name).join("");
  return text.replace(/\[(?:phone|price|pricing) withheld\]/g,"").split(/[\r\n]+|(?<=[.!?।])\s+/)
    .filter(sentence=>!/(?:\b(?:estimate|price|cost|INR|rupees?)\b|₹|अंदाज|अनुमान|किंमत|कीमत|रुपये)/i.test(sentence))
    .join(" ").replace(/\bNot provided\b/gi,"").replace(/\s+/g," ").trim();
}
export function garageMessage(request:Request,photoLink="Photos available in the request") {
  const year=/^\d{4}$/.test(request.year?.trim() || "") ? request.year!.trim() : "";
  const contains=(text:string,part:string)=>` ${text.toLowerCase()} `.includes(` ${part.toLowerCase()} `);
  const fullModel=clean(request.carModel,request),model=clean(request.model,request);
  let car=model && !contains(fullModel,model) ? model : fullModel || model;
  const make=clean(request.make,request),variant=clean(request.variant,request);
  if(make && !contains(car,make))car=[make,car].filter(Boolean).join(" ");
  if(variant && !contains(car,variant))car=contains(variant,car) ? variant : [car,variant].filter(Boolean).join(" ");
  if(year && !contains(car,year))car=[car,year].filter(Boolean).join(" ");
  // Prefer the saved location-step locality, then the saved city.
  const usable=(value:string)=>value && !/^(?:my location|you|not provided|unknown|undefined|null)$/i.test(value);
  const city=clean(request.city,request);
  const locality=request.area.split(",").map(value=>clean(value.trim(),request)).find(value=>usable(value) && value.toLowerCase()!==city.toLowerCase()) || (usable(city) ? city : "");
  const parts=request.parts.map((part,index)=>`${index+1}. ${clean(part.partName,request)} – ${clean(part.workNeeded,request)}`);
  if(request.requestType === "mechanical") return ["New repair request from MyCarMechanic", "No photo, mechanical", `A customer near ${clean(locality,request)} needs a quote.`, `Car: ${clean(car,request)}`, `Area: ${clean(locality,request)}`, `Problem: ${clean(request.customerConcern,request)}`, "Please reply with your total price and when you can take the car. I will share your quote with the customer."].join("\n");
  return ["New repair request from MyCarMechanic",`A customer near ${clean(locality,request)} needs a quote.`,`Car: ${clean(car,request)}`,`Area: ${clean(locality,request)}`,"Damage:",...parts,`Photos: ${photoLink}`,"Please reply with your total price and when you can take the car. I will share your quote with the customer."].join("\n");
}
export async function localizedGarageMessage(request:Request,photoLink:string,language:"en"|"hi"|"mr") {
  const source=garageMessage(request,photoLink).split("\n");
  const translated=language==="en" ? source : await translateTexts(source,language,true);
  const result=translated.map(line=>{
    let text=line.replace(/[\r\n]+/g," ");
    if(request.name)text=text.split(request.name).join("");
    if(request.whatsappNumber)text=text.split(request.whatsappNumber).join("");
    return text;
  }).join("\n");
  return result;
}
