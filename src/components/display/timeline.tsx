"use client";

import clsx from "clsx";
import { Avatar } from "../common/avatar";
import { SLOTS, type SlotType } from "../../../lib/constants";
import type { EnrichedVisitSlot } from "../../../lib/types";

interface TimelineProps {
  slots: {
    morning: EnrichedVisitSlot | null;
    afternoon: EnrichedVisitSlot | null;
    evening: EnrichedVisitSlot | null;
  };
  currentSlot: SlotType | null;
}

/**
 * Timeline - Horizontal timeline showing day's schedule
 * Designed for Abba Display - clear visual indication of schedule
 */
export function Timeline({ slots, currentSlot }: TimelineProps) {
  const slotOrder: SlotType[] = ["morning", "afternoon", "evening"];

  return (
    <div className="w-full px-8">
      {/* Timeline bar */}
      <div className="relative flex items-center justify-between">
        {/* Connecting line */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2" />

        {/* Slot indicators */}
        {slotOrder.map((slotType) => {
          const slot = slots[slotType];
          const isActive = currentSlot === slotType;
          const isBooked = !!slot?.bookedBy;
          const profile = slot?.bookedByProfile;
          const slotInfo = SLOTS[slotType];

          return (
            <div
              key={slotType}
              className="relative z-10 flex flex-col items-center gap-3"
            >
              {/* Time slot indicator */}
              <div
                className={clsx(
                  "w-20 h-20 rounded-full flex items-center justify-center",
                  "transition-all duration-300",
                  isActive && isBooked && "ring-4 ring-green-500 ring-offset-2",
                  isActive && !isBooked && "ring-4 ring-gray-300 ring-offset-2",
                  isBooked ? "bg-gradient-to-br" : "bg-gray-100"
                )}
              >
                {isBooked && profile ? (
                  <Avatar
                    name={profile.name}
                    hebrewName={profile.hebrewName}
                    gradient={profile.avatarGradient}
                    size="lg"
                  />
                ) : (
                  <span className="text-3xl text-gray-400">—</span>
                )}
              </div>

              {/* Time label */}
              <div className="text-center">
                <p
                  className={clsx(
                    "text-lg font-bold",
                    isActive ? "text-green-600" : "text-gray-700"
                  )}
                >
                  {slotInfo.name}
                </p>
                <p className="text-sm text-gray-500">
                  {slotInfo.start} - {slotInfo.end}
                </p>
                {isBooked && profile && (
                  <p
                    className={clsx(
                      "text-sm mt-1 font-medium",
                      isActive ? "text-green-600" : "text-gray-600"
                    )}
                  >
                    {profile.hebrewName || profile.name}
                  </p>
                )}
              </div>

              {/* Active indicator */}
              {isActive && (
                <div className="absolute -top-8">
                  <span className="flex items-center gap-1 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    עכשיו
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Vertical timeline for compact displays
 */
export function VerticalTimeline({
  slots,
  currentSlot,
}: TimelineProps) {
  const slotOrder: SlotType[] = ["morning", "afternoon", "evening"];

  return (
    <div className="flex flex-col gap-4 w-full max-w-md">
      {slotOrder.map((slotType, index) => {
        const slot = slots[slotType];
        const isActive = currentSlot === slotType;
        const isBooked = !!slot?.bookedBy;
        const profile = slot?.bookedByProfile;
        const slotInfo = SLOTS[slotType];
        const isPast = currentSlot
          ? slotOrder.indexOf(slotType) < slotOrder.indexOf(currentSlot)
          : false;

        return (
          <div
            key={slotType}
            className={clsx(
              "flex items-center gap-4 p-4 rounded-xl transition-all",
              isActive && "bg-green-50 ring-2 ring-green-500",
              !isActive && isBooked && "bg-gray-50",
              isPast && "opacity-50"
            )}
          >
            {/* Timeline dot */}
            <div className="relative flex flex-col items-center">
              <div
                className={clsx(
                  "w-4 h-4 rounded-full",
                  isActive && "bg-green-500",
                  !isActive && isBooked && "bg-blue-500",
                  !isActive && !isBooked && "bg-gray-300"
                )}
              />
              {index < slotOrder.length - 1 && (
                <div className="w-0.5 h-12 bg-gray-200 mt-2" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg">{slotInfo.name}</p>
                  <p className="text-sm text-gray-500">
                    {slotInfo.start} - {slotInfo.end}
                  </p>
                </div>
                {isBooked && profile ? (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {profile.hebrewName || profile.name}
                    </span>
                    <Avatar
                      name={profile.name}
                      hebrewName={profile.hebrewName}
                      gradient={profile.avatarGradient}
                      size="md"
                    />
                  </div>
                ) : (
                  <span className="text-gray-400">פנוי</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
