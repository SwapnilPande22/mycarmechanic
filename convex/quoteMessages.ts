import { garageSafe } from "./quoteEmail";
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
  const car=[request.make,request.model || request.carModel,request.year || "Year not provided"].filter(Boolean).join(" ");
  const location=[request.area,request.city].filter(Boolean).filter((value,index,values)=>values.indexOf(value)===index).join(", ");
  const parts=request.parts.map(part=>`${clean(part.partName,request)}: ${clean(part.photoObservation || part.workNeeded,request).slice(0,160)}`);
  const damage=parts.length>3 ? [...parts.slice(0,2),parts.slice(2).join("; ")] : parts;
  return [`Car: ${clean(car,request)}`,`Area: ${clean(location,request)}`,...damage,`Concern: ${clean(request.customerConcern,request).slice(0,300)}`,`Photos: ${photoLink}`,"Please reply with your price and the earliest time you can inspect the car."].join("\n");
}
export async function localizedGarageMessage(request:Request,photoLink:string,language:"en"|"hi"|"mr") {
  const translated=await translateTexts(garageMessage(request,photoLink).split("\n"),language,true);
  const result=translated.map(line=>{
    let text=line.replace(/[\r\n]+/g," ");
    if(request.name)text=text.split(request.name).join("");
    if(request.whatsappNumber)text=text.split(request.whatsappNumber).join("");
    return text;
  }).join("\n");
  if(result.split("\n").length>8)throw new Error("Garage message exceeds eight lines.");
  return result;
}
