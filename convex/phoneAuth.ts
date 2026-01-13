import { Phone } from "@convex-dev/auth/providers/Phone";
import { alphabet, generateRandomString } from "oslo/crypto";

// Custom Phone provider that sends OTP via WhatsApp using Twilio REST API
export const WhatsAppPhone = Phone({
  id: "whatsapp-phone",

  // Generate a 6-digit OTP
  async generateVerificationToken() {
    return generateRandomString(6, alphabet("0-9"));
  },

  // Send OTP via WhatsApp using Twilio REST API (no Node.js SDK needed)
  async sendVerificationRequest({ identifier: phone, token }) {
    const twilioSid = process.env.TWILIO_SID;
    const twilioToken = process.env.TWILIO_TOKEN;
    const whatsappSender = process.env.WHATSAPP_SENDER;

    if (!twilioSid || !twilioToken || !whatsappSender) {
      console.error("Missing Twilio credentials");
      throw new Error("SMS service not configured");
    }

    // Format phone number for WhatsApp
    const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;

    // Use Twilio REST API with Content Template (UTILITY category)
    const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
    // Use btoa for base64 encoding (works in Convex runtime)
    const auth = btoa(`${twilioSid}:${twilioToken}`);

    // Use Content Template for AUTHENTICATION messages (bypasses 24-hour window)
    const OTP_TEMPLATE_SID = "HX886b0dc8fe837f1b0d514362eb995a3e";

    const body = new URLSearchParams({
      From: `whatsapp:${whatsappSender}`,
      To: `whatsapp:${formattedPhone}`,
      ContentSid: OTP_TEMPLATE_SID,
      ContentVariables: JSON.stringify({ "1": token }),
    });

    try {
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
        throw new Error("Failed to send verification code");
      }

      console.log(`OTP sent to ${formattedPhone}`);
    } catch (error) {
      console.error("Failed to send WhatsApp OTP:", error);
      throw new Error("Failed to send verification code");
    }
  },
});
