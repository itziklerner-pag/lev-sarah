/**
 * Shared types for the Lerner Family Visit Scheduler
 */

import type { Id, Doc } from "../convex/_generated/dataModel";

// Re-export Convex types
export type { Id, Doc };

// Slot types
export type SlotType = "morning" | "afternoon" | "evening";

// Relationship types
export type Relationship = "בן" | "בת" | "נכד" | "נכדה" | "נינה" | "קרוב" | "קרובה";

// Family member profile
export interface FamilyProfile {
  _id: Id<"familyProfiles">;
  _creationTime: number;
  userId: Id<"users">;
  name: string;
  hebrewName?: string;
  phone: string;
  relationship: Relationship;
  isAdmin: boolean;
  profileImage?: Id<"_storage">;
  profileCompleted?: boolean;
  avatarGradient?: string;
  lastVisit?: number;
  imageUrl?: string | null;
}

// Visit slot
export interface VisitSlot {
  _id: Id<"visitSlots">;
  _creationTime: number;
  date: string;
  hebrewDate: string;
  slot: SlotType;
  bookedBy?: Id<"familyProfiles">;
  bookedAt?: number;
  notes?: string;
  isShabbat: boolean;
  isHoliday: boolean;
  holidayName?: string;
}

// Enriched visit slot with profile info
export interface EnrichedVisitSlot extends VisitSlot {
  bookedByProfile: FamilyProfile | null;
}

// Day schedule with all slots
export interface DaySchedule {
  date: Date;
  isoDate: string;
  hebrewDate: string;
  isShabbat: boolean;
  isHoliday: boolean;
  holidayName?: string;
  slots: {
    morning: EnrichedVisitSlot | null;
    afternoon: EnrichedVisitSlot | null;
    evening: EnrichedVisitSlot | null;
  };
}

// Booking action
export interface BookingAction {
  date: string;
  slot: SlotType;
  hebrewDate: string;
}

// Notification types
export type NotificationType = "reminder" | "confirmation" | "gap_alert" | "nudge" | "invite";
export type NotificationStatus = "pending" | "sent" | "failed";

export interface Notification {
  _id: Id<"notifications">;
  _creationTime: number;
  userId: Id<"familyProfiles">;
  type: NotificationType;
  status: NotificationStatus;
  scheduledFor: number;
  sentAt?: number;
  twilioMessageId?: string;
  visitSlotId?: Id<"visitSlots">;
  message?: string;
  error?: string;
}

// Enriched notification with profile data
export interface EnrichedNotification extends Notification {
  userProfile: FamilyProfile | null;
}

// Gap analysis day
export interface GapAnalysisDay {
  date: string;
  displayDate: string;
  isShabbat: boolean;
  isGap: boolean;
  coverage: number | null;
  slots: {
    morning: EnrichedVisitSlot | null;
    afternoon: EnrichedVisitSlot | null;
    evening: EnrichedVisitSlot | null;
  };
}

// Coordinator stats
export interface CoordinatorStats {
  upcomingWeek: {
    totalSlots: number;
    booked: number;
    coverage: number;
  };
  familyActivity: {
    totalMembers: number;
    activeMembers: number;
    inactiveMembers: number;
  };
  notifications: {
    pending: number;
    failed: number;
  };
}

// Family member with activity stats
export interface FamilyMemberWithStats extends FamilyProfile {
  totalBookings: number;
  daysSinceLastVisit: number | null;
  isActive: boolean;
}
