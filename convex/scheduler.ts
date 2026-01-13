import { internalAction, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Scheduler functions for automated tasks
 * - Gap detection: Alert when days have no visits scheduled
 * - Activity nudges: Remind inactive family members
 */

// Days to look ahead for gap detection
const GAP_DETECTION_DAYS = 7;

// Days since last visit to consider inactive
const INACTIVE_THRESHOLD_DAYS = 14;

/**
 * Get dates for the next N days
 */
function getNextNDays(days: number): string[] {
  const dates: string[] = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date.toISOString().split("T")[0]);
  }

  return dates;
}

/**
 * Check if a date is Shabbat (Friday evening or Saturday)
 */
function isShabbatDate(dateStr: string): boolean {
  const date = new Date(dateStr + "T12:00:00");
  const day = date.getDay();
  return day === 5 || day === 6; // Friday or Saturday
}

/**
 * Format date for Hebrew display
 */
function formatDateHebrew(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  const dayNames = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
  const day = date.getDate();
  const month = date.getMonth() + 1;
  return `יום ${dayNames[date.getDay()]} ${day}/${month}`;
}

/**
 * Get schedule coverage for upcoming days
 */
export const getScheduleCoverage = internalQuery({
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

    // Group by date
    const coverage: Record<
      string,
      { morning: boolean; afternoon: boolean; evening: boolean }
    > = {};

    for (const slot of slots) {
      if (!coverage[slot.date]) {
        coverage[slot.date] = { morning: false, afternoon: false, evening: false };
      }
      if (slot.bookedBy) {
        coverage[slot.date][slot.slot] = true;
      }
    }

    return coverage;
  },
});

/**
 * Get inactive family members
 */
export const getInactiveMembers = internalQuery({
  args: {
    thresholdDays: v.number(),
  },
  handler: async (ctx, args) => {
    const cutoffTime = Date.now() - args.thresholdDays * 24 * 60 * 60 * 1000;

    const profiles = await ctx.db.query("familyProfiles").collect();

    return profiles.filter((profile) => {
      // Skip coordinators for activity nudges (they're managing, not visiting)
      if (profile.isAdmin) {
        return false;
      }

      // Never visited or visited before threshold
      return !profile.lastVisit || profile.lastVisit < cutoffTime;
    });
  },
});

/**
 * Detect gaps in the schedule and alert coordinators
 */
export const detectGaps = internalAction({
  args: {},
  handler: async (ctx) => {
    const dates = getNextNDays(GAP_DETECTION_DAYS);
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];

    const coverage = await ctx.runQuery(internal.scheduler.getScheduleCoverage, {
      startDate,
      endDate,
    });

    const gaps: string[] = [];

    for (const dateStr of dates) {
      // Skip Shabbat
      if (isShabbatDate(dateStr)) {
        continue;
      }

      const dayCoverage = coverage[dateStr];

      // If no slots booked at all for this day
      if (
        !dayCoverage ||
        (!dayCoverage.morning && !dayCoverage.afternoon && !dayCoverage.evening)
      ) {
        gaps.push(dateStr);
      }
    }

    // Alert coordinators about gaps
    let alertsSent = 0;
    for (const gapDate of gaps) {
      await ctx.runMutation(internal.notifications.queueGapAlert, {
        date: gapDate,
        hebrewDate: formatDateHebrew(gapDate),
      });
      alertsSent++;
    }

    return {
      datesChecked: dates.length,
      gapsFound: gaps.length,
      alertsSent,
      gaps,
    };
  },
});

/**
 * Send weekly nudges to inactive family members
 */
export const weeklyActivityNudge = internalAction({
  args: {},
  handler: async (ctx): Promise<{ inactiveMembersFound: number; nudgesSent: number }> => {
    const inactiveMembers = await ctx.runQuery(
      internal.scheduler.getInactiveMembers,
      { thresholdDays: INACTIVE_THRESHOLD_DAYS }
    ) as Array<{ _id: Id<"familyProfiles">; name: string; lastVisit?: number }>;

    let nudgesSent = 0;

    for (const member of inactiveMembers) {
      const daysSinceVisit = member.lastVisit
        ? Math.floor((Date.now() - member.lastVisit) / (24 * 60 * 60 * 1000))
        : "לא מתועד";

      await ctx.runMutation(internal.notifications.queueNotification, {
        userId: member._id,
        type: "nudge",
        scheduledFor: Date.now(),
        message: `שלום ${member.name}! אבא מחכה לביקור שלך. ביקור אחרון: לפני ${daysSinceVisit} ימים`,
      });
      nudgesSent++;
    }

    return {
      inactiveMembersFound: inactiveMembers.length,
      nudgesSent,
    };
  },
});

/**
 * Get coordinator stats for dashboard
 */
export const getCoordinatorStats = internalQuery({
  args: {},
  handler: async (ctx) => {
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

    // Count booked vs empty
    const booked = upcomingSlots.filter((s) => s.bookedBy).length;
    const empty = upcomingSlots.filter((s) => !s.bookedBy).length;

    // Get all profiles for activity stats
    const profiles = await ctx.db.query("familyProfiles").collect();
    const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;
    const activeMembers = profiles.filter(
      (p) => p.lastVisit && p.lastVisit > twoWeeksAgo
    ).length;
    const inactiveMembers = profiles.length - activeMembers;

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
        totalSlots: 7 * 3, // 7 days * 3 slots
        booked,
        empty: 7 * 3 - booked,
        coverage: Math.round((booked / (7 * 3)) * 100),
      },
      familyActivity: {
        totalMembers: profiles.length,
        activeMembers,
        inactiveMembers,
      },
      notifications: {
        pending: pendingNotifications.length,
        failed: failedNotifications.length,
      },
    };
  },
});

/**
 * Get detailed gap analysis
 */
export const getGapAnalysis = internalQuery({
  args: {
    daysAhead: v.number(),
  },
  handler: async (ctx, args) => {
    const dates = getNextNDays(args.daysAhead);
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
        const profile = slot.bookedBy ? await ctx.db.get(slot.bookedBy) : null;
        return { ...slot, bookedByProfile: profile };
      })
    );

    // Build day-by-day analysis
    const analysis = dates.map((dateStr) => {
      const isShabbat = isShabbatDate(dateStr);
      const daySlots = enrichedSlots.filter((s) => s.date === dateStr);

      const slotMap = {
        morning: daySlots.find((s) => s.slot === "morning"),
        afternoon: daySlots.find((s) => s.slot === "afternoon"),
        evening: daySlots.find((s) => s.slot === "evening"),
      };

      const bookedCount = Object.values(slotMap).filter(
        (s) => s?.bookedBy
      ).length;

      return {
        date: dateStr,
        displayDate: formatDateHebrew(dateStr),
        isShabbat,
        isGap: !isShabbat && bookedCount === 0,
        coverage: isShabbat ? null : bookedCount,
        slots: slotMap,
      };
    });

    return analysis;
  },
});
