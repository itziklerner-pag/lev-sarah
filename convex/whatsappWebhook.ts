import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  internalAction,
} from "./_generated/server";
import { internal, api } from "./_generated/api";
import { alphabet, generateRandomString } from "oslo/crypto";

// Token expiration time in milliseconds (10 minutes)
const TOKEN_EXPIRY_MS = 10 * 60 * 1000;

// Admin phone number for approval notifications
const ADMIN_PHONE = "+16502294226";

// Magic link template SID
const MAGIC_LINK_TEMPLATE_SID = process.env.WHATSAPP_MAGIC_LINK_TEMPLATE_SID;

// Relationship options for registration
const RELATIONSHIP_OPTIONS = [
  { key: "1", value: "בן" as const, label: "בן" },
  { key: "2", value: "בת" as const, label: "בת" },
  { key: "3", value: "נכד" as const, label: "נכד" },
  { key: "4", value: "נכדה" as const, label: "נכדה" },
  { key: "5", value: "נינה" as const, label: "נינה" },
  { key: "6", value: "קרוב" as const, label: "קרוב משפחה" },
  { key: "7", value: "קרובה" as const, label: "קרובת משפחה" },
];

/**
 * Generate a secure token for magic links
 */
function generateSecureToken(): string {
  return generateRandomString(32, alphabet("a-z", "A-Z", "0-9"));
}

/**
 * Check if a phone number is registered in the system
 */
export const checkPhoneRegistration = internalQuery({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    // Normalize phone number
    const normalizedPhone = args.phone.replace(/\D/g, "");
    const phoneVariants = [
      normalizedPhone,
      `+${normalizedPhone}`,
      normalizedPhone.startsWith("1") ? normalizedPhone.slice(1) : normalizedPhone,
      normalizedPhone.startsWith("972") ? normalizedPhone.replace(/^972/, "") : normalizedPhone,
    ];

    // Check familyProfiles for any matching phone
    for (const phone of phoneVariants) {
      const profile = await ctx.db
        .query("familyProfiles")
        .withIndex("by_phone", (q) => q.eq("phone", phone))
        .first();
      if (profile) {
        return { registered: true, profile };
      }

      // Also check with + prefix
      const profileWithPlus = await ctx.db
        .query("familyProfiles")
        .withIndex("by_phone", (q) => q.eq("phone", `+${phone}`))
        .first();
      if (profileWithPlus) {
        return { registered: true, profile: profileWithPlus };
      }
    }

    return { registered: false, profile: null };
  },
});

/**
 * Check for pending registration request
 */
export const checkPendingRegistration = internalQuery({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    const normalizedPhone = args.phone.startsWith("+") ? args.phone : `+${args.phone}`;

    const request = await ctx.db
      .query("registrationRequests")
      .withIndex("by_phone", (q) => q.eq("phone", normalizedPhone))
      .first();

    return request;
  },
});

/**
 * Create a new registration request
 */
export const createRegistrationRequest = internalMutation({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    const normalizedPhone = args.phone.startsWith("+") ? args.phone : `+${args.phone}`;

    // Check if request already exists
    const existing = await ctx.db
      .query("registrationRequests")
      .withIndex("by_phone", (q) => q.eq("phone", normalizedPhone))
      .first();

    if (existing) {
      // Update existing request
      await ctx.db.patch(existing._id, {
        status: "pending_details",
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    // Create new request
    return await ctx.db.insert("registrationRequests", {
      phone: normalizedPhone,
      status: "pending_details",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update registration request with user details
 */
export const updateRegistrationDetails = internalMutation({
  args: {
    phone: v.string(),
    name: v.string(),
    relationship: v.union(
      v.literal("בן"),
      v.literal("בת"),
      v.literal("נכד"),
      v.literal("נכדה"),
      v.literal("נינה"),
      v.literal("קרוב"),
      v.literal("קרובה")
    ),
  },
  handler: async (ctx, args) => {
    const normalizedPhone = args.phone.startsWith("+") ? args.phone : `+${args.phone}`;

    const request = await ctx.db
      .query("registrationRequests")
      .withIndex("by_phone", (q) => q.eq("phone", normalizedPhone))
      .first();

    if (!request) {
      throw new Error("Registration request not found");
    }

    await ctx.db.patch(request._id, {
      name: args.name,
      relationship: args.relationship,
      status: "pending_approval",
      updatedAt: Date.now(),
    });

    return request._id;
  },
});

/**
 * Approve a registration request and create family profile
 */
export const approveRegistration = internalMutation({
  args: {
    requestId: v.id("registrationRequests"),
    approverProfileId: v.id("familyProfiles"),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Registration request not found");
    }

    if (request.status !== "pending_approval") {
      throw new Error("Request is not pending approval");
    }

    if (!request.name || !request.relationship) {
      throw new Error("Registration details incomplete");
    }

    // Mark request as approved
    await ctx.db.patch(args.requestId, {
      status: "approved",
      approvedBy: args.approverProfileId,
      approvedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { phone: request.phone, name: request.name };
  },
});

/**
 * Get pending registration request by phone for approval flow
 */
export const getPendingApprovalByPhone = internalQuery({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    const normalizedPhone = args.phone.startsWith("+") ? args.phone : `+${args.phone}`;

    return await ctx.db
      .query("registrationRequests")
      .withIndex("by_phone", (q) => q.eq("phone", normalizedPhone))
      .filter((q) => q.eq(q.field("status"), "pending_approval"))
      .first();
  },
});

/**
 * Send WhatsApp message (generic)
 */
export const sendWhatsAppMessageDirect = internalAction({
  args: {
    phone: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const twilioSid = process.env.TWILIO_SID;
    const twilioToken = process.env.TWILIO_TOKEN;
    const whatsappSender = process.env.WHATSAPP_SENDER || "+16506102211";

    if (!twilioSid || !twilioToken) {
      console.error("Twilio credentials not configured");
      return { success: false, error: "Twilio not configured" };
    }

    const formattedPhone = args.phone.startsWith("+") ? args.phone : `+${args.phone}`;

    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            From: `whatsapp:${whatsappSender}`,
            To: `whatsapp:${formattedPhone}`,
            Body: args.message,
          }),
        }
      );

      const result = await response.json();
      console.log("WhatsApp send result:", result);

      if (response.ok && result.sid) {
        return { success: true, messageSid: result.sid };
      } else {
        return { success: false, error: result.message || "Unknown error" };
      }
    } catch (error) {
      console.error("WhatsApp send error:", error);
      return { success: false, error: String(error) };
    }
  },
});

/**
 * Send magic link via the auth system's signIn action
 * This triggers the proper auth verification code creation
 */
export const sendMagicLinkWhatsApp = internalAction({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    const normalizedPhone = args.phone.startsWith("+") ? args.phone : `+${args.phone}`;

    try {
      // Call the auth signIn action directly
      // This will:
      // 1. Create a verification code in the auth system's internal tables
      // 2. Call our Phone provider's sendVerificationRequest
      // 3. Which sends the WhatsApp with the magic link
      await ctx.runAction(api.auth.signIn, {
        provider: "whatsapp-phone",
        params: {
          phone: normalizedPhone,
        },
      });

      console.log("Auth signIn triggered for", normalizedPhone);
      return { success: true };
    } catch (error) {
      console.error("Auth signIn error:", error);

      // Fallback: send a simple message directing to website
      await ctx.runAction(internal.whatsappWebhook.sendWhatsAppMessageDirect, {
        phone: normalizedPhone,
        message: `שלום! לחץ כאן להתחברות: https://levsarah.org/schedule?phone=${encodeURIComponent(normalizedPhone)}&resend=true`,
      });
      return { success: false, error: String(error), fallback: true };
    }
  },
});

// Response type for WhatsApp handlers
type WhatsAppHandlerResponse = {
  action: string;
  phone?: string;
  name?: string;
  error?: string;
  targetPhone?: string;
};

/**
 * Main handler for incoming WhatsApp messages
 */
export const handleIncomingWhatsApp = internalAction({
  args: {
    from: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args): Promise<WhatsAppHandlerResponse> => {
    const phone = args.from.replace("whatsapp:", "");
    const message = args.body.trim();

    console.log(`Incoming WhatsApp from ${phone}: ${message}`);

    // Check if user is registered
    const registrationCheck = await ctx.runQuery(
      internal.whatsappWebhook.checkPhoneRegistration,
      { phone }
    );

    if (registrationCheck.registered) {
      // User is registered - send magic link
      console.log(`User ${phone} is registered, sending magic link`);

      const sendResult = await ctx.runAction(
        internal.whatsappWebhook.sendMagicLinkWhatsApp,
        { phone }
      ) as { success: boolean; error?: string };

      if (sendResult.success) {
        return { action: "magic_link_sent", phone };
      } else {
        // Fallback: send regular message
        await ctx.runAction(internal.whatsappWebhook.sendWhatsAppMessageDirect, {
          phone,
          message: "שלום! נסה שוב בעוד כמה דקות או התחבר דרך האתר: https://levsarah.org",
        });
        return { action: "error", error: sendResult.error };
      }
    }

    // User not registered - check for pending registration
    const pendingReq = await ctx.runQuery(
      internal.whatsappWebhook.checkPendingRegistration,
      { phone }
    ) as { status: string; name?: string; relationship?: string } | null;

    if (!pendingReq) {
      // No pending request - create one and ask for details
      await ctx.runMutation(internal.whatsappWebhook.createRegistrationRequest, {
        phone,
      });

      await ctx.runAction(internal.whatsappWebhook.sendWhatsAppMessageDirect, {
        phone,
        message: `שלום! נראה שאתה לא רשום עדיין במערכת לב שרה.

כדי להירשם, אנא שלח את השם המלא שלך.`,
      });

      return { action: "registration_started", phone };
    }

    // Handle based on registration status
    if (pendingReq.status === "pending_details") {
      // Check if this is a name (first message after registration started)
      if (!pendingReq.name) {
        // This message is the user's name
        const name = message;

        // Store the name temporarily and ask for relationship
        await ctx.runMutation(internal.whatsappWebhook.updateRegistrationName, {
          phone,
          name,
        });

        await ctx.runAction(internal.whatsappWebhook.sendWhatsAppMessageDirect, {
          phone,
          message: `תודה ${name}!

מה הקשר שלך לאבא?
שלח את המספר המתאים:

1. בן
2. בת
3. נכד
4. נכדה
5. נינה
6. קרוב משפחה
7. קרובת משפחה`,
        });

        return { action: "name_received", phone, name };
      } else {
        // We have name, this should be relationship selection
        const relationshipKey = message.trim();
        const relationship = RELATIONSHIP_OPTIONS.find((r) => r.key === relationshipKey);

        if (!relationship) {
          await ctx.runAction(internal.whatsappWebhook.sendWhatsAppMessageDirect, {
            phone,
            message: `אנא שלח מספר בין 1-7:

1. בן
2. בת
3. נכד
4. נכדה
5. נינה
6. קרוב משפחה
7. קרובת משפחה`,
          });
          return { action: "invalid_relationship", phone };
        }

        // Update registration with relationship
        await ctx.runMutation(internal.whatsappWebhook.updateRegistrationDetails, {
          phone,
          name: pendingReq.name,
          relationship: relationship.value,
        });

        // Notify admin for approval
        await ctx.runAction(internal.whatsappWebhook.sendWhatsAppMessageDirect, {
          phone: ADMIN_PHONE,
          message: `בקשת הרשמה חדשה ללב שרה:

שם: ${pendingReq.name}
קשר: ${relationship.label}
טלפון: ${phone}

לאישור, שלח: אשר ${phone}
לדחייה, שלח: דחה ${phone}`,
        });

        // Confirm to user
        await ctx.runAction(internal.whatsappWebhook.sendWhatsAppMessageDirect, {
          phone,
          message: `תודה! הבקשה שלך נשלחה לאישור.
תקבל הודעה ברגע שהבקשה תאושר.`,
        });

        return { action: "pending_approval", phone, name: pendingReq.name };
      }
    }

    if (pendingReq.status === "pending_approval") {
      await ctx.runAction(internal.whatsappWebhook.sendWhatsAppMessageDirect, {
        phone,
        message: "הבקשה שלך ממתינה לאישור. תקבל הודעה בקרוב!",
      });
      return { action: "still_pending", phone };
    }

    if (pendingReq.status === "approved") {
      // User was approved - send magic link
      const result = await ctx.runAction(
        internal.whatsappWebhook.sendMagicLinkWhatsApp,
        { phone }
      );
      return { action: "magic_link_sent_after_approval", phone };
    }

    return { action: "unknown_state", phone };
  },
});

/**
 * Handle admin approval/rejection messages
 */
export const handleAdminResponse = internalAction({
  args: {
    from: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args): Promise<WhatsAppHandlerResponse> => {
    const adminPhone = args.from.replace("whatsapp:", "");
    const message = args.body.trim();

    // Check if sender is admin
    const adminCheck = await ctx.runQuery(
      internal.whatsappWebhook.checkPhoneRegistration,
      { phone: adminPhone }
    ) as { registered: boolean; profile: { _id: any; isAdmin: boolean } | null };

    if (!adminCheck.registered || !adminCheck.profile?.isAdmin) {
      return { action: "not_admin", phone: adminPhone };
    }

    // Parse approval command: "אשר +1234567890" or "דחה +1234567890"
    const approveMatch = message.match(/^אשר\s+(\+?\d+)/);
    const rejectMatch = message.match(/^דחה\s+(\+?\d+)/);

    if (approveMatch) {
      const targetPhone = approveMatch[1].startsWith("+") ? approveMatch[1] : `+${approveMatch[1]}`;

      // Find pending request
      const reqData = await ctx.runQuery(
        internal.whatsappWebhook.getPendingApprovalByPhone,
        { phone: targetPhone }
      ) as { _id: any; name?: string; relationship?: string } | null;

      if (!reqData) {
        await ctx.runAction(internal.whatsappWebhook.sendWhatsAppMessageDirect, {
          phone: adminPhone,
          message: `לא נמצאה בקשה ממתינה עבור ${targetPhone}`,
        });
        return { action: "request_not_found", targetPhone };
      }

      // Approve the request
      await ctx.runMutation(
        internal.whatsappWebhook.approveRegistration,
        {
          requestId: reqData._id,
          approverProfileId: adminCheck.profile._id,
        }
      );

      // Create invite for the user so they can complete registration
      await ctx.runMutation(internal.whatsappWebhook.createInviteForApprovedUser, {
        phone: targetPhone,
        name: reqData.name!,
        relationship: reqData.relationship as any,
        approverProfileId: adminCheck.profile._id,
      });

      // Send magic link to the approved user
      await ctx.runAction(internal.whatsappWebhook.sendMagicLinkWhatsApp, {
        phone: targetPhone,
      });

      // Notify user
      await ctx.runAction(internal.whatsappWebhook.sendWhatsAppMessageDirect, {
        phone: targetPhone,
        message: `מזל טוב! הבקשה שלך אושרה!
לחץ על הקישור שנשלח אליך כדי להתחבר למערכת.`,
      });

      // Confirm to admin
      await ctx.runAction(internal.whatsappWebhook.sendWhatsAppMessageDirect, {
        phone: adminPhone,
        message: `הבקשה של ${reqData.name} (${targetPhone}) אושרה בהצלחה!`,
      });

      return { action: "approved", targetPhone, name: reqData.name };
    }

    if (rejectMatch) {
      const targetPhone = rejectMatch[1].startsWith("+") ? rejectMatch[1] : `+${rejectMatch[1]}`;

      await ctx.runMutation(internal.whatsappWebhook.rejectRegistration, {
        phone: targetPhone,
      });

      await ctx.runAction(internal.whatsappWebhook.sendWhatsAppMessageDirect, {
        phone: targetPhone,
        message: "מצטערים, הבקשה שלך לא אושרה. פנה למנהל המערכת לפרטים.",
      });

      await ctx.runAction(internal.whatsappWebhook.sendWhatsAppMessageDirect, {
        phone: adminPhone,
        message: `הבקשה של ${targetPhone} נדחתה.`,
      });

      return { action: "rejected", targetPhone };
    }

    return { action: "not_admin_command" };
  },
});

/**
 * Update registration with just the name (intermediate step)
 */
export const updateRegistrationName = internalMutation({
  args: {
    phone: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedPhone = args.phone.startsWith("+") ? args.phone : `+${args.phone}`;

    const request = await ctx.db
      .query("registrationRequests")
      .withIndex("by_phone", (q) => q.eq("phone", normalizedPhone))
      .first();

    if (!request) {
      throw new Error("Registration request not found");
    }

    await ctx.db.patch(request._id, {
      name: args.name,
      updatedAt: Date.now(),
    });

    return request._id;
  },
});

/**
 * Reject a registration request
 */
export const rejectRegistration = internalMutation({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    const normalizedPhone = args.phone.startsWith("+") ? args.phone : `+${args.phone}`;

    const request = await ctx.db
      .query("registrationRequests")
      .withIndex("by_phone", (q) => q.eq("phone", normalizedPhone))
      .first();

    if (request) {
      await ctx.db.patch(request._id, {
        status: "rejected",
        updatedAt: Date.now(),
      });
    }
  },
});

/**
 * Create an invite for an approved user
 */
export const createInviteForApprovedUser = internalMutation({
  args: {
    phone: v.string(),
    name: v.string(),
    relationship: v.union(
      v.literal("בן"),
      v.literal("בת"),
      v.literal("נכד"),
      v.literal("נכדה"),
      v.literal("נינה"),
      v.literal("קרוב"),
      v.literal("קרובה")
    ),
    approverProfileId: v.id("familyProfiles"),
  },
  handler: async (ctx, args) => {
    const normalizedPhone = args.phone.startsWith("+") ? args.phone : `+${args.phone}`;

    // Check if invite already exists
    const existingInvite = await ctx.db
      .query("invites")
      .withIndex("by_phone", (q) => q.eq("phone", normalizedPhone))
      .first();

    if (existingInvite) {
      // Update existing invite
      await ctx.db.patch(existingInvite._id, {
        status: "sent",
        name: args.name,
        relationship: args.relationship,
      });
      return existingInvite._id;
    }

    // Create new invite
    const inviteCode = generateRandomString(8, alphabet("a-z", "0-9"));

    return await ctx.db.insert("invites", {
      phone: normalizedPhone,
      name: args.name,
      relationship: args.relationship,
      status: "sent",
      invitedBy: args.approverProfileId,
      invitedAt: Date.now(),
      inviteCode,
    });
  },
});
