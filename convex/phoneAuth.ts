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

    // Use Twilio REST API directly
    const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
    const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");

    const body = new URLSearchParams({
      From: `whatsapp:${whatsappSender}`,
      To: `whatsapp:${formattedPhone}`,
      Body: `קוד הכניסה שלך ללב שרה: ${token}\n\nתוקף הקוד: 10 דקות`,
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

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Twilio API error:", errorText);
        throw new Error("Failed to send verification code");
      }

      console.log(`OTP sent to ${formattedPhone}`);
    } catch (error) {
      console.error("Failed to send WhatsApp OTP:", error);
      throw new Error("Failed to send verification code");
    }
  },
});
