import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  billChecks: defineTable({ createdAt: v.number() }).index("byCreatedAt", ["createdAt"]),
});
