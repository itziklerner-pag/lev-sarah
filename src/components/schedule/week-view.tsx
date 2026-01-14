"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { DayCard } from "./day-card";
import {
  getWeekDays,
  toISODateString,
  getHebrewDateString,
  isShabbatSlot,
  getHolidayInfo,
} from "../../../lib/hebrew-calendar";
import { cacheScheduleData, getCachedScheduleData } from "../../../lib/offline-cache";
import { useOnlineStatus } from "@/app/providers";
import type { SlotType, EnrichedVisitSlot, FamilyProfile } from "../../../lib/types";
import clsx from "clsx";

interface WeekViewProps {
  onSlotSelect: (date: string, slot: SlotType, hebrewDate: string) => void;
  currentUserProfile?: FamilyProfile | null;
}

/**
 * WeekView - Main calendar component showing 7 days
 * Mobile-first with RTL support
 */
export function WeekView({ onSlotSelect, currentUserProfile }: WeekViewProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [cachedData, setCachedData] = useState<unknown>(null);
  const isOnline = useOnlineStatus();

  // Calculate week start date
  const weekStart = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay() + weekOffset * 7);
    return start;
  }, [weekOffset]);

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  // Get date range for query
  const startDate = toISODateString(weekDays[0]);
  const endDate = toISODateString(weekDays[6]);

  // Fetch schedule data
  const scheduleData = useQuery(api.visits.getSchedule, {
    startDate,
    endDate,
  });

  // Cache schedule data when loaded
  useEffect(() => {
    if (scheduleData) {
      cacheScheduleData(startDate, scheduleData);
    }
  }, [scheduleData, startDate]);

  // Load cached data when offline
  useEffect(() => {
    if (!isOnline && scheduleData === undefined) {
      getCachedScheduleData(startDate).then((data) => {
        if (data) setCachedData(data);
      });
    }
  }, [isOnline, startDate, scheduleData]);

  // Use cached data as fallback when offline
  const effectiveScheduleData = scheduleData ?? (cachedData as typeof scheduleData);

  // Process schedule into day-by-day structure
  const daysWithSlots = useMemo(() => {
    return weekDays.map((date) => {
      const isoDate = toISODateString(date);
      const hebrewDate = getHebrewDateString(date);
      const dayOfWeek = date.getDay();

      // Check if any slot is blocked
      const isShabbat = dayOfWeek === 6 ||
        (dayOfWeek === 5 && isShabbatSlot(date, "evening"));

      const holiday = getHolidayInfo(date);

      // Find slots for this day
      const daySlots = (effectiveScheduleData ?? []).filter((s) => s.date === isoDate);

      const slots = {
        morning: daySlots.find((s) => s.slot === "morning") as EnrichedVisitSlot | null ?? null,
        afternoon: daySlots.find((s) => s.slot === "afternoon") as EnrichedVisitSlot | null ?? null,
        evening: daySlots.find((s) => s.slot === "evening") as EnrichedVisitSlot | null ?? null,
      };

      return {
        date,
        isoDate,
        hebrewDate,
        isShabbat,
        isHoliday: !!holiday,
        holidayName: holiday?.hebrew,
        slots,
      };
    });
  }, [weekDays, effectiveScheduleData]);

  // Navigation handlers
  const goToPreviousWeek = () => setWeekOffset((w) => w - 1);
  const goToNextWeek = () => setWeekOffset((w) => w + 1);
  const goToToday = () => setWeekOffset(0);

  // Format week range for header
  const weekRangeText = useMemo(() => {
    const start = weekDays[0];
    const end = weekDays[6];
    const startMonth = start.toLocaleDateString("he-IL", { month: "long" });
    const endMonth = end.toLocaleDateString("he-IL", { month: "long" });
    const year = end.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${year}`;
    }
    return `${startMonth} - ${endMonth} ${year}`;
  }, [weekDays]);

  const isLoading = scheduleData === undefined && !cachedData;

  return (
    <div className="flex flex-col gap-4">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPreviousWeek}
          className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
          aria-label="שבוע קודם"
        >
          <ChevronRightIcon className="w-6 h-6" />
        </button>

        <div className="text-center">
          <h2 className="text-lg font-bold">{weekRangeText}</h2>
          {weekOffset !== 0 && (
            <button
              onClick={goToToday}
              className="text-sm text-blue-600 hover:underline"
            >
              חזור להיום
            </button>
          )}
        </div>

        <button
          onClick={goToNextWeek}
          className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
          aria-label="שבוע הבא"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[...Array(7)].map((_, i) => (
            <DayCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        /* Days Grid */
        <div className="flex flex-col gap-4">
          {daysWithSlots.map((day) => (
            <DayCard
              key={day.isoDate}
              date={day.date}
              hebrewDate={day.hebrewDate}
              slots={day.slots}
              isShabbat={day.isShabbat}
              isHoliday={day.isHoliday}
              holidayName={day.holidayName}
              onSlotClick={onSlotSelect}
              currentUserProfile={currentUserProfile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Skeleton loader for DayCard
 */
function DayCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white animate-pulse">
      <div className="p-3 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <div className="h-5 w-20 bg-gray-200 rounded" />
          <div className="h-4 w-16 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-gray-200 rounded-full" />
              <div className="h-4 w-16 bg-gray-200 rounded" />
            </div>
            <div className="h-4 w-12 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Simple chevron icons (RTL-aware)
function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}
