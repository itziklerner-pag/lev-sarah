import { v } from "convex/values";
import {
  query,
  mutation,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { alphabet, generateRandomString } from "oslo/crypto";

// Token expiration time in milliseconds (10 minutes)
const TOKEN_EXPIRY_MS = 10 * 60 * 1000;

// Token cleanup threshold (24 hours) - tokens older than this are cleaned up
const TOKEN_CLEANUP_THRESHOLD_MS = 24 * 60 * 60 * 1000;

/**
 * Generate a secure 32-character alphanumeric token
 */
function generateSecureToken(): string {
  return generateRandomString(32, alphabet("a-z", "A-Z", "0-9"));
}

/**
 * Internal mutation: Generate magic link token
 * Creates a new token and invalidates all previous tokens for the phone
 */
export const generateMagicLinkToken = internalMutation({
  args: {
    phone: v.string(),
    returnUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Invalidate all previous tokens for this phone
    const existingTokens = await ctx.db
      .query("magicLinkTokens")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .collect();

    for (const existingToken of existingTokens) {
      await ctx.db.delete(existingToken._id);
    }

    // 2. Generate secure 32-character token
    const token = generateSecureToken();

    // 3. Create new token (expires in 10 minutes)
    const tokenId = await ctx.db.insert("magicLinkTokens", {
      phone: args.phone,
      token,
      expiresAt: Date.now() + TOKEN_EXPIRY_MS,
      used: false,
      returnUrl: args.returnUrl,
      createdAt: Date.now(),
    });

    return { token, tokenId };
  },
});

/**
 * Internal mutation: Store magic link token
 * Used by HTTP endpoint for internal token storage
 * The token itself is used as the verification code (no separate OTP)
 */
export const storeMagicLinkToken = internalMutation({
  args: {
    phone: v.string(),
    token: v.string(),
    expiresAt: v.number(),
    returnUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Invalidate all previous tokens for this phone
    const existingTokens = await ctx.db
      .query("magicLinkTokens")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .collect();

    for (const existingToken of existingTokens) {
      await ctx.db.delete(existingToken._id);
    }

    // Create new token (token itself is the verification code)
    const tokenId = await ctx.db.insert("magicLinkTokens", {
      phone: args.phone,
      token: args.token,
      expiresAt: args.expiresAt,
      used: false,
      returnUrl: args.returnUrl,
      createdAt: Date.now(),
    });

    return { tokenId };
  },
});

/**
 * Query: Validate magic link token
 * Returns validation status and associated phone/returnUrl if valid
 */
export const validateMagicLinkToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const tokenDoc = await ctx.db
      .query("magicLinkTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!tokenDoc) {
      return { valid: false as const, error: "TOKEN_NOT_FOUND" as const };
    }

    if (tokenDoc.used) {
      return { valid: false as const, error: "TOKEN_ALREADY_USED" as const };
    }

    if (Date.now() > tokenDoc.expiresAt) {
      return {
        valid: false as const,
        error: "TOKEN_EXPIRED" as const,
        phone: tokenDoc.phone,
      };
    }

    return {
      valid: true as const,
      phone: tokenDoc.phone,
      returnUrl: tokenDoc.returnUrl,
    };
  },
});

/**
 * Mutation: Consume magic link token for authentication
 * Marks the token as used and returns the phone and returnUrl
 * The client can then call signIn with the token as the verification code
 */
export const consumeMagicLinkToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    // 1. Validate token
    const tokenDoc = await ctx.db
      .query("magicLinkTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!tokenDoc) {
      throw new Error("Invalid token");
    }

    if (tokenDoc.used) {
      throw new Error("Token already used");
    }

    if (Date.now() > tokenDoc.expiresAt) {
      throw new Error("Token expired");
    }

    // 2. Mark token as used immediately (before any other operations)
    await ctx.db.patch(tokenDoc._id, { used: true });

    // 3. Return phone and returnUrl
    // The token itself is used as the verification code with signIn
    return {
      success: true,
      phone: tokenDoc.phone,
      code: tokenDoc.token, // The token is the verification code
      returnUrl: tokenDoc.returnUrl,
    };
  },
});

/**
 * Internal query: Get phone from expired or used token
 * Used for the resend flow when a link has expired
 */
export const getPhoneFromToken = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const tokenDoc = await ctx.db
      .query("magicLinkTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    return tokenDoc?.phone ?? null;
  },
});

/**
 * Internal mutation: Clean up expired tokens
 * Removes tokens that have been expired for more than 24 hours
 * Should be called by a daily cron job
 */
export const cleanupExpiredTokens = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoffTime = Date.now() - TOKEN_CLEANUP_THRESHOLD_MS;

    // Get all tokens that expired more than 24 hours ago
    const expiredTokens = await ctx.db
      .query("magicLinkTokens")
      .withIndex("by_expires")
      .filter((q) => q.lt(q.field("expiresAt"), cutoffTime))
      .collect();

    // Delete expired tokens
    for (const token of expiredTokens) {
      await ctx.db.delete(token._id);
    }

    console.log(`Cleaned up ${expiredTokens.length} expired magic link tokens`);
    return { deleted: expiredTokens.length };
  },
});
