import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

const reviewTags = (reviews: any[]) => {
  const categories = [
    { label:"Denting & painting", match:/\b(dent(?:ing|s)?|paint(?:ing)?|body\s*work)\b/i },
    { label:"Honest pricing", match:/\b(honest\s+(?:pricing|prices?)|fair\s+(?:pricing|prices?)|reasonable\s+(?:pricing|prices?|rates?)|transparent\s+(?:pricing|prices?)|affordable)\b/i },
    { label:"Quick service", match:/\b(quick|fast|on time|timely|prompt)\b/i },
    { label:"Helpful team", match:/\b(helpful|friendly|courteous)\b/i },
  ];
  const positive = reviews.filter((review) => Number(review.rating) >= 4).map((review) => String(review.text || ""));
  return categories.map((category, index) => ({ label:category.label, index, count:positive.filter((text) => category.match.test(text)).length }))
    .filter((category) => category.count > 0).sort((a, b) => b.count - a.count || a.index - b.index).slice(0, 2).map((category) => category.label);
};

export const card = action({
  args: { placeId:v.string() },
  handler: async (ctx, { placeId }): Promise<any> => {
    const empty = { photoDataUrl:null, photoAttributions:[], area:"", nextCloseTime:null, tags:[], details:null };
    const key = process.env.GOOGLE_PLACES_KEY;
    if (!key || !placeId || placeId.length > 200) return empty;
    const headers = { "X-Goog-Api-Key":key };
    // Presentation only: the existing search results and reviews action are unchanged.
    const [placeResult, detailResult] = await Promise.allSettled([
      fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
        headers:{ ...headers, "X-Goog-FieldMask":"photos,addressComponents,currentOpeningHours.nextCloseTime" },
      }).then(async (response) => response.ok ? await response.json() : null),
      ctx.runAction(api.garages.details, { placeId }),
    ]);
    const place = placeResult.status === "fulfilled" ? placeResult.value : null;
    const details = detailResult.status === "fulfilled" ? detailResult.value.details : null;
    const components = place?.addressComponents ?? [];
    const area = components.find((item: any) => item.types?.includes("sublocality_level_1"))
      ?? components.find((item: any) => item.types?.includes("sublocality"))
      ?? components.find((item: any) => item.types?.includes("locality"));
    let photoDataUrl: string | null = null;
    let photoAttributions: Array<{ name:string; uri:string }> = [];
    const photo = place?.photos?.find((item: any) => item.widthPx >= item.heightPx) ?? place?.photos?.[0];
    if (typeof photo?.name === "string" && /^places\/[^/]+\/photos\/[^/]+$/.test(photo.name)) {
      try {
        const resource = photo.name.split("/").map(encodeURIComponent).join("/");
        const media = await fetch(`https://places.googleapis.com/v1/${resource}/media?maxWidthPx=800&maxHeightPx=500&skipHttpRedirect=true`, { headers });
        if (media.ok) {
          const payload = await media.json();
          const photoUri = new URL(payload.photoUri);
          if (photoUri.protocol === "https:" && photoUri.hostname.endsWith(".googleusercontent.com")) {
            // Fetch bytes server-side; neither credentials nor upstream URLs reach the browser.
            const image = await fetch(photoUri.href);
            const mime = image.headers.get("content-type")?.split(";")[0] || "";
            if (image.ok && ["image/jpeg", "image/png", "image/webp"].includes(mime)) {
              const bytes = new Uint8Array(await image.arrayBuffer());
              if (bytes.length <= 2 * 1024 * 1024) {
                let binary = "";
                for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
                photoDataUrl = `data:${mime};base64,${btoa(binary)}`;
                photoAttributions = (photo.authorAttributions ?? []).map((author: any) => ({ name:String(author.displayName || "Google Maps contributor"), uri:typeof author.uri === "string" ? author.uri : "" }));
              }
            }
          }
        }
      } catch { /* Keep the clean car placeholder if a photo is unavailable. */ }
    }
    return { photoDataUrl, photoAttributions, area:area?.longText || "", nextCloseTime:place?.currentOpeningHours?.nextCloseTime || null, tags:reviewTags(details?.reviews ?? []), details };
  },
});
