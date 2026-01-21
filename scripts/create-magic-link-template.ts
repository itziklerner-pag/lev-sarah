/**
 * Script to create WhatsApp UTILITY template with Magic Link button via Twilio Content API
 * Run with: bunx tsx scripts/create-magic-link-template.ts
 *
 * This creates a UTILITY template with:
 * - Friendly login message
 * - Clickable "Quick Login" button with magic link
 * - NO OTP code (UTILITY category allows URL buttons, AUTHENTICATION does not)
 *
 * After running this script:
 * 1. Wait for Meta/WhatsApp approval (typically 1-24 hours)
 * 2. Add the ContentSid to your .env as WHATSAPP_MAGIC_LINK_TEMPLATE_SID
 */

async function createMagicLinkTemplate() {
  const twilioSid = process.env.TWILIO_SID;
  const twilioToken = process.env.TWILIO_TOKEN;

  if (!twilioSid || !twilioToken) {
    console.error("Missing TWILIO_SID or TWILIO_TOKEN environment variables");
    console.log("\nMake sure you have these set in your environment or .env file:");
    console.log("  TWILIO_SID=AC...");
    console.log("  TWILIO_TOKEN=...");
    process.exit(1);
  }

  const authHeader = `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64")}`;

  // Create UTILITY template with Magic Link button only (no OTP)
  // UTILITY category allows URL buttons, AUTHENTICATION does not
  const templateData = {
    friendly_name: "levsarah_magic_link",
    language: "he",
    variables: {
      "1": "magic_link_token", // The 32-character magic link token
    },
    types: {
      "twilio/call-to-action": {
        body: "לחץ להתחברות ללב שרה.\nהקישור בתוקף ל-10 דקות.",
        actions: [
          {
            type: "URL",
            title: "התחברות מהירה",
            url: "https://levsarah.org/auth/magic-link?token={{1}}",
          },
        ],
      },
    },
  };

  console.log("Creating WhatsApp UTILITY template with Magic Link button...");
  console.log("Template data:", JSON.stringify(templateData, null, 2));

  try {
    const response = await fetch(`https://content.twilio.com/v1/Content`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(templateData),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("\nFailed to create template:");
      console.error(JSON.stringify(result, null, 2));

      if (result.code === 50300) {
        console.log("\n💡 Template already exists. Try a different friendly_name or delete the existing one first.");
      }

      process.exit(1);
    }

    console.log("\n✅ Template created successfully!");
    console.log("Content SID:", result.sid);
    console.log("\nFull response:");
    console.log(JSON.stringify(result, null, 2));

    // Now submit for WhatsApp approval as UTILITY
    console.log("\n📤 Submitting for WhatsApp approval (UTILITY category)...");

    const approvalResponse = await fetch(
      `https://content.twilio.com/v1/Content/${result.sid}/ApprovalRequests/whatsapp`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
          name: "levsarah_magic_link",
          category: "UTILITY",
        }),
      }
    );

    const approvalResult = await approvalResponse.json();

    if (!approvalResponse.ok) {
      console.error("\nFailed to submit for approval:");
      console.error(JSON.stringify(approvalResult, null, 2));
      console.log("\n⚠️  Template created but not submitted for approval.");
      console.log("You may need to submit manually in Twilio Console.");
    } else {
      console.log("\n✅ Submitted for WhatsApp approval!");
      console.log(JSON.stringify(approvalResult, null, 2));
    }

    console.log("\n📋 Next steps:");
    console.log(`1. Save this Content SID: ${result.sid}`);
    console.log("2. Wait for WhatsApp/Meta approval (usually 1-24 hours)");
    console.log("3. Check status in Twilio Console: https://console.twilio.com/us1/develop/sms/content-template-builder");
    console.log("4. Once approved, add to your .env:");
    console.log(`   WHATSAPP_MAGIC_LINK_TEMPLATE_SID=${result.sid}`);
    console.log("5. Deploy your updated code");

    return result.sid;
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

// Run the script
createMagicLinkTemplate();
