/**
 * Slot time definitions for visit scheduling
 */
export const SLOTS = {
  morning: {
    name: "בוקר",
    nameEn: "morning",
    start: "07:00",
    end: "12:00",
  },
  afternoon: {
    name: "צהריים",
    nameEn: "afternoon",
    start: "12:00",
    end: "16:00",
  },
  evening: {
    name: "ערב",
    nameEn: "evening",
    start: "16:00",
    end: "20:00",
  },
} as const;

export type SlotType = keyof typeof SLOTS;

/**
 * Kfar Chabad location for Hebrew calendar calculations
 */
export const KFAR_CHABAD_LOCATION = {
  latitude: 31.9867,
  longitude: 34.9167,
  timezone: "Asia/Jerusalem",
  city: "כפר חב״ד",
} as const;

/**
 * Family member roles
 */
export const FAMILY_ROLES = [
  "sibling",
  "spouse",
  "grandchild",
  "coordinator",
] as const;

export type FamilyRole = (typeof FAMILY_ROLES)[number];

/**
 * Avatar gradient colors for family members
 */
export const AVATAR_GRADIENTS = [
  "from-blue-400 to-blue-600",
  "from-green-400 to-green-600",
  "from-purple-400 to-purple-600",
  "from-pink-400 to-pink-600",
  "from-yellow-400 to-yellow-600",
  "from-orange-400 to-orange-600",
  "from-teal-400 to-teal-600",
  "from-red-400 to-red-600",
  "from-indigo-400 to-indigo-600",
  "from-cyan-400 to-cyan-600",
] as const;

/**
 * WhatsApp template SIDs (pre-approved)
 */
export const WHATSAPP_TEMPLATES = {
  visitConfirmation: "HX5acc3b264e947ebfaf4c0a87d41b67ed",
  visitReminder: "HX922d58d14a871614c1595cd9748d6367",
  gapAlert: "HX92aa09f05f109de0ff8afc3762f9b2f2",
} as const;
