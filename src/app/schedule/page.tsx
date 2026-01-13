"use client";

import { useState, useCallback } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PhoneLogin } from "@/components/auth/phone-login";
import { WeekView } from "@/components/schedule/week-view";
import { SignupModal } from "@/components/schedule/signup-modal";
import { Avatar } from "@/components/common/avatar";
import type { SlotType, FamilyProfile } from "../../../lib/types";

interface BookingSelection {
  date: string;
  slot: SlotType;
  hebrewDate: string;
}

export default function SchedulePage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [bookingSelection, setBookingSelection] = useState<BookingSelection | null>(null);

  // Get current user's profile
  const myProfile = useQuery(
    api.users.getMyProfile,
    isAuthenticated ? {} : "skip"
  ) as FamilyProfile | null | undefined;

  // Handle slot selection for booking
  const handleSlotSelect = useCallback(
    (date: string, slot: SlotType, hebrewDate: string) => {
      setBookingSelection({ date, slot, hebrewDate });
    },
    []
  );

  // Close booking modal
  const handleCloseModal = useCallback(() => {
    setBookingSelection(null);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-2xl text-gray-500">טוען...</div>
      </main>
    );
  }

  // Not authenticated - show login
  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold">לב שרה</h1>
          <p className="text-gray-600 mt-2">תורנות ביקורים אצל אבא</p>
        </div>
        <PhoneLogin />
      </main>
    );
  }

  // Authenticated but no profile yet
  if (myProfile === null) {
    return (
      <main className="min-h-screen p-4">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">ברוכים הבאים!</h1>
          <p className="text-gray-600 mb-6">
            הפרופיל שלך עדיין לא קיים במערכת. נא לפנות לרכז.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div>
            <h1 className="text-xl font-bold">לב שרה</h1>
            <p className="text-sm text-gray-500">ביקורים אצל אבא</p>
          </div>
          {myProfile && (
            <Avatar
              name={myProfile.name}
              hebrewName={myProfile.hebrewName}
              gradient={myProfile.avatarGradient}
              size="md"
              showName
            />
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto p-4">
        <WeekView
          onSlotSelect={handleSlotSelect}
          currentUserProfile={myProfile}
        />
      </div>

      {/* Booking Modal */}
      {bookingSelection && (
        <SignupModal
          isOpen={!!bookingSelection}
          onClose={handleCloseModal}
          date={bookingSelection.date}
          slot={bookingSelection.slot}
          hebrewDate={bookingSelection.hebrewDate}
          currentUserProfile={myProfile ?? null}
        />
      )}
    </main>
  );
}
