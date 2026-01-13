import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { ensureUser, getAuthUserId } from "./authHelpers";

/**
 * Book a visit slot
 * - Prevents double-booking (same date + slot)
 * - Blocks Shabbat slots (Friday evening, Saturday)
 * - Requires authentication
 */
export const bookSlot = mutation({
  args: {
    date: v.string(), // ISO date YYYY-MM-DD
    slot: v.union(
      v.literal("morning"),
      v.literal("afternoon"),
      v.literal("evening")
    ),
    hebrewDate: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Check authentication
    const userId = await ensureUser(ctx);
    if (!userId) {
      throw new Error("Unauthorized: Must be logged in to book a slot");
    }

    // 2. Get family profile for this user
    const profile = await ctx.db
      .query("familyProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) {
      throw new Error("Profile not found: Please complete your profile first");
    }

    // 3. Check for existing booking (conflict detection)
    const existingSlot = await ctx.db
      .query("visitSlots")
      .withIndex("by_date_slot", (q) =>
        q.eq("date", args.date).eq("slot", args.slot)
      )
      .unique();

    if (existingSlot && existingSlot.bookedBy) {
      throw new Error("Conflict: This slot is already booked");
    }

    // 4. Check if slot is on Shabbat (Friday evening or Saturday)
    // Use getUTCDay() for consistent behavior regardless of server timezone
    const dateObj = new Date(args.date);
    const dayOfWeek = dateObj.getUTCDay();
    const isShabbat =
      (dayOfWeek === 5 && args.slot === "evening") || // Friday evening
      dayOfWeek === 6; // Saturday

    if (isShabbat) {
      throw new Error("Cannot book: This slot falls during Shabbat");
    }

    // 5. Create or update the slot
    let slotId;
    if (existingSlot) {
      // Update existing unbooked slot
      await ctx.db.patch(existingSlot._id, {
        bookedBy: profile._id,
        bookedAt: Date.now(),
        notes: args.notes,
      });
      slotId = existingSlot._id;
    } else {
      // Create new slot
      slotId = await ctx.db.insert("visitSlots", {
        date: args.date,
        slot: args.slot,
        hebrewDate: args.hebrewDate,
        bookedBy: profile._id,
        bookedAt: Date.now(),
        notes: args.notes,
        isShabbat: false,
        isHoliday: false,
      });
    }

    // 6. Queue booking confirmation notification (immediate)
    await ctx.runMutation(internal.notifications.queueBookingConfirmation, {
      profileId: profile._id,
      slotId,
    });

    // 7. Queue reminder notification (24h before visit)
    // Calculate reminder time based on slot time
    const slotStartHours = {
      morning: 7,
      afternoon: 12,
      evening: 16,
    };
    const visitDateTime = new Date(args.date + "T00:00:00");
    visitDateTime.setHours(slotStartHours[args.slot]);
    const reminderTime = visitDateTime.getTime() - 24 * 60 * 60 * 1000; // 24h before

    // Only schedule reminder if visit is more than 24h away
    if (reminderTime > Date.now()) {
      await ctx.runMutation(internal.notifications.queueReminder, {
        profileId: profile._id,
        slotId,
        scheduledFor: reminderTime,
      });
    }

    // 8. Update lastVisit on profile
    await ctx.db.patch(profile._id, {
      lastVisit: Date.now(),
    });

    return slotId;
  },
});

/**
 * Cancel a booking
 * - Only the booker or a coordinator can cancel
 */
export const cancelSlot = mutation({
  args: {
    slotId: v.id("visitSlots"),
  },
  handler: async (ctx, args) => {
    // 1. Check authentication
    const userId = await ensureUser(ctx);
    if (!userId) {
      throw new Error("Unauthorized: Must be logged in to cancel a booking");
    }

    // 2. Get the slot
    const slot = await ctx.db.get(args.slotId);
    if (!slot) {
      throw new Error("Slot not found");
    }

    // 3. Get family profile
    const profile = await ctx.db
      .query("familyProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) {
      throw new Error("Profile not found");
    }

    // 4. Verify ownership (only booker or coordinator can cancel)
    if (slot.bookedBy !== profile._id && !profile.isAdmin) {
      throw new Error("Unauthorized: Can only cancel your own bookings");
    }

    // 5. Clear the booking (keep the slot record for audit trail)
    await ctx.db.patch(args.slotId, {
      bookedBy: undefined,
      bookedAt: undefined,
      notes: undefined,
    });

    return { success: true };
  },
});

/**
 * Get schedule for a date range
 * Returns slots enriched with booker profile information
 */
export const getSchedule = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const slots = await ctx.db
      .query("visitSlots")
      .withIndex("by_date")
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), args.startDate),
          q.lte(q.field("date"), args.endDate)
        )
      )
      .collect();

    // Enrich with profile information
    const enrichedSlots = await Promise.all(
      slots.map(async (slot) => {
        if (slot.bookedBy) {
          const profile = await ctx.db.get(slot.bookedBy);
          return {
            ...slot,
            bookedByProfile: profile,
          };
        }
        return { ...slot, bookedByProfile: null };
      })
    );

    return enrichedSlots;
  },
});

/**
 * Get a single slot by date and slot type
 */
export const getSlot = query({
  args: {
    date: v.string(),
    slot: v.union(
      v.literal("morning"),
      v.literal("afternoon"),
      v.literal("evening")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("visitSlots")
      .withIndex("by_date_slot", (q) =>
        q.eq("date", args.date).eq("slot", args.slot)
      )
      .unique();
  },
});

/**
 * Get all slots for a specific date
 */
export const getSlotsByDate = query({
  args: {
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const slots = await ctx.db
      .query("visitSlots")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();

    // Enrich with profile information
    return await Promise.all(
      slots.map(async (slot) => {
        if (slot.bookedBy) {
          const profile = await ctx.db.get(slot.bookedBy);
          return { ...slot, bookedByProfile: profile };
        }
        return { ...slot, bookedByProfile: null };
      })
    );
  },
});

/**
 * Get user's bookings
 */
export const getMyBookings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const profile = await ctx.db
      .query("familyProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) {
      return [];
    }

    return await ctx.db
      .query("visitSlots")
      .withIndex("by_user", (q) => q.eq("bookedBy", profile._id))
      .collect();
  },
});
