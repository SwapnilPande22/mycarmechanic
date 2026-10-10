import { internalAction } from "./_generated/server";
import { v } from "convex/values";

const validPanel = v.union(v.literal("front_bumper"), v.literal("rear_bumper"), v.literal("bonnet"), v.literal("boot"), v.literal("front_lhs_door"), v.literal("front_rhs_door"), v.literal("rear_lhs_door"), v.literal("rear_rhs_door"), v.literal("lhs_fender"), v.literal("rhs_fender"), v.literal("lhs_quarter_panel"), v.literal("rhs_quarter_panel"), v.literal("lhs_mirror"), v.literal("rhs_mirror"), v.literal("lhs_headlight"), v.literal("rhs_headlight"), v.literal("lhs_tail_light"), v.literal("rhs_tail_light"), v.literal("lhs_fog_light"), v.literal("rhs_fog_light"), v.literal("windshield"));
const repairType = v.union(v.literal("denting_painting"), v.literal("repair"), v.literal("replacement"));
type PriceItem = { panel: string; repairType: "denting_painting" | "repair" | "replacement"; low: number; high: number };

export const estimateAll = internalAction({
  args: {
    carModel: v.string(),
    city: v.string(),
    carSize: v.union(v.literal("small"), v.literal("medium"), v.literal("large")),
    items: v.array(v.object({ panel: validPanel, repairType })),
  },
  handler: async (_ctx, { carModel, carSize, city, items }) => {
    if (!items.length) return { estimates: [] };
    if (items.length > 20) throw new Error("Too many estimate items.");
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("AI pricing is not configured yet.");
    const pricingItems = items.map((item) => ({
      ...item,
      repairType: item.panel.includes("mirror") || item.panel.includes("headlight") || item.panel.includes("tail_light") || item.panel.includes("fog_light") || item.panel === "windshield"
        ? "replacement" as const
        : item.repairType,
    }));
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        temperature: 0,
        max_output_tokens: 1400,
        text: { format: { type: "json_object" } },
        input: [{ role: "user", content: [{ type: "input_text", text: `Price the visible damage as a typical local multi-brand independent garage in ${city}, India, not an authorised service centre. Car make/model: ${carModel}; size: ${carSize}. Pricing must be your own estimate in whole INR, with no reference bill or rate sheet. For each item in ${JSON.stringify(pricingItems)}, return exactly one estimate in input order for the specified work: denting_painting means dent repair and paint, repair means repair without replacement, replacement means a replacement part including labour/fitting and paint if needed. For replacement prefer realistic locally available aftermarket or second-hand parts, not authorised dealer/OEM pricing. Lights, mirrors and glass are always replace. Include labour, paint/materials and applicable taxes in each total. Give a plausible local low/high range. Do not add parts not in the supplied list. Output JSON only: {"estimates":[{"panel":"exact panel","repairType":"exact type","low":positive integer,"high":integer at least low}]}. Do not include explanations or currency symbols.` }] }],
      }),
    });
    if (!response.ok) {
      console.error(`AI repair pricing failed: HTTP ${response.status}`);
      throw new Error("AI pricing is unavailable right now. Please try again.");
    }
    let parsed: any;
    try {
      const payload = await response.json();
      const text = payload.output?.flatMap((item: any) => item.content ?? []).find((item: any) => item.type === "output_text")?.text;
      parsed = JSON.parse(text || "{}");
    } catch {
      console.error("AI repair pricing response was invalid JSON.");
      throw new Error("AI pricing could not be read. Please try again.");
    }
    const raw = Array.isArray(parsed.estimates) ? parsed.estimates : [];
    const estimates: PriceItem[] = pricingItems.map((item) => {
      const candidate = raw.find((entry: any) => entry.panel === item.panel && entry.repairType === item.repairType);
      const lowCandidate = Math.round(Number(candidate?.low));
      const highCandidate = Math.round(Number(candidate?.high));
      if (!Number.isFinite(lowCandidate) || !Number.isFinite(highCandidate) || lowCandidate <= 0 || highCandidate < lowCandidate) {
        throw new Error("AI pricing could not produce a range for every part. Please try again.");
      }
      const low = lowCandidate;
      const high = highCandidate;
      return { ...item, low, high };
    });

    return { estimates };
  },
});
