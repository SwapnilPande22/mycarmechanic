import { action } from "./_generated/server";
import { v } from "convex/values";

export const cityFromCoordinates = action({
  args: { latitude:v.number(), longitude:v.number() },
  handler: async (_ctx, { latitude, longitude }) => {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) throw new Error("Location could not be resolved.");
    const key = process.env.GOOGLE_PLACES_KEY;
    if (!key) throw new Error("Location could not be resolved.");
    // Resolve only browser-supplied coordinates using the garage finder's Places service.
    // No IP lookup, nearest-city guess, phone fields or credential logging.
    const response = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
      method:"POST",
      headers:{ "Content-Type":"application/json", "X-Goog-Api-Key":key, "X-Goog-FieldMask":"places.addressComponents" },
      body:JSON.stringify({ maxResultCount:5, rankPreference:"DISTANCE", languageCode:"en", locationRestriction:{ circle:{ center:{ latitude, longitude }, radius:3000 } } }),
    });
    if (!response.ok) throw new Error("Location could not be resolved.");
    const payload = await response.json();
    for (const place of payload.places ?? []) {
      const components = place.addressComponents ?? [];
      const country = components.find((part: any) => part.types?.includes("country"));
      if (country?.shortText !== "IN") continue;
      const city = components.find((part: any) => part.types?.includes("locality"))
        ?? components.find((part: any) => part.types?.includes("postal_town"));
      if (typeof city?.longText === "string" && city.longText.trim()) return { city:city.longText.trim() };
    }
    throw new Error("Location could not be resolved.");
  },
});
