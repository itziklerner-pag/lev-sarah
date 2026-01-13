"use client";

import clsx from "clsx";
import { Avatar } from "../common/avatar";
import { HebrewDateBadge } from "../common/hebrew-date";
import { SLOTS, type SlotType } from "../../../lib/constants";
import {
  isShabbatSlot,
  isToday,
  toISODateString,
} from "../../../lib/hebrew-calendar";
import type { EnrichedVisitSlot, FamilyProfile } from "../../../lib/types";

interface SlotInfo {
  type: SlotType;
  slot: EnrichedVisitSlot | null;
}

interface DayCardProps {
  date: Date;
  hebrewDate: string;
  slots: {
    morning: EnrichedVisitSlot | null;
    afternoon: EnrichedVisitSlot | null;
    evening: EnrichedVisitSlot | null;
  };
  isShabbat: boolean;
  isHoliday: boolean;
  holidayName?: string;
  onSlotClick: (date: string, slot: SlotType, hebrewDate: string) => void;
  currentUserProfile?: FamilyProfile | null;
  compact?: boolean;
}

/**
 * DayCard displays a single day with its three time slots
 * Mobile-first design with RTL support
 */
export function DayCard({
  date,
  hebrewDate,
  slots,
  isShabbat,
  isHoliday,
  holidayName,
  onSlotClick,
  currentUserProfile,
  compact = false,
}: DayCardProps) {
  const dayNames = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
  const dayNamesFull = [
    "ראשון",
    "שני",
    "שלישי",
    "רביעי",
    "חמישי",
    "שישי",
    "שבת",
  ];
  const dayOfWeek = date.getDay();
  const isTodayDate = isToday(date);
  const isoDate = toISODateString(date);

  const slotList: SlotInfo[] = [
    { type: "morning", slot: slots.morning },
    { type: "afternoon", slot: slots.afternoon },
    { type: "evening", slot: slots.evening },
  ];

  return (
    <div
      className={clsx(
        "rounded-xl border transition-all",
        isTodayDate
          ? "border-blue-500 bg-blue-50 shadow-md"
          : "border-gray-200 bg-white",
        isShabbat && "border-purple-300 bg-purple-50",
        isHoliday && "border-amber-300 bg-amber-50"
      )}
    >
      {/* Day Header */}
      <div
        className={clsx(
          "flex items-center justify-between p-3 border-b",
          isTodayDate ? "border-blue-200" : "border-gray-100"
        )}
      >
        <div className="flex items-center gap-2">
          <span
            className={clsx(
              "text-lg font-bold",
              isTodayDate && "text-blue-600",
              isShabbat && "text-purple-600"
            )}
          >
            {compact ? dayNames[dayOfWeek] : `יום ${dayNamesFull[dayOfWeek]}`}
          </span>
          {isTodayDate && (
            <span className="px-2 py-0.5 text-xs bg-blue-500 text-white rounded-full">
              היום
            </span>
          )}
          {isShabbat && (
            <span className="px-2 py-0.5 text-xs bg-purple-500 text-white rounded-full">
              שבת
            </span>
          )}
          {isHoliday && holidayName && (
            <span className="px-2 py-0.5 text-xs bg-amber-500 text-white rounded-full">
              {holidayName}
            </span>
          )}
        </div>
        <div className="text-left">
          <div className="text-sm text-gray-600">
            {date.toLocaleDateString("he-IL", { day: "numeric", month: "short" })}
          </div>
          <HebrewDateBadge date={date} />
        </div>
      </div>

      {/* Slots */}
      <div className="divide-y divide-gray-100">
        {slotList.map(({ type, slot }) => {
          const isShabbatTime = isShabbatSlot(date, type);
          const isBlocked = isShabbatTime || (isHoliday && type === "evening");
          const isBooked = !!slot?.bookedBy;
          const isMyBooking =
            isBooked && slot?.bookedBy === currentUserProfile?._id;

          return (
            <SlotRow
              key={type}
              slotType={type}
              slot={slot}
              isBlocked={isBlocked}
              isBooked={isBooked}
              isMyBooking={isMyBooking}
              onClick={() => {
                if (!isBlocked && !isBooked) {
                  onSlotClick(isoDate, type, hebrewDate);
                }
              }}
              compact={compact}
            />
          );
        })}
      </div>
    </div>
  );
}

interface SlotRowProps {
  slotType: SlotType;
  slot: EnrichedVisitSlot | null;
  isBlocked: boolean;
  isBooked: boolean;
  isMyBooking: boolean;
  onClick: () => void;
  compact?: boolean;
}

function SlotRow({
  slotType,
  slot,
  isBlocked,
  isBooked,
  isMyBooking,
  onClick,
  compact,
}: SlotRowProps) {
  const slotInfo = SLOTS[slotType];
  const profile = slot?.bookedByProfile;

  return (
    <button
      onClick={onClick}
      disabled={isBlocked || isBooked}
      className={clsx(
        "w-full flex items-center justify-between p-3 text-right transition-colors",
        !isBlocked && !isBooked && "hover:bg-gray-50 active:bg-gray-100",
        isBlocked && "bg-gray-100 cursor-not-allowed opacity-60",
        isBooked && !isMyBooking && "bg-green-50",
        isMyBooking && "bg-blue-100"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={clsx(
            "w-2 h-2 rounded-full",
            isBlocked && "bg-gray-400",
            isBooked && !isMyBooking && "bg-green-500",
            isMyBooking && "bg-blue-500",
            !isBlocked && !isBooked && "bg-gray-300"
          )}
        />
        <div>
          <div className="font-medium">{slotInfo.name}</div>
          {!compact && (
            <div className="text-xs text-gray-500">
              {slotInfo.start} - {slotInfo.end}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isBlocked ? (
          <span className="text-sm text-gray-500">שבת</span>
        ) : isBooked && profile ? (
          <div className="flex items-center gap-2">
            <span className={clsx("text-sm", isMyBooking && "text-blue-600")}>
              {profile.hebrewName || profile.name}
            </span>
            <Avatar
              name={profile.name}
              hebrewName={profile.hebrewName}
              gradient={profile.avatarGradient}
              size="sm"
            />
          </div>
        ) : (
          <span className="text-sm text-green-600 font-medium">פנוי</span>
        )}
      </div>
    </button>
  );
}

/**
 * Compact day card for week view on mobile
 */
export function CompactDayCard({
  date,
  hebrewDate,
  slots,
  isShabbat,
  isHoliday,
  onSlotClick,
  currentUserProfile,
}: Omit<DayCardProps, "compact">) {
  return (
    <DayCard
      date={date}
      hebrewDate={hebrewDate}
      slots={slots}
      isShabbat={isShabbat}
      isHoliday={isHoliday}
      onSlotClick={onSlotClick}
      currentUserProfile={currentUserProfile}
      compact
    />
  );
}
