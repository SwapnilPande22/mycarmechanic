// Customer prose is untrusted: omit contact details and prices from the garage copy.
export function garageSafe(value: string | undefined, phone: string): string {
  return (value || "Not provided")
    .replace(new RegExp(phone.replace(/\D/g, "").split("").join("[\\s()-]*"), "g"), "[phone withheld]")
    .replace(/(?:\+?\d[\s()-]*){10,15}/g, "[phone withheld]")
    .replace(/(?:₹|\bINR\b|\bRs\.?|\$)\s*[\d,.]+(?:\s*[-–]\s*[\d,.]+)?|\b[\d,.]+\s*(?:rupees?|bucks?)\b/gi, "[price withheld]")
    .replace(/^.*\b(?:estimate|price|cost|quote|total|range)\b.*\d.*$/gim, "[pricing withheld]");
}

