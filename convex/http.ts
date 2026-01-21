import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();

// Token expiration time in milliseconds (10 minutes)
const TOKEN_EXPIRY_MS = 10 * 60 * 1000;

/**
 * Internal endpoint for storing magic link tokens
 * Called by the phone auth provider when sending magic links
 * Protected by X-Internal-Secret header
 */
http.route({
  path: "/api/internal/store-magic-token",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Verify internal secret
    const secret = request.headers.get("X-Internal-Secret");
    const expectedSecret = process.env.INTERNAL_API_SECRET;

    if (!expectedSecret || secret !== expectedSecret) {
      return new Response("Unauthorized", { status: 401 });
    }

    try {
      const body = await request.json();
      const { phone, token, returnUrl } = body as {
        phone: string;
        token: string;
        returnUrl?: string;
      };

      if (!phone || !token) {
        return new Response("Missing phone or token", { status: 400 });
      }

      // Store the magic link token for verification
      await ctx.runMutation(internal.magicLink.storeMagicLinkToken, {
        phone,
        token,
        expiresAt: Date.now() + TOKEN_EXPIRY_MS,
        returnUrl,
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error storing magic link token:", error);
      return new Response("Internal server error", { status: 500 });
    }
  }),
});

// Add Convex Auth HTTP routes
auth.addHttpRoutes(http);

export default http;
