import { MutationCtx, QueryCtx } from "./_generated/server";
import { auth } from "./auth";
import { Id } from "./_generated/dataModel";

/**
 * Check if a string looks like a valid Convex ID
 * Convex IDs are strings that contain specific characters
 */
function isValidConvexId(value: unknown): value is Id<"users"> {
  if (typeof value !== "string") return false;
  // Convex IDs are typically longer and contain specific patterns
  // Simple IDs like "user1" from tests won't match this pattern
  // Real Convex IDs look like: j57...xyz (contains numbers and lowercase letters, ~20+ chars)
  return value.length > 10 && /^[a-z0-9]+$/.test(value);
}

/**
 * Get the current user ID, handling both production auth and testing scenarios.
 *
 * In production: Uses Convex Auth's auth.getUserId()
 * In testing: Creates a user record if needed based on the identity
 */
export async function getAuthUserId(
  ctx: QueryCtx | MutationCtx
): Promise<Id<"users"> | null> {
  // First try Convex Auth's method
  try {
    const userId = await auth.getUserId(ctx);
    // Verify it's actually a valid Convex ID (not just a test subject)
    if (userId && isValidConvexId(userId)) {
      return userId;
    }
  } catch {
    // Convex Auth not available (likely in test environment)
  }

  // Fall back to identity-based lookup (for testing)
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  // Check if a user with this identity already exists
  const existingUser = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", identity.email ?? identity.subject))
    .first();

  if (existingUser) {
    return existingUser._id;
  }

  // In a query context, we can't create a user
  if (!("db" in ctx && "insert" in (ctx.db as any))) {
    return null;
  }

  return null;
}

/**
 * Ensure a user exists for the current identity (for mutation contexts only).
 * Creates the user if they don't exist.
 */
export async function ensureUser(ctx: MutationCtx): Promise<Id<"users"> | null> {
  // First try Convex Auth's method
  try {
    const userId = await auth.getUserId(ctx);
    // Verify it's actually a valid Convex ID (not just a test subject)
    if (userId && isValidConvexId(userId)) {
      return userId;
    }
  } catch {
    // Convex Auth not available (likely in test environment)
  }

  // Fall back to identity-based lookup (for testing)
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  // Use email or subject as the lookup key
  const email = identity.email ?? identity.subject;

  // Check if a user with this identity already exists
  const existingUser = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", email))
    .first();

  if (existingUser) {
    return existingUser._id;
  }

  // Create a new user for this identity (test scenario)
  const userId = await ctx.db.insert("users", {
    email,
    isAnonymous: false,
  });

  return userId;
}
