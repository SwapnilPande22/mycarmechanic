export type EmailRequest = {
  name: string; whatsappNumber: string; createdAt: number;
  carModel: string; make?: string; model?: string; year?: string;
  city?: string; area: string; customerConcern?: string;
  parts: { partName: string; workNeeded: string; customerDescription?: string; photoObservation?: string }[];
};

// Customer prose is untrusted: omit contact details and prices from the garage copy.
export function garageSafe(value: string | undefined, phone: string): string {
  return (value || "Not provided")
    .replace(new RegExp(phone.replace(/\D/g, "").split("").join("[\\s()-]*"), "g"), "[phone withheld]")
    .replace(/(?:\+?\d[\s()-]*){10,15}/g, "[phone withheld]")
    .replace(/(?:₹|\bINR\b|\bRs\.?|\$)\s*[\d,.]+(?:\s*[-–]\s*[\d,.]+)?|\b[\d,.]+\s*(?:rupees?|bucks?)\b/gi, "[price withheld]")
    .replace(/^.*\b(?:estimate|price|cost|quote|total|range)\b.*\d.*$/gim, "[pricing withheld]");
}

export function quoteEmailText(request: EmailRequest, photoUrls: string[]): string {
  const safe = (value?: string) => garageSafe(value, request.whatsappNumber);
  return [
    "For owner only",
    `Customer name: ${request.name}`,
    `Phone number: ${request.whatsappNumber}`,
    `Request time: ${new Date(request.createdAt).toISOString()}`,
    "", "Copy for garage",
    `Car make: ${safe(request.make)}`,
    `Car model: ${safe(request.model || request.carModel)}`,
    `Car year: ${safe(request.year)}`,
    `City: ${safe(request.city)}`,
    `Area: ${safe(request.area)}`,
    "", "Damaged parts:",
    ...request.parts.flatMap((part, index) => [
      `${index + 1}. ${safe(part.partName)}`,
      `Customer described: ${safe(part.customerDescription)}`,
      `Photos show: ${safe(part.photoObservation)}`,
      `Work to assess: ${safe(part.workNeeded)}`,
    ]),
    "", "Customer's concern (their words):", safe(request.customerConcern),
    "", "Photos:", ...photoUrls.map((url, index) => `${index + 1}. ${url}`),
  ].join("\n");
}
