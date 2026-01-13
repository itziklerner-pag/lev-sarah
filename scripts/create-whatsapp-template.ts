/**
 * Script to create WhatsApp AUTHENTICATION template via Twilio Content API
 * Run with: bunx tsx scripts/create-whatsapp-template.ts
 */

async function createTemplate() {
  const twilioSid = process.env.TWILIO_SID;
  const twilioToken = process.env.TWILIO_TOKEN;

  if (!twilioSid || !twilioToken) {
    console.error("Missing TWILIO_SID or TWILIO_TOKEN environment variables");
    process.exit(1);
  }

  const authHeader = `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64")}`;

  // Create AUTHENTICATION template with OTP
  // Message: "Approve your account in Lev Sarah provided to you by <inviter>"
  const templateData = {
    friendly_name: "levsarah_auth_invite",
    language: "he",
    variables: {
      "1": "otp_code",      // The OTP/verification code
      "2": "inviter_name",  // Name of the person who invited them
    },
    types: {
      "whatsapp/authentication": {
        add_security_recommendation: true,
        code_expiration_minutes: 10,
        body: "{{1}} הוא קוד האישור שלך לחשבון בלב שרה, הוזמנת על ידי {{2}}.",
        actions: [
          {
            type: "COPY_CODE",
            copy_code_text: "העתק קוד",
          },
        ],
      },
    },
  };

  console.log("Creating WhatsApp template...");
  console.log("Template data:", JSON.stringify(templateData, null, 2));

  try {
    const response = await fetch(
      `https://content.twilio.com/v1/Content`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(templateData),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Failed to create template:");
      console.error(JSON.stringify(result, null, 2));
      process.exit(1);
    }

    console.log("\n✅ Template created successfully!");
    console.log("Content SID:", result.sid);
    console.log("\nFull response:");
    console.log(JSON.stringify(result, null, 2));

    // Now submit for WhatsApp approval as AUTHENTICATION
    console.log("\n📤 Submitting for WhatsApp approval (AUTHENTICATION category)...");

    const approvalResponse = await fetch(
      `https://content.twilio.com/v1/Content/${result.sid}/ApprovalRequests/whatsapp`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
          name: "levsarah_auth_invite",
          category: "AUTHENTICATION",
        }),
      }
    );

    const approvalResult = await approvalResponse.json();

    if (!approvalResponse.ok) {
      console.error("Failed to submit for approval:");
      console.error(JSON.stringify(approvalResult, null, 2));
      console.log("\n⚠️  Template created but not submitted for approval.");
      console.log("You may need to submit manually in Twilio Console.");
    } else {
      console.log("\n✅ Submitted for WhatsApp approval!");
      console.log(JSON.stringify(approvalResult, null, 2));
    }

    console.log("\n📋 Next steps:");
    console.log(`1. Save this Content SID: ${result.sid}`);
    console.log("2. Wait for WhatsApp approval (usually 24-48 hours)");
    console.log("3. Update convex/admin.ts to use this template");

    return result.sid;
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

createTemplate();
