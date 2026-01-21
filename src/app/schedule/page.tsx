"use client";

import { useState, useCallback, Suspense } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { useSearchParams } from "next/navigation";
import { api } from "../../../convex/_generated/api";
import { PhoneLogin } from "@/components/auth/phone-login";
import { WeekView } from "@/components/schedule/week-view";
import { SignupModal } from "@/components/schedule/signup-modal";
import { InviteAccept } from "@/components/profile/invite-accept";
import { ProfileCompletion } from "@/components/profile/profile-completion";
import type { SlotType } from "../../../lib/types";
import Link from "next/link";

interface BookingSelection {
  date: string;
  slot: SlotType;
  hebrewDate: string;
}

interface FamilyProfile {
  _id: string;
  name: string;
  hebrewName?: string;
  phone: string;
  relationship: string;
  isAdmin: boolean;
  profileCompleted?: boolean;
  avatarGradient?: string;
  imageUrl?: string | null;
}

interface Invite {
  _id: string;
  name: string;
  relationship: string;
  status: string;
}

function ScheduleContent() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const searchParams = useSearchParams();
  const [bookingSelection, setBookingSelection] = useState<BookingSelection | null>(null);
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);

  // Get URL params for magic link resend flow
  const initialPhone = searchParams.get("phone") || undefined;
  const autoResend = searchParams.get("resend") === "true";

  // Get current user's profile
  const myProfile = useQuery(
    api.users.getMyProfile,
    isAuthenticated ? {} : "skip"
  ) as FamilyProfile | null | undefined;

  // Check for pending invite
  const pendingInvite = useQuery(
    api.users.checkInvite,
    isAuthenticated && myProfile === null ? {} : "skip"
  ) as Invite | null | undefined;

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
        <PhoneLogin initialPhone={initialPhone} autoResend={autoResend} />
      </main>
    );
  }

  // Authenticated but loading profile/invite
  if (myProfile === undefined || (myProfile === null && pendingInvite === undefined)) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-2xl text-gray-500">טוען פרופיל...</div>
      </main>
    );
  }

  // Has pending invite - show accept flow
  if (myProfile === null && pendingInvite) {
    return (
      <InviteAccept
        inviteName={pendingInvite.name}
        inviteRelationship={pendingInvite.relationship}
        onAccepted={() => {
          // Trigger profile completion after accepting invite
          setShowProfileCompletion(true);
        }}
      />
    );
  }

  // Authenticated but no profile and no invite - show error
  if (myProfile === null) {
    return (
      <main className="min-h-screen p-4" dir="rtl">
        <div className="max-w-md mx-auto text-center mt-20">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-4">לא נמצאה הזמנה</h1>
          <p className="text-gray-600 mb-6">
            מספר הטלפון שלך לא נמצא ברשימת המוזמנים.
            <br />
            נא לפנות למנהל המערכת לקבלת הזמנה.
          </p>
        </div>
      </main>
    );
  }

  // Has profile but not completed (no picture) - show profile completion
  if (!myProfile.profileCompleted && showProfileCompletion) {
    return (
      <ProfileCompletion
        userName={myProfile.name}
        onComplete={() => setShowProfileCompletion(false)}
      />
    );
  }

  // Prompt for profile completion on first visit (if not completed)
  // The profileCompleted flag handles this now

  return (
    <main className="min-h-screen pb-20" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div>
            <h1 className="text-xl font-bold">לב שרה</h1>
            <p className="text-sm text-gray-500">ביקורים אצל אבא</p>
          </div>
          <div className="flex items-center gap-3">
            {myProfile.isAdmin && (
              <Link
                href="/admin"
                className="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
              >
                ניהול
              </Link>
            )}
            {myProfile.imageUrl ? (
              <img
                src={myProfile.imageUrl}
                alt={myProfile.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
              />
            ) : (
              <button
                onClick={() => setShowProfileCompletion(true)}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-sm"
                title="הוסף תמונה"
              >
                {myProfile.name.charAt(0)}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Profile completion banner */}
      {!myProfile.profileCompleted && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <p className="text-sm text-blue-800">
              הוסף תמונה כדי שאבא יזהה אותך כשתבוא לבקר
            </p>
            <button
              onClick={() => setShowProfileCompletion(true)}
              className="text-sm px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              הוסף תמונה
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-2xl mx-auto p-4">
        <WeekView
          onSlotSelect={handleSlotSelect}
          currentUserProfile={myProfile as any}
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
          currentUserProfile={myProfile as any}
        />
      )}
    </main>
  );
}

export default function SchedulePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <div className="animate-pulse text-2xl text-gray-500">טוען...</div>
        </main>
      }
    >
      <ScheduleContent />
    </Suspense>
  );
}
