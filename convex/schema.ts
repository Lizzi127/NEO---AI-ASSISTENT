import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  messages: defineTable({
    userId: v.id("users"),
    message: v.string(),
    role: v.string(),
    timestamp: v.number(),
  }).index("by_user", ["userId"]),
  
  preferences: defineTable({
    userId: v.id("users"),
    outputMode: v.string(),
  }).index("by_user", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
