import { Phone } from "@convex-dev/auth/providers/Phone";
import { alphabet, generateRandomString } from "oslo/crypto";

// Token expiration time in milliseconds (10 minutes)
const TOKEN_EXPIRY_MS = 10 * 60 * 1000;

// Magic Link template (UTILITY category - allows URL buttons)
// Set this env var after the template is approved
const MAGIC_LINK_TEMPLATE_SID = process.env.WHATSAPP_MAGIC_LINK_TEMPLATE_SID;

/**
 * Generate a secure 32-character alphanumeric token for magic links
 * This token is used as the verification code in the auth flow
 */
function generateMagicLinkToken(): string {
  return generateRandomString(32, alphabet("a-z", "A-Z", "0-9"));
}

/**
 * Store magic link token via internal HTTP endpoint
 * This is called from the Phone provider's sendVerificationRequest
 * The token serves as both the magic link identifier AND the verification code
 */
async function storeMagicLinkToken(
  phone: string,
  token: string,
  returnUrl?: string
): Promise<boolean> {
  const convexSiteUrl = process.env.CONVEX_SITE_URL;
  const internalSecret = process.env.INTERNAL_API_SECRET;

  console.log("[PhoneAuth] storeMagicLinkToken called", {
    phone,
    tokenPrefix: token.substring(0, 8),
    hasConvexSiteUrl: !!convexSiteUrl,
    hasInternalSecret: !!internalSecret,
    convexSiteUrl,
  });

  if (!convexSiteUrl || !internalSecret) {
    console.error(
      "[PhoneAuth] Missing CONVEX_SITE_URL or INTERNAL_API_SECRET for magic link storage"
    );
    return false;
  }

  const url = `${convexSiteUrl}/api/internal/store-magic-token`;
  console.log("[PhoneAuth] Making request to:", url);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": internalSecret,
      },
      body: JSON.stringify({ phone, token, returnUrl }),
    });

    const responseText = await response.text();
    console.log("[PhoneAuth] Store token response:", {
      status: response.status,
      ok: response.ok,
      body: responseText,
    });

    if (!response.ok) {
      console.error("[PhoneAuth] Failed to store magic link token:", responseText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[PhoneAuth] Error storing magic link token:", error);
    return false;
  }
}

/**
 * Send WhatsApp message with magic link button
 * Uses UTILITY template which allows URL buttons (unlike AUTHENTICATION)
 */
async function sendWhatsAppMagicLink(
  phone: string,
  magicLinkToken: string
): Promise<void> {
  const twilioSid = process.env.TWILIO_SID;
  const twilioToken = process.env.TWILIO_TOKEN;
  const whatsappSender = process.env.WHATSAPP_SENDER;

  if (!twilioSid || !twilioToken || !whatsappSender) {
    console.error("Missing Twilio credentials");
    throw new Error("SMS service not configured");
  }

  if (!MAGIC_LINK_TEMPLATE_SID) {
    console.error("Missing WHATSAPP_MAGIC_LINK_TEMPLATE_SID");
    throw new Error("Magic link template not configured");
  }

  // Format phone number for WhatsApp
  const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;

  // Use Twilio REST API
  const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
  const auth = btoa(`${twilioSid}:${twilioToken}`);

  // Single variable: the magic link token
  const contentVariables = JSON.stringify({ "1": magicLinkToken });

  const body = new URLSearchParams({
    From: `whatsapp:${whatsappSender}`,
    To: `whatsapp:${formattedPhone}`,
    ContentSid: MAGIC_LINK_TEMPLATE_SID,
    ContentVariables: contentVariables,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const responseText = await response.text();
  console.log(`Twilio response status: ${response.status}`);
  console.log(`Twilio response: ${responseText}`);

  if (!response.ok) {
    console.error("Twilio API error:", responseText);
    throw new Error("Failed to send magic link");
  }

  console.log(`Magic link sent to ${formattedPhone}`);
}

// Custom Phone provider that sends magic links via WhatsApp
// No OTP - user clicks the magic link button to log in instantly
export const WhatsAppPhone = Phone({
  id: "whatsapp-phone",
  maxAge: TOKEN_EXPIRY_MS / 1000, // 10 minutes in seconds

  // Generate a 32-char magic link token (used as verification code)
  async generateVerificationToken() {
    return generateMagicLinkToken();
  },

  // Send magic link via WhatsApp using Twilio REST API
  async sendVerificationRequest({ identifier: phone, token }) {
    // 1. Store magic link token via HTTP endpoint
    // The token is the verification code - when user clicks link, we verify this token
    const storePromise = storeMagicLinkToken(phone, token).catch((err) => {
      console.error("Failed to store magic link token (non-blocking):", err);
      return false;
    });

    // 2. Send WhatsApp message with magic link button
    await sendWhatsAppMagicLink(phone, token);

    // Wait for store to complete
    await storePromise;
  },
});
