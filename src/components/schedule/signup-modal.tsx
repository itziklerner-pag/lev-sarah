"use client";

import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { SLOTS, type SlotType } from "../../../lib/constants";
import { fromISODateString, formatHebrewDateFull } from "../../../lib/hebrew-calendar";
import type { FamilyProfile } from "../../../lib/types";
import { Avatar } from "../common/avatar";
import clsx from "clsx";

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  slot: SlotType;
  hebrewDate: string;
  currentUserProfile: FamilyProfile | null;
}

/**
 * SignupModal - One-tap booking confirmation
 * Core UX principle: Booking should take under 30 seconds
 */
export function SignupModal({
  isOpen,
  onClose,
  date,
  slot,
  hebrewDate,
  currentUserProfile,
}: SignupModalProps) {
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bookSlot = useMutation(api.visits.bookSlot);

  const handleBook = useCallback(async () => {
    if (!currentUserProfile) {
      setError("נא להשלים את הפרופיל תחילה");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await bookSlot({
        date,
        slot,
        hebrewDate,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "אירעה שגיאה בהרשמה"
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [bookSlot, date, slot, hebrewDate, notes, currentUserProfile, onClose]);

  if (!isOpen) return null;

  const dateObj = fromISODateString(date);
  const slotInfo = SLOTS[slot];
  const fullDateText = formatHebrewDateFull(dateObj);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={clsx(
          "relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl",
          "shadow-2xl animate-slide-up"
        )}
      >
        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="p-6 pb-4 text-center border-b">
          <h2 className="text-xl font-bold">אישור הרשמה</h2>
          <p className="text-gray-600 mt-1">ביקור אצל אבא</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Booking Details */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">תאריך</span>
              <span className="font-medium">{fullDateText}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">שעות</span>
              <span className="font-medium">
                {slotInfo.name} ({slotInfo.start} - {slotInfo.end})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">מבקר</span>
              <div className="flex items-center gap-2">
                {currentUserProfile && (
                  <>
                    <span className="font-medium">
                      {currentUserProfile.hebrewName || currentUserProfile.name}
                    </span>
                    <Avatar
                      name={currentUserProfile.name}
                      hebrewName={currentUserProfile.hebrewName}
                      gradient={currentUserProfile.avatarGradient}
                      size="sm"
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Notes Input */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium mb-2">
              הערות (אופציונלי)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="למשל: אביא ארוחת צהריים"
              className={clsx(
                "w-full px-4 py-3 rounded-xl border border-gray-200",
                "focus:border-blue-500 focus:ring-2 focus:ring-blue-200",
                "resize-none transition-colors"
              )}
              rows={2}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className={clsx(
              "flex-1 px-6 py-3 rounded-xl font-medium transition-colors",
              "bg-gray-100 hover:bg-gray-200 active:bg-gray-300"
            )}
          >
            ביטול
          </button>
          <button
            onClick={handleBook}
            disabled={isSubmitting || !currentUserProfile}
            className={clsx(
              "flex-1 px-6 py-3 rounded-xl font-medium transition-colors",
              "bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700",
              "disabled:bg-gray-300 disabled:cursor-not-allowed"
            )}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner />
                נרשם...
              </span>
            ) : (
              "אישור הרשמה"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
