import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  // Include Convex Auth tables (users, sessions, accounts, etc.)
  ...authTables,

  // Family member profiles (extends auth users)
  familyProfiles: defineTable({
    userId: v.id("users"), // Links to authTables.users
    name: v.string(), // Display name
    hebrewName: v.optional(v.string()),
    phone: v.string(),
    role: v.union(
      v.literal("sibling"),
      v.literal("spouse"),
      v.literal("grandchild"),
      v.literal("coordinator")
    ),
    isCoordinator: v.boolean(),
    avatarGradient: v.optional(v.string()),
    lastVisit: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_phone", ["phone"])
    .index("by_role", ["role"]),

  // Visit slots
  visitSlots: defineTable({
    date: v.string(), // ISO date YYYY-MM-DD
    hebrewDate: v.string(),
    slot: v.union(
      v.literal("morning"),
      v.literal("afternoon"),
      v.literal("evening")
    ),
    bookedBy: v.optional(v.id("familyProfiles")),
    bookedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    isShabbat: v.boolean(),
    isHoliday: v.boolean(),
    holidayName: v.optional(v.string()),
  })
    .index("by_date", ["date"])
    .index("by_date_slot", ["date", "slot"])
    .index("by_user", ["bookedBy"]),

  // Special days (yahrzeits, birthdays, holidays)
  specialDays: defineTable({
    hebrewDate: v.string(),
    type: v.union(
      v.literal("yahrzeit"),
      v.literal("birthday"),
      v.literal("holiday")
    ),
    name: v.string(),
    blocksVisits: v.boolean(),
  }).index("by_hebrew_date", ["hebrewDate"]),

  // Notification queue
  notifications: defineTable({
    userId: v.id("familyProfiles"),
    type: v.union(
      v.literal("reminder"),
      v.literal("confirmation"),
      v.literal("gap_alert"),
      v.literal("nudge")
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("failed")
    ),
    scheduledFor: v.number(),
    twilioMessageId: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_user", ["userId"]),
});
