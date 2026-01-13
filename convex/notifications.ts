import { v } from "convex/values";
import { mutation, query, action, internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { getAuthUserId, ensureUser } from "./authHelpers";

/**
 * WhatsApp notification system for visit confirmations, reminders, and alerts
 * Uses Twilio Content API with pre-approved templates
 */

// WhatsApp template SIDs (from constants)
const TEMPLATES = {
  visitConfirmation: "HX5acc3b264e947ebfaf4c0a87d41b67ed",
  visitReminder: "HX922d58d14a871614c1595cd9748d6367",
  gapAlert: "HX92aa09f05f109de0ff8afc3762f9b2f2",
} as const;

// Slot names in Hebrew
const SLOT_NAMES = {
  morning: "בוקר",
  afternoon: "צהריים",
  evening: "ערב",
} as const;

// Day names in Hebrew
const DAY_NAMES = [
  "יום ראשון",
  "יום שני",
  "יום שלישי",
  "יום רביעי",
  "יום חמישי",
  "יום שישי",
  "שבת",
] as const;

/**
 * Queue a notification for sending
 */
export const queueNotification = internalMutation({
  args: {
    userId: v.id("familyProfiles"),
    type: v.union(
      v.literal("reminder"),
      v.literal("confirmation"),
      v.literal("gap_alert"),
      v.literal("nudge")
    ),
    scheduledFor: v.number(),
    visitSlotId: v.optional(v.id("visitSlots")),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      status: "pending",
      scheduledFor: args.scheduledFor,
      visitSlotId: args.visitSlotId,
      message: args.message,
    });
  },
});

/**
 * Mark notification as sent
 */
export const markNotificationSent = internalMutation({
  args: {
    notificationId: v.id("notifications"),
    twilioMessageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, {
      status: "sent",
      twilioMessageId: args.twilioMessageId,
      sentAt: Date.now(),
    });
  },
});

/**
 * Mark notification as failed
 */
export const markNotificationFailed = internalMutation({
  args: {
    notificationId: v.id("notifications"),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, {
      status: "failed",
      error: args.error,
    });
  },
});

/**
 * Get pending notifications ready to send
 */
export const getPendingNotifications = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const pending = await ctx.db
      .query("notifications")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .filter((q) => q.lte(q.field("scheduledFor"), now))
      .take(50);

    // Enrich with user profile data
    return await Promise.all(
      pending.map(async (notification) => {
        const profile = await ctx.db.get(notification.userId);
        const visitSlot = notification.visitSlotId
          ? await ctx.db.get(notification.visitSlotId)
          : null;
        return { ...notification, profile, visitSlot };
      })
    );
  },
});

/**
 * Queue a booking confirmation notification
 */
export const queueBookingConfirmation = internalMutation({
  args: {
    profileId: v.id("familyProfiles"),
    slotId: v.id("visitSlots"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      userId: args.profileId,
      type: "confirmation",
      status: "pending",
      scheduledFor: Date.now(), // Send immediately
      visitSlotId: args.slotId,
    });
  },
});

/**
 * Queue a reminder notification (24h before visit)
 */
export const queueReminder = internalMutation({
  args: {
    profileId: v.id("familyProfiles"),
    slotId: v.id("visitSlots"),
    scheduledFor: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if reminder already exists for this slot
    const existing = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.profileId))
      .filter((q) =>
        q.and(
          q.eq(q.field("type"), "reminder"),
          q.eq(q.field("visitSlotId"), args.slotId)
        )
      )
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("notifications", {
      userId: args.profileId,
      type: "reminder",
      status: "pending",
      scheduledFor: args.scheduledFor,
      visitSlotId: args.slotId,
    });
  },
});

/**
 * Queue a gap alert for coordinators
 */
export const queueGapAlert = internalMutation({
  args: {
    date: v.string(),
    hebrewDate: v.string(),
  },
  handler: async (ctx, args) => {
    // Get all coordinators
    const coordinators = await ctx.db
      .query("familyProfiles")
      .filter((q) => q.eq(q.field("isAdmin"), true))
      .collect();

    // Queue alert for each coordinator
    const notificationIds: Id<"notifications">[] = [];
    for (const coordinator of coordinators) {
      const id = await ctx.db.insert("notifications", {
        userId: coordinator._id,
        type: "gap_alert",
        status: "pending",
        scheduledFor: Date.now(),
        message: args.date, // Store date in message for gap alerts
      });
      notificationIds.push(id);
    }

    return notificationIds;
  },
});

/**
 * Send WhatsApp message via Twilio
 * This is an internal action because it makes external HTTP requests
 */
export const sendWhatsAppMessage = internalAction({
  args: {
    phone: v.string(),
    templateSid: v.string(),
    // Content variables as JSON string since Convex doesn't allow numeric keys
    contentVariablesJson: v.string(),
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const twilioSid = process.env.TWILIO_SID;
    const twilioToken = process.env.TWILIO_TOKEN;
    const whatsappSender = process.env.WHATSAPP_SENDER || "+16506102211";

    if (!twilioSid || !twilioToken) {
      console.error("Twilio credentials not configured");
      await ctx.runMutation(internal.notifications.markNotificationFailed, {
        notificationId: args.notificationId,
        error: "Twilio credentials not configured",
      });
      return { success: false, error: "Twilio credentials not configured" };
    }

    const formattedPhone = args.phone.startsWith("+")
      ? args.phone
      : `+${args.phone}`;

    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            From: `whatsapp:${whatsappSender}`,
            To: `whatsapp:${formattedPhone}`,
            ContentSid: args.templateSid,
            ContentVariables: args.contentVariablesJson,
          }),
        }
      );

      const result = await response.json();

      if (response.ok && result.sid) {
        await ctx.runMutation(internal.notifications.markNotificationSent, {
          notificationId: args.notificationId,
          twilioMessageId: result.sid,
        });
        return { success: true, messageSid: result.sid };
      } else {
        const errorMessage = result.message || "Unknown Twilio error";
        await ctx.runMutation(internal.notifications.markNotificationFailed, {
          notificationId: args.notificationId,
          error: errorMessage,
        });
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Network error";
      await ctx.runMutation(internal.notifications.markNotificationFailed, {
        notificationId: args.notificationId,
        error: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  },
});

/**
 * Process and send pending notifications
 * Called by scheduled cron job
 */
export const processPendingNotifications = internalAction({
  args: {},
  handler: async (ctx): Promise<{ processed: number; sent: number; failed: number }> => {
    const pending = await ctx.runQuery(
      internal.notifications.getPendingNotifications
    ) as Array<{
      _id: Id<"notifications">;
      type: "reminder" | "confirmation" | "gap_alert" | "nudge";
      message?: string;
      profile: { name: string; phone: string } | null;
      visitSlot: { date: string; slot: "morning" | "afternoon" | "evening" } | null;
    }>;

    let sent = 0;
    let failed = 0;

    for (const notification of pending) {
      if (!notification.profile?.phone) {
        await ctx.runMutation(internal.notifications.markNotificationFailed, {
          notificationId: notification._id,
          error: "No phone number",
        });
        failed++;
        continue;
      }

      let templateSid: string;
      let contentVariables: { "1"?: string; "2"?: string; "3"?: string } = {};

      switch (notification.type) {
        case "confirmation":
          templateSid = TEMPLATES.visitConfirmation;
          if (notification.visitSlot) {
            const slotDate = new Date(notification.visitSlot.date + "T12:00:00");
            contentVariables = {
              "1": notification.profile.name,
              "2": DAY_NAMES[slotDate.getDay()],
              "3": SLOT_NAMES[notification.visitSlot.slot as keyof typeof SLOT_NAMES],
            };
          }
          break;

        case "reminder":
          templateSid = TEMPLATES.visitReminder;
          if (notification.visitSlot) {
            contentVariables = {
              "1": SLOT_NAMES[notification.visitSlot.slot as keyof typeof SLOT_NAMES],
            };
          }
          break;

        case "gap_alert":
          templateSid = TEMPLATES.gapAlert;
          contentVariables = {
            "1": notification.message || "תאריך לא ידוע",
          };
          break;

        case "nudge":
          // Nudges use the gap alert template with custom message
          templateSid = TEMPLATES.gapAlert;
          contentVariables = {
            "1": notification.message || "בבקשה להירשם לביקור",
          };
          break;

        default:
          await ctx.runMutation(internal.notifications.markNotificationFailed, {
            notificationId: notification._id,
            error: "Unknown notification type",
          });
          failed++;
          continue;
      }

      const result = await ctx.runAction(
        internal.notifications.sendWhatsAppMessage,
        {
          phone: notification.profile.phone,
          templateSid,
          contentVariablesJson: JSON.stringify(contentVariables),
          notificationId: notification._id,
        }
      );

      if (result.success) {
        sent++;
      } else {
        failed++;
      }
    }

    return { processed: pending.length, sent, failed };
  },
});

/**
 * Get notification history for a user
 */
export const getMyNotifications = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const profile = await ctx.db
      .query("familyProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!profile) return [];

    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", profile._id))
      .order("desc")
      .take(20);
  },
});

/**
 * Get all notifications (for coordinators)
 */
export const getAllNotifications = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(
      v.union(v.literal("pending"), v.literal("sent"), v.literal("failed"))
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Check if user is coordinator
    const profile = await ctx.db
      .query("familyProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!profile?.isAdmin) return [];

    let notifications;
    if (args.status) {
      notifications = await ctx.db
        .query("notifications")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(args.limit || 100);
    } else {
      notifications = await ctx.db
        .query("notifications")
        .order("desc")
        .take(args.limit || 100);
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

/**
 * Send a nudge to a family member (coordinator only)
 */
export const sendNudge = mutation({
  args: {
    targetUserId: v.id("familyProfiles"),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await ensureUser(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Check if sender is coordinator
    const senderProfile = await ctx.db
      .query("familyProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!senderProfile?.isAdmin) {
      throw new Error("Only coordinators can send nudges");
    }

    // Queue the nudge notification
    return await ctx.db.insert("notifications", {
      userId: args.targetUserId,
      type: "nudge",
      status: "pending",
      scheduledFor: Date.now(),
      message: args.message || "אבא מחכה לביקור שלך!",
    });
  },
});

/**
 * Cancel a pending notification
 */
export const cancelNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    if (notification.status !== "pending") {
      throw new Error("Can only cancel pending notifications");
    }

    await ctx.db.delete(args.notificationId);
    return { success: true };
  },
});
