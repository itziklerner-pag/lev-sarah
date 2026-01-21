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

/**
 * Twilio WhatsApp Webhook
 * Receives incoming WhatsApp messages and processes them
 */
http.route({
  path: "/api/whatsapp/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      // Parse form data from Twilio
      const formData = await request.formData();
      const from = formData.get("From") as string;
      const body = formData.get("Body") as string;
      const messageSid = formData.get("MessageSid") as string;

      console.log(`WhatsApp webhook received: From=${from}, Body=${body}, SID=${messageSid}`);

      if (!from || !body) {
        return new Response("Missing required fields", { status: 400 });
      }

      const phone = from.replace("whatsapp:", "");

      // Check if this is an admin response (approval/rejection)
      const isAdminCommand = body.trim().startsWith("אשר") || body.trim().startsWith("דחה");

      if (isAdminCommand) {
        // Handle admin approval/rejection
        await ctx.runAction(internal.whatsappWebhook.handleAdminResponse, {
          from,
          body,
        });
      } else {
        // Handle regular user message
        await ctx.runAction(internal.whatsappWebhook.handleIncomingWhatsApp, {
          from,
          body,
        });
      }

      // Return TwiML response (empty is fine for WhatsApp)
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        {
          status: 200,
          headers: { "Content-Type": "application/xml" },
        }
      );
    } catch (error) {
      console.error("WhatsApp webhook error:", error);
      return new Response("Internal server error", { status: 500 });
    }
  }),
});

/**
 * Twilio WhatsApp Webhook - GET for verification
 */
http.route({
  path: "/api/whatsapp/webhook",
  method: "GET",
  handler: httpAction(async () => {
    return new Response("WhatsApp webhook is active", { status: 200 });
  }),
});

// Add Convex Auth HTTP routes
auth.addHttpRoutes(http);

export default http;
