/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as bills from "../bills.js";
import type * as conversation from "../conversation.js";
import type * as data_carVariants from "../data/carVariants.js";
import type * as data_cities from "../data/cities.js";
import type * as garagePresentation from "../garagePresentation.js";
import type * as garages from "../garages.js";
import type * as inspections from "../inspections.js";
import type * as locations from "../locations.js";
import type * as metrics from "../metrics.js";
import type * as panels from "../panels.js";
import type * as partnerGarages from "../partnerGarages.js";
import type * as priceEstimates from "../priceEstimates.js";
import type * as quoteEmail from "../quoteEmail.js";
import type * as quoteMessages from "../quoteMessages.js";
import type * as quoteRequests from "../quoteRequests.js";
import type * as repairPlan from "../repairPlan.js";
import type * as vehicleCatalog from "../vehicleCatalog.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  bills: typeof bills;
  conversation: typeof conversation;
  "data/carVariants": typeof data_carVariants;
  "data/cities": typeof data_cities;
  garagePresentation: typeof garagePresentation;
  garages: typeof garages;
  inspections: typeof inspections;
  locations: typeof locations;
  metrics: typeof metrics;
  panels: typeof panels;
  partnerGarages: typeof partnerGarages;
  priceEstimates: typeof priceEstimates;
  quoteEmail: typeof quoteEmail;
  quoteMessages: typeof quoteMessages;
  quoteRequests: typeof quoteRequests;
  repairPlan: typeof repairPlan;
  vehicleCatalog: typeof vehicleCatalog;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  staticHosting: import("@convex-dev/static-hosting/_generated/component.js").ComponentApi<"staticHosting">;
};
