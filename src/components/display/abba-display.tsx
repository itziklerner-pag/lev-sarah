"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { CurrentVisitor, NoVisitorToday } from "./current-visitor";
import { Timeline } from "./timeline";
import { HebrewDate } from "../common/hebrew-date";
import {
  toISODateString,
  getCurrentHebrewDate,
} from "../../../lib/hebrew-calendar";
import { SLOTS, type SlotType } from "../../../lib/constants";
import type { EnrichedVisitSlot } from "../../../lib/types";
import clsx from "clsx";

/**
 * AbbaDisplay - Kiosk display for Abba's home
 * Shows today's visitors with large, readable fonts
 * Auto-refreshes every 5 minutes
 */
export function AbbaDisplay() {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  // Update time every minute for current slot detection
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60 * 1000); // 1 minute

    return () => clearInterval(interval);
  }, []);

  const todayISO = toISODateString(currentTime);
  const { hebrew: hebrewDate } = getCurrentHebrewDate(currentTime);

  // Fetch today's schedule
  const todaySlots = useQuery(api.visits.getSlotsByDate, {
    date: todayISO,
  });

  // Process slots into structured format
  const slots = useMemo(() => {
    const slotMap: {
      morning: EnrichedVisitSlot | null;
      afternoon: EnrichedVisitSlot | null;
      evening: EnrichedVisitSlot | null;
    } = {
      morning: null,
      afternoon: null,
      evening: null,
    };

    if (todaySlots) {
      for (const slot of todaySlots) {
        slotMap[slot.slot as SlotType] = slot as EnrichedVisitSlot;
      }
    }

    return slotMap;
  }, [todaySlots]);

  // Determine current slot based on time
  const currentSlot = useMemo((): SlotType | null => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const timeValue = hours * 100 + minutes;

    // Morning: 07:00 - 12:00
    if (timeValue >= 700 && timeValue < 1200) return "morning";
    // Afternoon: 12:00 - 16:00
    if (timeValue >= 1200 && timeValue < 1600) return "afternoon";
    // Evening: 16:00 - 20:00
    if (timeValue >= 1600 && timeValue < 2000) return "evening";

    return null;
  }, [currentTime]);

  // Get current visitor info
  const currentVisitorSlot = currentSlot ? slots[currentSlot] : null;
  const currentVisitor = currentVisitorSlot?.bookedByProfile || null;

  // Check if any visits today
  const hasVisitsToday = Object.values(slots).some((s) => s?.bookedBy);

  const isLoading = todaySlots === undefined;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      {/* Header with date */}
      <header className="p-6 text-center border-b bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-4">
          <HeartIcon className="w-10 h-10 text-red-500" />
          <h1 className="text-4xl font-bold">לב שרה</h1>
          <HeartIcon className="w-10 h-10 text-red-500" />
        </div>
        <div className="mt-4 text-2xl">
          <HebrewDate date={currentTime} variant="full" />
        </div>
        <p className="text-xl text-gray-500 mt-2">
          {currentTime.toLocaleDateString("he-IL", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 gap-12">
        {isLoading ? (
          <LoadingDisplay />
        ) : !hasVisitsToday ? (
          <NoVisitorToday />
        ) : (
          <>
            {/* Current visitor */}
            <CurrentVisitor
              profile={currentVisitor}
              slot={currentSlot || "morning"}
              notes={currentVisitorSlot?.notes}
              isNow={!!currentSlot && !!currentVisitor}
            />

            {/* Timeline */}
            <Timeline slots={slots} currentSlot={currentSlot} />
          </>
        )}
      </main>

      {/* Footer with last update */}
      <footer className="p-4 text-center text-gray-400 text-sm border-t bg-white/50">
        <p>
          עודכן לאחרונה:{" "}
          {currentTime.toLocaleTimeString("he-IL", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </footer>
    </div>
  );
}

/**
 * Loading state for Abba Display
 */
function LoadingDisplay() {
  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <div className="w-32 h-32 rounded-full bg-gray-200 animate-pulse" />
      <div className="text-center space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mx-auto" />
      </div>
    </div>
  );
}

/**
 * Heart icon for display
 */
function HeartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}
