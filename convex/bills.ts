import { action, internalMutation, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const MAX_FILE_BYTES = 8 * 1024 * 1024;

export const createUploadUrl = mutation({
  args: {},
  handler: async (ctx) => ctx.storage.generateUploadUrl(),
});

export const consumeHourlyCall = internalMutation({
  args: {},
  handler: async (ctx) => {
    const since = Date.now() - 60 * 60 * 1000;
    const recent = await ctx.db.query("billChecks").withIndex("byCreatedAt").collect();
    const active = recent.filter((entry) => entry.createdAt > since);
    if (active.length >= 10) return false;
    await ctx.db.insert("billChecks", { createdAt: Date.now() });
    for (const entry of recent) {
      if (entry.createdAt <= since) await ctx.db.delete(entry._id);
    }
    return true;
  },
});

export const analyze = action({
  args: { storageId: v.id("_storage"), mimeType: v.string(), size: v.number() },
  handler: async (ctx, { storageId, mimeType, size }) => {
    if (!mimeType.startsWith("image/") || !["image/jpeg", "image/png", "image/webp", "image/heic"].includes(mimeType)) {
      throw new Error("Upload a JPG, PNG, WebP, or HEIC bill photo.");
    }
    if (size <= 0 || size > MAX_FILE_BYTES) throw new Error("The photo must be smaller than 8 MB.");
    const allowed = await ctx.runMutation(internal.bills.consumeHourlyCall, {});
    if (!allowed) throw new Error("The hourly bill check limit has been reached. Please try again later.");
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("Bill checking is not configured yet.");
    const imageUrl = await ctx.storage.getUrl(storageId);
    if (!imageUrl) throw new Error("The uploaded photo could not be read. Please try again.");

    try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        max_output_tokens: 900,
        text: { format: { type: "json_object" } },
        input: [{ role: "user", content: [
          { type: "input_text", text: "Read this car repair bill. Return only concise JSON with keys: billTotal (number or null), currency (short currency symbol/code or null), lines (array of {name, quantity (number or null), price (number or null), type ('labour' or 'spare part' or 'other')}), and note (short string). Include every visible charge line. Use line total for price; do not infer missing values. If uncertain, use null. Do not assess fair/low/high prices." },
          { type: "input_image", image_url: imageUrl },
        ] }],
      }),
    });
    if (!response.ok) throw new Error("Could not analyze this bill. Please try another clear photo.");
    const payload = await response.json();
    const text = payload.output?.flatMap((item: any) => item.content ?? []).find((item: any) => item.type === "output_text")?.text;
    if (!text) throw new Error("The bill could not be read. Please try a clearer photo.");
    let result;
    try { result = JSON.parse(text); } catch { throw new Error("The bill could not be read. Please try a clearer photo."); }
    if (!Array.isArray(result.lines)) throw new Error("The bill could not be read. Please try a clearer photo.");
    return {
      billTotal: typeof result.billTotal === "number" ? result.billTotal : null,
      currency: typeof result.currency === "string" ? result.currency : "",
      lines: result.lines.slice(0, 80).map((line: any) => ({
        name: typeof line.name === "string" ? line.name.slice(0, 160) : "Unclear item",
        quantity: typeof line.quantity === "number" ? line.quantity : null,
        price: typeof line.price === "number" ? line.price : null,
        type: ["labour", "spare part"].includes(line.type) ? line.type : "other",
      })),
      note: typeof result.note === "string" ? result.note.slice(0, 140) : "",
    };
    } finally {
      await ctx.storage.delete(storageId);
    }
  },
});
