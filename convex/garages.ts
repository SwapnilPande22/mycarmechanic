import { action } from "./_generated/server";
import { v } from "convex/values";

const FIELD_MASK = "places.id,places.displayName,places.rating,places.userRatingCount,places.location,places.googleMapsUri,places.attributions,places.types,places.primaryType,places.businessStatus,places.currentOpeningHours.openNow,places.formattedAddress,places.nationalPhoneNumber";
const PLACES_URL = "https://places.googleapis.com/v1/places:searchNearby";
const AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete";
const TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const SEARCH_RADII_KM = [5, 10, 20, 30, 50];
const PUNE_REGION = { circle: { center: { latitude: 18.5204, longitude: 73.8567 }, radius: 45000 } };

class GooglePlacesError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

function distanceKm(from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDifference = radians(to.latitude - from.latitude);
  const longitudeDifference = radians(to.longitude - from.longitude);
  const a = Math.sin(latitudeDifference / 2) ** 2
    + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * Math.sin(longitudeDifference / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function googlePlacesRequest(url: string, key: string, options: {
  method?: "GET" | "POST";
  body?: unknown;
  fieldMask?: string;
}) {
  const headers: Record<string, string> = { "X-Goog-Api-Key": key };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.fieldMask) headers["X-Goog-FieldMask"] = options.fieldMask;
  const response = await fetch(url, {
    method: options.method || "POST",
    headers,
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
  });
  const responseText = await response.text();
  let payload: any = {};
  try { payload = responseText ? JSON.parse(responseText) : {}; } catch { payload = {}; }
  if (!response.ok) {
    throw new GooglePlacesError(response.status, typeof payload.error?.message === "string" ? payload.error.message : responseText || "Google Places returned no error message.");
  }
  return payload;
}

function logGooglePlacesError(context: string, error: unknown) {
  if (error instanceof GooglePlacesError) {
    console.error(`${context}: HTTP ${error.statusCode}: ${error.message}`);
  } else {
    console.error(`${context}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export const autocomplete = action({
  args: { input: v.string(), sessionToken: v.string() },
  handler: async (_ctx, { input, sessionToken }) => {
    const key = process.env.GOOGLE_PLACES_KEY;
    if (!key) return { suggestions: [] };
    const query = input.trim().slice(0, 100);
    if (query.length < 2 || query.length > 100 || !/^[A-Za-z0-9_-]{1,36}$/.test(sessionToken)) return { suggestions: [] };

    try {
      const payload = await googlePlacesRequest(AUTOCOMPLETE_URL, key, {
        method: "POST",
        body: {
          input: query,
          sessionToken,
          includedRegionCodes: ["IN"],
          includedPrimaryTypes: ["(regions)"],
          locationRestriction: PUNE_REGION,
          languageCode: "en",
          regionCode: "IN",
        },
      });
      const suggestions = (Array.isArray(payload.suggestions) ? payload.suggestions : [])
        .map((item: any) => item.placePrediction)
        .filter((item: any) => typeof item?.placeId === "string" && typeof item?.text?.text === "string")
        .slice(0, 6)
        .map((item: any) => ({ placeId: item.placeId, description: item.text.text }));
      return { suggestions };
    } catch (error) {
      logGooglePlacesError("Google Places Autocomplete failed", error);
      return { suggestions: [] };
    }
  },
});

export const nearby = action({
  args: {
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    placeId: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
    area: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const key = process.env.GOOGLE_PLACES_KEY;
    if (!key) return { garages: [] };

    try {
      let center: { latitude: number; longitude: number } | null = null;
      if (typeof args.latitude === "number" && typeof args.longitude === "number") {
        if (args.latitude < -90 || args.latitude > 90 || args.longitude < -180 || args.longitude > 180) return { garages: [] };
        center = { latitude: args.latitude, longitude: args.longitude };
      } else if (typeof args.placeId === "string" && args.placeId && typeof args.sessionToken === "string" && /^[A-Za-z0-9_-]{1,36}$/.test(args.sessionToken)) {
        const detailsUrl = `https://places.googleapis.com/v1/places/${encodeURIComponent(args.placeId)}?sessionToken=${encodeURIComponent(args.sessionToken)}`;
        const place = await googlePlacesRequest(detailsUrl, key, { method: "GET", fieldMask: "location" });
        const location = place.location;
        if (typeof location?.latitude === "number" && typeof location?.longitude === "number") {
          center = { latitude: location.latitude, longitude: location.longitude };
        }
      } else if (typeof args.area === "string" && args.area.trim().length >= 2) {
        const area = args.area.trim().slice(0, 100);
        const place = await googlePlacesRequest(TEXT_SEARCH_URL, key, {
          method: "POST",
          body: { textQuery: area, languageCode: "en", regionCode: "IN" },
          fieldMask: "places.location",
        });
        const location = place.places?.[0]?.location;
        if (typeof location?.latitude === "number" && typeof location?.longitude === "number") {
          center = { latitude: location.latitude, longitude: location.longitude };
        }
      }
      if (!center) return { garages: [] };

      const applyFilters = (returned: any[]) => {
        const placeType = returned.filter((place: any) => place.primaryType === "car_repair"
          && Array.isArray(place.types)
          && !place.types.some((type: string) => ["tire_shop", "car_wash", "auto_parts_store", "motorcycle_dealer", "motorcycle_repair", "shopping_mall", "pharmacy", "school", "college", "university", "car_dealer", "car_rental"].includes(type)));
        const hasReviews = placeType.filter((place: any) => typeof place.userRatingCount === "number" && place.userRatingCount > 0);
        const operational = hasReviews.filter((place: any) => place.businessStatus === "OPERATIONAL");
        const relevantName = operational.filter((place: any) => typeof place.displayName?.text === "string"
          && typeof place.location?.latitude === "number"
          && typeof place.location?.longitude === "number"
          && !/\b(puncture|tyres?|tires?|car\s*wash|wash\s*center|washing|bike|bicycle|motorcycle|two[- ]?wheeler|scooter|motorbike|tvs|chetak|big\s*wing|triumph|ducati|ktm|harley|yamaha|bajaj|ather|spares?|spare\s*parts?|auto\s*parts?|accessories|window\s*film|sun\s*control|glass\s*film|dash\s*cam|car\s*audio|detailing|wrapping|mall|pharmacy|college|school|university|showroom|dealer|royal\s*enfield|hero\s*motocorp)\b/i.test(place.displayName.text));
        return {
          places: relevantName,
          counts: { placesReturned: returned.length, placeType: placeType.length, hasReviews: hasReviews.length, operational: operational.length, relevantName: relevantName.length },
        };
      };
      let places: any[] = [];
      let radiusKm = SEARCH_RADII_KM[0];
      let filterCounts = { placesReturned: 0, googleResponses: 0, placeType: 0, hasReviews: 0, operational: 0, relevantName: 0 };
      for (const radius of SEARCH_RADII_KM) {
        const payload = await googlePlacesRequest(PLACES_URL, key, {
          method: "POST",
          body: {
            includedPrimaryTypes: ["car_repair"],
            maxResultCount: 20,
            rankPreference: "DISTANCE",
            languageCode: "en",
            regionCode: "IN",
            locationRestriction: { circle: { center, radius: radius * 1000 } },
          },
          fieldMask: FIELD_MASK,
        });
        const distanceResults = Array.isArray(payload.places) ? payload.places : [];
        let returned = distanceResults;
        let filtered = applyFilters(returned);
        let googleResponses = 1;
        if (filtered.places.length < 5) {
          const popularPayload = await googlePlacesRequest(PLACES_URL, key, {
            method: "POST",
            body: {
              includedPrimaryTypes: ["car_repair"],
              maxResultCount: 20,
              rankPreference: "POPULARITY",
              languageCode: "en",
              regionCode: "IN",
              locationRestriction: { circle: { center, radius: radius * 1000 } },
            },
            fieldMask: FIELD_MASK,
          });
          const popularResults = Array.isArray(popularPayload.places) ? popularPayload.places : [];
          googleResponses += 1;
          returned = Array.from(new Map([...distanceResults, ...popularResults].map((place: any) => [place.id, place])).values());
          filtered = applyFilters(returned);
        }
        radiusKm = radius;
        places = filtered.places;
        filterCounts = { ...filtered.counts, googleResponses };
        if (places.length >= 5) break;
      }

      const garages = places
        .map((place: any) => {
          const distance = distanceKm(center!, place.location);
          const mapUrl = typeof place.googleMapsUri === "string"
            ? place.googleMapsUri
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.displayName.text)}&query_place_id=${encodeURIComponent(place.id || "")}`;
          return {
            name: place.displayName.text,
            rating: typeof place.rating === "number" ? place.rating : null,
            reviewCount: typeof place.userRatingCount === "number" ? place.userRatingCount : 0,
            distanceKm: distance,
            mapUrl,
            address: typeof place.formattedAddress === "string" ? place.formattedAddress : "",
            phone: typeof place.nationalPhoneNumber === "string" ? place.nationalPhoneNumber : "",
            openNow: typeof place.currentOpeningHours?.openNow === "boolean" ? place.currentOpeningHours.openNow : null,
            placeId: place.id,
            attributions: Array.isArray(place.attributions)
              ? place.attributions.filter((item: any) => typeof item.provider === "string").map((item: any) => ({
                provider: item.provider,
                providerUri: typeof item.providerUri === "string" ? item.providerUri : null,
              }))
              : [],
          };
        })
        .sort((left: any, right: any) => left.distanceKm - right.distanceKm)
        .slice(0, 5)
        .map((place: any) => ({ ...place, distanceKm: Math.round(place.distanceKm * 10) / 10 }));

      return { garages, radiusKm, filterCounts };
    } catch (error) {
      logGooglePlacesError("Google Places garage search failed", error);
      return { garages: [] };
    }
  },
});

export const details = action({
  args: { placeId: v.string() },
  handler: async (_ctx, { placeId }) => {
    const key = process.env.GOOGLE_PLACES_KEY;
    if (!key || !placeId || placeId.length > 200) return { details: null };
    try {
      const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
      const place = await googlePlacesRequest(url, key, {
        method: "GET",
        fieldMask: "id,displayName,rating,userRatingCount,businessStatus,currentOpeningHours.openNow,formattedAddress,nationalPhoneNumber,googleMapsUri,reviews",
      });
      if (place.businessStatus !== "OPERATIONAL" || !(place.userRatingCount > 0)) return { details: null };
      return { details: {
        name: place.displayName?.text || "",
        rating: typeof place.rating === "number" ? place.rating : null,
        reviewCount: typeof place.userRatingCount === "number" ? place.userRatingCount : 0,
        address: place.formattedAddress || "",
        phone: place.nationalPhoneNumber || "",
        openNow: typeof place.currentOpeningHours?.openNow === "boolean" ? place.currentOpeningHours.openNow : null,
        mapUrl: place.googleMapsUri || "",
        reviews: (Array.isArray(place.reviews) ? place.reviews : []).slice(0, 5).map((review: any) => ({
          text: review.text?.text || "",
          rating: typeof review.rating === "number" ? review.rating : null,
          relativeTime: review.relativePublishTimeDescription || "",
          authorName: review.authorAttribution?.displayName || "Google Maps user",
          authorUrl: review.authorAttribution?.uri || "",
          googleMapsUri: review.googleMapsUri || "",
        })),
      } };
    } catch (error) {
      logGooglePlacesError("Google Places garage details failed", error);
      return { details: null };
    }
  },
});
