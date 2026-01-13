/**
 * Shared types for the Lerner Family Visit Scheduler
 */

import type { Id, Doc } from "../convex/_generated/dataModel";

// Re-export Convex types
export type { Id, Doc };

// Slot types
export type SlotType = "morning" | "afternoon" | "evening";

// Family member profile
export interface FamilyProfile {
  _id: Id<"familyProfiles">;
  _creationTime: number;
  userId: Id<"users">;
  name: string;
  hebrewName?: string;
  phone: string;
  role: "sibling" | "spouse" | "grandchild" | "coordinator";
  isCoordinator: boolean;
  avatarGradient?: string;
  lastVisit?: number;
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
