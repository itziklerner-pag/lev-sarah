import { v } from "convex/values";
import { mutation, query, action, internalMutation, internalQuery, internalAction } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { getAuthUserId } from "./authHelpers";
import { Id } from "./_generated/dataModel";

const RELATIONSHIP_VALUES = [
  "בן",
  "בת",
  "נכד",
  "נכדה",
  "נינה",
  "קרוב",
  "קרובה",
] as const;

type Relationship = (typeof RELATIONSHIP_VALUES)[number];

/**
 * Check if current user is an admin
 */
async function requireAdmin(ctx: any): Promise<Id<"familyProfiles">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Unauthorized: Must be logged in");
  }

  const profile = await ctx.db
    .query("familyProfiles")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .unique();

  if (!profile || !profile.isAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }

  return profile._id;
}

/**
 * Check if user is admin (for queries)
 */
export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const profile = await ctx.db
      .query("familyProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    return profile?.isAdmin ?? false;
  },
});

/**
 * Get all users for admin management
 */
export const getUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const myProfile = await ctx.db
      .query("familyProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!myProfile?.isAdmin) return null;

    const profiles = await ctx.db.query("familyProfiles").collect();

    // Get profile image URLs
    const profilesWithImages = await Promise.all(
      profiles.map(async (profile) => {
        let imageUrl = null;
        if (profile.profileImage) {
          imageUrl = await ctx.storage.getUrl(profile.profileImage);
        }
        return {
          ...profile,
          imageUrl,
        };
      })
    );

    return profilesWithImages;
  },
});

/**
 * Get all pending invites
 */
export const getInvites = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const myProfile = await ctx.db
      .query("familyProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!myProfile?.isAdmin) return null;

    return await ctx.db.query("invites").order("desc").collect();
  },
});

/**
 * Create an invite for a new family member
 */
export const createInvite = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const adminProfileId = await requireAdmin(ctx);

    // Normalize phone number
    let phone = args.phone.replace(/\D/g, "");
    if (phone.startsWith("0")) {
      phone = "+972" + phone.slice(1);
    } else if (!phone.startsWith("+")) {
      phone = "+" + phone;
    }

    // Check if invite already exists
    const existingInvite = await ctx.db
      .query("invites")
      .withIndex("by_phone", (q) => q.eq("phone", phone))
      .first();

    if (existingInvite && existingInvite.status !== "failed") {
      throw new Error("הזמנה כבר נשלחה למספר זה");
    }

    // Check if user already exists
    const existingProfile = await ctx.db
      .query("familyProfiles")
      .withIndex("by_phone", (q) => q.eq("phone", phone))
      .first();

    if (existingProfile) {
      throw new Error("משתמש עם מספר זה כבר קיים במערכת");
    }

    // Create invite record
    const inviteId = await ctx.db.insert("invites", {
      phone,
      name: args.name,
      relationship: args.relationship,
      status: "pending",
      invitedBy: adminProfileId,
      invitedAt: Date.now(),
    });

    return inviteId;
  },
});

/**
 * Send invite via WhatsApp (internal mutation called after invite created)
 */
export const sendInviteWhatsApp = internalMutation({
  args: {
    inviteId: v.id("invites"),
  },
  handler: async (ctx, args) => {
    const invite = await ctx.db.get(args.inviteId);
    if (!invite) {
      throw new Error("Invite not found");
    }

    // Mark as sent (actual sending happens in action)
    await ctx.db.patch(args.inviteId, {
      status: "sent",
    });
  },
});

/**
 * Mark invite as failed
 */
export const markInviteFailed = internalMutation({
  args: {
    inviteId: v.id("invites"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.inviteId, {
      status: "failed",
      error: args.error,
    });
  },
});

/**
 * Internal action to send invite via WhatsApp (called by public action and seed)
 */
export const sendInviteInternal = internalAction({
  args: {
    inviteId: v.id("invites"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; dev?: boolean; messageId?: string }> => {
    // Get invite details
    const invite = await ctx.runQuery(internal.admin.getInviteByIdInternal, {
      inviteId: args.inviteId,
    });

    if (!invite) {
      throw new Error("Invite not found");
    }

    const twilioSid = process.env.TWILIO_SID;
    const twilioToken = process.env.TWILIO_TOKEN;
    const whatsappSender = process.env.WHATSAPP_SENDER || "+16506102211";

    if (!twilioSid || !twilioToken) {
      // Mark as sent for dev mode without Twilio
      await ctx.runMutation(internal.admin.sendInviteWhatsApp, {
        inviteId: args.inviteId,
      });
      console.log(`[DEV] Would send invite to ${invite.phone}: שלום ${invite.name}!`);
      return { success: true, dev: true };
    }

    try {
      // Send via Twilio WhatsApp
      const message = `שלום ${invite.name}! הוזמנת להצטרף למערכת הביקורים המשפחתית אצל אבא. לחץ כאן להצטרפות: ${process.env.NEXT_PUBLIC_APP_URL || "https://levsarah.vercel.app"}`;

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
          },
          body: new URLSearchParams({
            From: `whatsapp:${whatsappSender}`,
            To: `whatsapp:${invite.phone}`,
            Body: message,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to send WhatsApp message");
      }

      await ctx.runMutation(internal.admin.sendInviteWhatsApp, {
        inviteId: args.inviteId,
      });

      return { success: true, messageId: result.sid };
    } catch (error: any) {
      await ctx.runMutation(internal.admin.markInviteFailed, {
        inviteId: args.inviteId,
        error: error.message || "Unknown error",
      });
      throw error;
    }
  },
});

/**
 * Public action to send invite (wraps internal action)
 */
export const sendInvite = action({
  args: {
    inviteId: v.id("invites"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; dev?: boolean; messageId?: string }> => {
    return await ctx.runAction(internal.admin.sendInviteInternal, args);
  },
});

/**
 * Get invite by ID (internal - for action to use)
 */
export const getInviteByIdInternal = internalQuery({
  args: { inviteId: v.id("invites") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.inviteId);
  },
});

/**
 * Toggle admin status for a user
 */
export const setAdmin = mutation({
  args: {
    profileId: v.id("familyProfiles"),
    isAdmin: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    await ctx.db.patch(args.profileId, {
      isAdmin: args.isAdmin,
    });

    return { success: true };
  },
});

/**
 * Delete a user profile
 */
export const deleteUser = mutation({
  args: {
    profileId: v.id("familyProfiles"),
  },
  handler: async (ctx, args) => {
    const adminProfileId = await requireAdmin(ctx);

    // Can't delete yourself
    if (args.profileId === adminProfileId) {
      throw new Error("לא ניתן למחוק את עצמך");
    }

    // Delete profile image from storage if exists
    const profile = await ctx.db.get(args.profileId);
    if (profile?.profileImage) {
      await ctx.storage.delete(profile.profileImage);
    }

    await ctx.db.delete(args.profileId);

    return { success: true };
  },
});

/**
 * Delete an invite
 */
export const deleteInvite = mutation({
  args: {
    inviteId: v.id("invites"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.inviteId);
    return { success: true };
  },
});

/**
 * Resend an invite
 */
export const resendInvite = mutation({
  args: {
    inviteId: v.id("invites"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    await ctx.db.patch(args.inviteId, {
      status: "pending",
      error: undefined,
      invitedAt: Date.now(),
    });

    return args.inviteId;
  },
});

/**
 * Seed the initial admin (used by seed script)
 */
export const seedAdmin = internalMutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    // Normalize phone
    let phone = args.phone.replace(/\D/g, "");
    if (!phone.startsWith("+")) {
      phone = "+" + phone;
    }

    // Check if already exists
    const existing = await ctx.db
      .query("invites")
      .withIndex("by_phone", (q) => q.eq("phone", phone))
      .first();

    if (existing) {
      console.log("Seed admin invite already exists");
      return existing._id;
    }

    // Create invite for seed admin (with admin flag)
    const inviteId = await ctx.db.insert("invites", {
      phone,
      name: args.name,
      relationship: args.relationship,
      status: "pending",
      invitedAt: Date.now(),
      isAdminInvite: true, // Seed admin becomes admin on accept
    });

    return inviteId;
  },
});

/**
 * Action to seed admin and send invite
 */
export const seedAndInviteAdmin = action({
  args: {
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
  },
  handler: async (ctx, args): Promise<{ success: boolean; inviteId: Id<"invites"> }> => {
    // Create invite
    const inviteId: Id<"invites"> = await ctx.runMutation(internal.admin.seedAdmin, args);

    // Send WhatsApp invite using internal action
    await ctx.runAction(internal.admin.sendInviteInternal, { inviteId });

    return { success: true, inviteId };
  },
});
