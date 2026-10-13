import { garageSafe } from "./garageSafety";
import { translateTexts } from "./presentation";
type Request={name?:string;whatsappNumber?:string;carModel:string;make?:string;model?:string;year?:string;area:string;city?:string;customerConcern?:string;parts:{partName:string;workNeeded:string;photoObservation?:string}[]};
function clean(value:string|undefined,request:Request):string {
  let text=garageSafe(value,request.whatsappNumber || "0000000000");
  if(request.name)text=text.split(request.name).join("");
  return text.replace(/\[(?:phone|price|pricing) withheld\]/g,"").split(/[\r\n]+|(?<=[.!?।])\s+/)
    .filter(sentence=>!/(?:\b(?:estimate|price|cost|INR|rupees?)\b|₹|अंदाज|अनुमान|किंमत|कीमत|रुपये)/i.test(sentence))
    .join(" ").replace(/\s+/g," ").trim() || "Not provided";
}
export function garageMessage(request:Request,photoLink="Photos available in the request") {
  const year=/^\d{4}$/.test(request.year?.trim() || "") ? request.year!.trim() : "";
  const car=[request.make,request.model || request.carModel,year].filter(Boolean).join(" ");
  // Use the location-step area only; discard an appended city, never fall back to it.
  const locality=request.area.split(",").map(value=>value.trim()).find(value=>value && value.toLowerCase()!==request.city?.trim().toLowerCase()) || "";
  const parts=request.parts.map((part,index)=>`${index+1}. ${clean(part.partName,request)} – ${clean(part.workNeeded,request)}`);
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
