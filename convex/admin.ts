import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
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
 * Generate a unique invite code (8 characters, alphanumeric)
 */
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

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
 * Returns the invite link to be copied to clipboard
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
      // Return existing invite code
      return {
        inviteId: existingInvite._id,
        inviteCode: existingInvite.inviteCode,
        isExisting: true,
      };
    }

    // Check if user already exists
    const existingProfile = await ctx.db
      .query("familyProfiles")
      .withIndex("by_phone", (q) => q.eq("phone", phone))
      .first();

    if (existingProfile) {
      throw new Error("משתמש עם מספר זה כבר קיים במערכת");
    }

    // Generate unique invite code
    let inviteCode = generateInviteCode();

    // Ensure code is unique
    let existingCode = await ctx.db
      .query("invites")
      .withIndex("by_inviteCode", (q) => q.eq("inviteCode", inviteCode))
      .first();

    while (existingCode) {
      inviteCode = generateInviteCode();
      existingCode = await ctx.db
        .query("invites")
        .withIndex("by_inviteCode", (q) => q.eq("inviteCode", inviteCode))
        .first();
    }

    // Create invite record
    const inviteId = await ctx.db.insert("invites", {
      phone,
      name: args.name,
      relationship: args.relationship,
      status: "pending",
      invitedBy: adminProfileId,
      invitedAt: Date.now(),
      inviteCode,
    });

    return {
      inviteId,
      inviteCode,
      isExisting: false,
    };
  },
});

/**
 * Get invite by code (for invite acceptance page)
 */
export const getInviteByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_inviteCode", (q) => q.eq("inviteCode", args.code))
      .first();

    if (!invite) {
      return null;
    }

    // Don't expose sensitive fields
    return {
      _id: invite._id,
      name: invite.name,
      relationship: invite.relationship,
      status: invite.status,
      isAdminInvite: invite.isAdminInvite,
    };
  },
});

/**
 * Get invite by ID (internal - for mutations)
 */
export const getInviteByIdInternal = internalQuery({
  args: { inviteId: v.id("invites") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.inviteId);
  },
});

/**
 * Get profile by ID (internal)
 */
export const getProfileByIdInternal = internalQuery({
  args: { profileId: v.id("familyProfiles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.profileId);
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
 * Regenerate invite code (for resending)
 */
export const regenerateInviteCode = mutation({
  args: {
    inviteId: v.id("invites"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Generate new unique code
    let inviteCode = generateInviteCode();
    let existingCode = await ctx.db
      .query("invites")
      .withIndex("by_inviteCode", (q) => q.eq("inviteCode", inviteCode))
      .first();

    while (existingCode) {
      inviteCode = generateInviteCode();
      existingCode = await ctx.db
        .query("invites")
        .withIndex("by_inviteCode", (q) => q.eq("inviteCode", inviteCode))
        .first();
    }

    await ctx.db.patch(args.inviteId, {
      inviteCode,
      status: "pending",
      error: undefined,
      invitedAt: Date.now(),
    });

    return { inviteCode };
  },
});

/**
 * Delete invite by ID (internal - for debugging/seeding)
 */
export const deleteInviteInternal = internalMutation({
  args: { inviteId: v.id("invites") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.inviteId);
    return { deleted: true };
  },
});

/**
 * Seed the initial admin (used by seed script)
 * Returns the invite code for generating the link
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
      return { inviteId: existing._id, inviteCode: existing.inviteCode, isExisting: true };
    }

    // Generate unique invite code
    let inviteCode = generateInviteCode();
    let existingCode = await ctx.db
      .query("invites")
      .withIndex("by_inviteCode", (q) => q.eq("inviteCode", inviteCode))
      .first();

    while (existingCode) {
      inviteCode = generateInviteCode();
      existingCode = await ctx.db
        .query("invites")
        .withIndex("by_inviteCode", (q) => q.eq("inviteCode", inviteCode))
        .first();
    }

    // Create invite for seed admin (with admin flag)
    const inviteId = await ctx.db.insert("invites", {
      phone,
      name: args.name,
      relationship: args.relationship,
      status: "pending",
      invitedAt: Date.now(),
      isAdminInvite: true, // Seed admin becomes admin on accept
      inviteCode,
    });

    return { inviteId, inviteCode, isExisting: false };
  },
});

/**
 * Mark invite as accepted (called after successful registration)
 */
export const markInviteAccepted = internalMutation({
  args: { inviteId: v.id("invites") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.inviteId, {
      status: "accepted",
      acceptedAt: Date.now(),
    });
  },
});
