export type EmailRequest = {
  name: string; whatsappNumber: string; createdAt: number;
  carModel: string; make?: string; model?: string; year?: string;
  city?: string; area: string; customerConcern?: string;
  parts: { partName: string; workNeeded: string; customerDescription?: string; photoObservation?: string }[];
};

import { garageMessage } from "./quoteMessages";
export { garageSafe } from "./garageSafety";

export function quoteEmailText(request: EmailRequest, photoUrls: string[], adminUrl?: string): string {
  const photoLink = adminUrl ? adminUrl.replace(/\/admin\?request=(.+)$/, "/quotes/$1") : photoUrls[0] || "Photos available in the request";
  return [
    "For owner only",
    `Customer name: ${request.name}`,
    `Phone number: ${request.whatsappNumber}`,
    `Request time: ${new Date(request.createdAt).toISOString()}`,
    ...(adminUrl ? [`Admin request: ${adminUrl}`] : []),
    "", "Copy for garage", garageMessage(request, photoLink),
  ].join("\n");
}
