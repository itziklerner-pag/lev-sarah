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
    relationship: v.union(
      v.literal("בן"),
      v.literal("בת"),
      v.literal("נכד"),
      v.literal("נכדה"),
      v.literal("נינה"),
      v.literal("קרוב"),
      v.literal("קרובה")
    ),
    isAdmin: v.boolean(),
    profileImage: v.optional(v.id("_storage")), // Profile picture for Abba's display
    avatarGradient: v.optional(v.string()),
    lastVisit: v.optional(v.number()),
    profileCompleted: v.optional(v.boolean()), // Has user uploaded their picture
  })
    .index("by_userId", ["userId"])
    .index("by_phone", ["phone"])
    .index("by_relationship", ["relationship"])
    .index("by_admin", ["isAdmin"]),

  // Invites for new family members
  invites: defineTable({
    phone: v.string(),
    name: v.string(),
    relationship: v.union(
      v.literal("בן"),
      v.literal("בת"),
      v.literal("נכד"),
      v.literal("נכדה"),
      v.literal("נינה"),
      v.literal("קרוב"),
      v.literal("קרובה")
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("accepted"),
      v.literal("failed")
    ),
    invitedBy: v.optional(v.id("familyProfiles")),
    invitedAt: v.number(),
    acceptedAt: v.optional(v.number()),
    error: v.optional(v.string()),
    isAdminInvite: v.optional(v.boolean()), // If true, user becomes admin on accept
    inviteCode: v.optional(v.string()), // Unique code for invite link
    // Legacy fields (to be removed after migration)
    otpCode: v.optional(v.string()),
    otpExpiresAt: v.optional(v.number()),
    twilioMessageId: v.optional(v.string()),
  })
    .index("by_phone", ["phone"])
    .index("by_status", ["status"])
    .index("by_inviteCode", ["inviteCode"]),

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
      v.literal("nudge"),
      v.literal("invite")
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("failed")
    ),
    scheduledFor: v.number(),
    sentAt: v.optional(v.number()),
    twilioMessageId: v.optional(v.string()),
    visitSlotId: v.optional(v.id("visitSlots")),
    message: v.optional(v.string()),
    error: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_user", ["userId"])
    .index("by_scheduled", ["scheduledFor"]),
});
