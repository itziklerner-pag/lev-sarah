"use client";

import clsx from "clsx";
import { LargeAvatar } from "../common/avatar";
import { SLOTS, type SlotType } from "../../../lib/constants";
import type { FamilyProfile } from "../../../lib/types";

interface CurrentVisitorProps {
  profile: FamilyProfile | null;
  slot: SlotType;
  notes?: string;
  isNow?: boolean;
}

/**
 * CurrentVisitor - Large display showing who is visiting
 * Designed for Abba Display - readable from 2 meters
 */
export function CurrentVisitor({
  profile,
  slot,
  notes,
  isNow = false,
}: CurrentVisitorProps) {
  const slotInfo = SLOTS[slot];

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 p-12">
        <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
          <span className="text-6xl">?</span>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-gray-400">אין ביקור</p>
          <p className="text-xl text-gray-400 mt-2">
            {slotInfo.name} ({slotInfo.start} - {slotInfo.end})
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8">
      {/* Status indicator */}
      {isNow && (
        <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full">
          <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="font-medium">עכשיו</span>
        </div>
      )}

      {/* Large Avatar */}
      <LargeAvatar
        name={profile.name}
        hebrewName={profile.hebrewName}
        gradient={profile.avatarGradient}
      />

      {/* Time slot */}
      <div className="text-center">
        <p className="text-2xl text-gray-600">
          {slotInfo.name}
        </p>
        <p className="text-xl text-gray-400">
          {slotInfo.start} - {slotInfo.end}
        </p>
      </div>

      {/* Notes */}
      {notes && (
        <div className="bg-blue-50 text-blue-800 px-6 py-3 rounded-xl max-w-md text-center">
          <p className="text-lg">{notes}</p>
        </div>
      )}
    </div>
  );
}

/**
 * NoVisitorToday - Display when no visits scheduled
 */
export function NoVisitorToday() {
  return (
    <div className="flex flex-col items-center justify-center gap-8 p-12 text-center">
      <div className="w-40 h-40 rounded-full bg-gray-100 flex items-center justify-center">
        <span className="text-7xl">😴</span>
      </div>
      <div>
        <h2 className="text-4xl font-bold text-gray-600">אין ביקורים היום</h2>
        <p className="text-2xl text-gray-400 mt-4">יום מנוחה לאבא</p>
      </div>
    </div>
  );
}
