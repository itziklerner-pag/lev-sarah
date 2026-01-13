import { v } from "convex/values";
import { query, mutation, MutationCtx, QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getAuthUserId, ensureUser } from "./authHelpers";

/**
 * Coordinator dashboard queries and mutations
 * All functions require coordinator role
 */

/**
 * Check if current user is a coordinator (for queries)
 */
async function getCoordinatorProfile(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    return null;
  }

  const profile = await ctx.db
    .query("familyProfiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .first();

  if (!profile?.isAdmin) {
    return null;
  }

  return profile;
}

/**
 * Check if current user is a coordinator (for mutations)
 */
async function requireCoordinator(ctx: MutationCtx) {
  const userId = await ensureUser(ctx);
  if (!userId) {
    throw new Error("Unauthorized: Must be logged in");
  }

  const profile = await ctx.db
    .query("familyProfiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .first();

  if (!profile?.isAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }

  return profile;
}

/**
 * Get dashboard stats
 */
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getCoordinatorProfile(ctx);
    if (!profile) return null;

    const now = Date.now();
    const today = new Date().toISOString().split("T")[0];
    const nextWeek = new Date(now + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    // Get upcoming slots
    const upcomingSlots = await ctx.db
      .query("visitSlots")
      .withIndex("by_date")
      .filter((q) =>
        q.and(q.gte(q.field("date"), today), q.lte(q.field("date"), nextWeek))
      )
      .collect();

    const booked = upcomingSlots.filter((s) => s.bookedBy).length;

    // Get all profiles for activity stats
    const profiles = await ctx.db.query("familyProfiles").collect();
    const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;
    const activeMembers = profiles.filter(
      (p) => p.lastVisit && p.lastVisit > twoWeeksAgo
    ).length;

    // Get notification stats
    const pendingNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const failedNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_status", (q) => q.eq("status", "failed"))
      .collect();

    return {
      upcomingWeek: {
        totalSlots: 7 * 3,
        booked,
        coverage: Math.round((booked / (7 * 3)) * 100),
      },
      familyActivity: {
        totalMembers: profiles.length,
        activeMembers,
        inactiveMembers: profiles.length - activeMembers,
      },
      notifications: {
        pending: pendingNotifications.length,
        failed: failedNotifications.length,
      },
    };
  },
});

/**
 * Get gap analysis for upcoming days
 */
export const getGaps = query({
  args: {
    daysAhead: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const profile = await getCoordinatorProfile(ctx);
    if (!profile) return [];

    const daysAhead = args.daysAhead || 14;
    const dates: string[] = [];
    const today = new Date();

    for (let i = 0; i < daysAhead; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split("T")[0]);
    }

    const startDate = dates[0];
    const endDate = dates[dates.length - 1];

    const slots = await ctx.db
      .query("visitSlots")
      .withIndex("by_date")
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), startDate),
          q.lte(q.field("date"), endDate)
        )
      )
      .collect();

    // Enrich with profile data
    const enrichedSlots = await Promise.all(
      slots.map(async (slot) => {
        const bookerProfile = slot.bookedBy
          ? await ctx.db.get(slot.bookedBy)
          : null;
        return { ...slot, bookedByProfile: bookerProfile };
      })
    );

    // Build day-by-day analysis
    const dayNames = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

    return dates.map((dateStr) => {
      const date = new Date(dateStr + "T12:00:00");
      const dayOfWeek = date.getDay();
      const isShabbat = dayOfWeek === 5 || dayOfWeek === 6;

      const daySlots = enrichedSlots.filter((s) => s.date === dateStr);

      const slotMap = {
        morning: daySlots.find((s) => s.slot === "morning") || null,
        afternoon: daySlots.find((s) => s.slot === "afternoon") || null,
        evening: daySlots.find((s) => s.slot === "evening") || null,
      };

      const bookedCount = Object.values(slotMap).filter(
        (s) => s?.bookedBy
      ).length;

      return {
        date: dateStr,
        displayDate: `יום ${dayNames[dayOfWeek]} ${date.getDate()}/${date.getMonth() + 1}`,
        isShabbat,
        isGap: !isShabbat && bookedCount === 0,
        coverage: isShabbat ? null : bookedCount,
        slots: slotMap,
      };
    });
  },
});

/**
 * Get all family members with activity stats
 */
export const getFamilyMembers = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getCoordinatorProfile(ctx);
    if (!profile) return [];

    const profiles = await ctx.db.query("familyProfiles").collect();
    const now = Date.now();

    // Count bookings per member
    const slots = await ctx.db.query("visitSlots").collect();
    const bookingCounts: Record<string, number> = {};
    for (const slot of slots) {
      if (slot.bookedBy) {
        bookingCounts[slot.bookedBy] = (bookingCounts[slot.bookedBy] || 0) + 1;
      }
    }

    return profiles.map((p) => ({
      ...p,
      totalBookings: bookingCounts[p._id] || 0,
      daysSinceLastVisit: p.lastVisit
        ? Math.floor((now - p.lastVisit) / (24 * 60 * 60 * 1000))
        : null,
      isActive: Boolean(p.lastVisit && now - p.lastVisit < 14 * 24 * 60 * 60 * 1000),
    }));
  },
});

/**
 * Book slot on behalf of a family member (coordinator only)
 */
export const bookForMember = mutation({
  args: {
    profileId: v.id("familyProfiles"),
    date: v.string(),
    slot: v.union(
      v.literal("morning"),
      v.literal("afternoon"),
      v.literal("evening")
    ),
    hebrewDate: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireCoordinator(ctx);

    // Check for existing booking
    const existingSlot = await ctx.db
      .query("visitSlots")
      .withIndex("by_date_slot", (q) =>
        q.eq("date", args.date).eq("slot", args.slot)
      )
      .unique();

    if (existingSlot?.bookedBy) {
      throw new Error("Slot already booked");
    }

    // Check Shabbat
    const dateObj = new Date(args.date);
    const dayOfWeek = dateObj.getUTCDay();
    if (
      (dayOfWeek === 5 && args.slot === "evening") ||
      dayOfWeek === 6
    ) {
      throw new Error("Cannot book during Shabbat");
    }

    // Create or update slot
    if (existingSlot) {
      await ctx.db.patch(existingSlot._id, {
        bookedBy: args.profileId,
        bookedAt: Date.now(),
        notes: args.notes,
      });
      return existingSlot._id;
    }

    return await ctx.db.insert("visitSlots", {
      date: args.date,
      slot: args.slot,
      hebrewDate: args.hebrewDate,
      bookedBy: args.profileId,
      bookedAt: Date.now(),
      notes: args.notes,
      isShabbat: false,
      isHoliday: false,
    });
  },
});

/**
 * Cancel any booking (coordinator only)
 */
export const cancelAnyBooking = mutation({
  args: {
    slotId: v.id("visitSlots"),
  },
  handler: async (ctx, args) => {
    await requireCoordinator(ctx);

    const slot = await ctx.db.get(args.slotId);
    if (!slot) {
      throw new Error("Slot not found");
    }

    await ctx.db.patch(args.slotId, {
      bookedBy: undefined,
      bookedAt: undefined,
      notes: undefined,
    });

    return { success: true };
  },
});

/**
 * Get notification history (coordinator only)
 */
export const getNotificationHistory = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(
      v.union(v.literal("pending"), v.literal("sent"), v.literal("failed"))
    ),
  },
  handler: async (ctx, args) => {
    const profile = await getCoordinatorProfile(ctx);
    if (!profile) return [];

    let notifications;
    if (args.status) {
      notifications = await ctx.db
        .query("notifications")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(args.limit || 50);
    } else {
      notifications = await ctx.db
        .query("notifications")
        .order("desc")
        .take(args.limit || 50);
    }

    // Enrich with profile data
    return await Promise.all(
      notifications.map(async (n) => {
        const userProfile = await ctx.db.get(n.userId);
        return { ...n, userProfile };
      })
    );
  },
});
