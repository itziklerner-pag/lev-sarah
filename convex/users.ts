import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ensureUser, getAuthUserId } from "./authHelpers";

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

    const profile = await ctx.db
      .query("familyProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) {
      return null;
    }

    // Get profile image URL if exists
    let imageUrl = null;
    if (profile.profileImage) {
      imageUrl = await ctx.storage.getUrl(profile.profileImage);
    }

    return {
      ...profile,
      imageUrl,
    };
  },
});

/**
 * Extract phone number from identity subject
 * Handles formats like "phone:+1234567890" or "whatsapp-phone:+1234567890"
 */
function extractPhoneFromSubject(subject: string | undefined): string | null {
  if (!subject) return null;

  // Try different formats
  if (subject.startsWith("phone:")) {
    return subject.replace("phone:", "");
  }
  if (subject.startsWith("whatsapp-phone:")) {
    return subject.replace("whatsapp-phone:", "");
  }
  // Generic format: providerId:identifier
  if (subject.includes(":")) {
    const parts = subject.split(":");
    const identifier = parts.slice(1).join(":"); // Handle phone numbers with + sign
    // Check if it looks like a phone number
    if (identifier.startsWith("+") || /^\d+$/.test(identifier)) {
      return identifier.startsWith("+") ? identifier : `+${identifier}`;
    }
  }
  return null;
}

/**
 * Generate all possible phone number variants for matching
 */
function getPhoneVariants(phone: string): string[] {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, "");

  const variants = new Set<string>();

  // Add the raw digits
  variants.add(digits);

  // Add with + prefix
  variants.add(`+${digits}`);

  // Handle Israeli numbers (972)
  if (digits.startsWith("972")) {
    const withoutCountry = digits.slice(3);
    variants.add(withoutCountry);
    variants.add(`0${withoutCountry}`);
    variants.add(`+972${withoutCountry}`);
  }

  // Handle numbers starting with 0 (Israeli local format)
  if (digits.startsWith("0")) {
    const withoutZero = digits.slice(1);
    variants.add(withoutZero);
    variants.add(`972${withoutZero}`);
    variants.add(`+972${withoutZero}`);
  }

  // Handle US numbers (1)
  if (digits.startsWith("1") && digits.length === 11) {
    variants.add(digits.slice(1));
    variants.add(`+${digits}`);
  }

  return Array.from(variants);
}

/**
 * Check if there's a pending invite for the authenticated user's phone
 */
export const checkInvite = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const phone = extractPhoneFromSubject(identity.subject);
    if (!phone) {
      // Try to get phone from authAccounts table
      const subjectParts = identity.subject.split("|");
      const authUserId = subjectParts[0];

      const authAccount = await ctx.db
        .query("authAccounts")
        .filter((q) => q.eq(q.field("userId"), authUserId))
        .first();

      if (!authAccount) {
        console.log("checkInvite: No auth account found");
        return null;
      }

      const accountPhone = (authAccount as any).providerAccountId || (authAccount as any).phoneVerified;
      if (!accountPhone) {
        console.log("checkInvite: No phone in auth account");
        return null;
      }

      // Use phone from auth account
      const phoneVariants = getPhoneVariants(accountPhone);
      console.log(`checkInvite: Checking variants for ${accountPhone}: ${phoneVariants.join(", ")}`);

      for (const variant of phoneVariants) {
        const invite = await ctx.db
          .query("invites")
          .withIndex("by_phone", (q) => q.eq("phone", variant))
          .first();
        if (invite) {
          console.log(`checkInvite: Found invite with phone ${variant}`);
          return invite;
        }
      }

      console.log("checkInvite: No invite found for any variant");
      return null;
    }

    // Use phone variants for matching
    const phoneVariants = getPhoneVariants(phone);
    console.log(`checkInvite: Checking variants for ${phone}: ${phoneVariants.join(", ")}`);

    for (const variant of phoneVariants) {
      const invite = await ctx.db
        .query("invites")
        .withIndex("by_phone", (q) => q.eq("phone", variant))
        .first();
      if (invite) {
        console.log(`checkInvite: Found invite with phone ${variant}`);
        return invite;
      }
    }

    console.log("checkInvite: No invite found for any variant");
    return null;
  },
});

/**
 * Accept invite and create profile (called on first login)
 */
export const acceptInvite = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await ensureUser(ctx);
    if (!userId) {
      throw new Error("Unauthorized: Must be logged in");
    }

    // Get phone from identity
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("No identity found");
    }

    // Get phone from authAccounts table
    // The subject format is: "userId|sessionId"
    const subjectParts = identity.subject.split("|");
    const authUserId = subjectParts[0];

    // Look up the auth account to get the phone number
    const authAccount = await ctx.db
      .query("authAccounts")
      .filter((q) => q.eq(q.field("userId"), authUserId))
      .first();

    if (!authAccount) {
      throw new Error("Auth account not found");
    }

    // Get phone from providerAccountId or phoneVerified
    let phone = (authAccount as any).providerAccountId || (authAccount as any).phoneVerified;

    if (!phone) {
      throw new Error("Could not extract phone number from auth account");
    }

    // Normalize phone format
    if (!phone.startsWith("+")) {
      phone = "+" + phone;
    }

    // Find invite
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_phone", (q) => q.eq("phone", phone))
      .first();

    if (!invite) {
      throw new Error("לא נמצאה הזמנה עבור מספר זה");
    }

    // Check if profile already exists
    const existingProfile = await ctx.db
      .query("familyProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (existingProfile) {
      return existingProfile._id;
    }

    // Create profile from invite
    const profileId = await ctx.db.insert("familyProfiles", {
      userId,
      name: invite.name,
      phone: invite.phone,
      relationship: invite.relationship,
      isAdmin: invite.isAdminInvite ?? false, // Seed admin gets admin rights
      profileCompleted: false,
    });

    // Mark invite as accepted
    await ctx.db.patch(invite._id, {
      status: "accepted",
      acceptedAt: Date.now(),
    });

    return profileId;
  },
});

/**
 * Generate upload URL for profile image
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Complete profile with uploaded image
 */
export const completeProfile = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const profile = await ctx.db
      .query("familyProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) {
      throw new Error("Profile not found");
    }

    // Delete old image if exists
    if (profile.profileImage) {
      await ctx.storage.delete(profile.profileImage);
    }

    // Update profile with new image
    await ctx.db.patch(profile._id, {
      profileImage: args.storageId,
      profileCompleted: true,
    });

    return { success: true };
  },
});

/**
 * Update profile name/hebrewName
 */
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    hebrewName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const profile = await ctx.db
      .query("familyProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) {
      throw new Error("Profile not found");
    }

    const updates: Record<string, string> = {};
    if (args.name) updates.name = args.name;
    if (args.hebrewName) updates.hebrewName = args.hebrewName;

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(profile._id, updates);
    }

    return { success: true };
  },
});

/**
 * Get all family member profiles (with images)
 */
export const getAllProfiles = query({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("familyProfiles").collect();

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
 * Get profile by ID
 */
export const getProfile = query({
  args: { profileId: v.id("familyProfiles") },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) return null;

    let imageUrl = null;
    if (profile.profileImage) {
      imageUrl = await ctx.storage.getUrl(profile.profileImage);
    }

    return {
      ...profile,
      imageUrl,
    };
  },
});
