import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ensureUser, getAuthUserId } from "./authHelpers";

/**
 * Create or update a family profile for the authenticated user
 */
export const createProfile = mutation({
  args: {
    name: v.string(),
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
  },
  handler: async (ctx, args) => {
    const userId = await ensureUser(ctx);
    if (!userId) {
      throw new Error("Unauthorized: Must be logged in to create profile");
    }

    // Check if profile already exists for this user
    const existing = await ctx.db
      .query("familyProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      // Update existing profile
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    // Create new profile
    return await ctx.db.insert("familyProfiles", {
      userId,
      ...args,
    });
  },
});

/**
 * Get the current user's family profile
 */
export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    return await ctx.db
      .query("familyProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
  },
});

/**
 * Get all family member profiles
 */
export const getAllProfiles = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("familyProfiles").collect();
  },
});

/**
 * Get profile by ID
 */
export const getProfile = query({
  args: { profileId: v.id("familyProfiles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.profileId);
  },
});
