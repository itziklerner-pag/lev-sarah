"use client";

import { useMemo } from "react";
import {
  getHebrewDateString,
  formatHebrewDateFull,
  isShabbat,
  getHolidayInfo,
  isToday,
} from "../../../lib/hebrew-calendar";
import clsx from "clsx";

interface HebrewDateProps {
  date: Date;
  variant?: "compact" | "full" | "minimal";
  showShabbat?: boolean;
  showHoliday?: boolean;
  className?: string;
}

/**
 * HebrewDate component for displaying Hebrew dates
 * Variants:
 * - compact: Just the Hebrew date (כ״ב טבת)
 * - full: Day name + Hebrew date (יום ראשון, כ״ב טבת)
 * - minimal: Just day and month (כ״ב טבת)
 */
export function HebrewDate({
  date,
  variant = "compact",
  showShabbat = true,
  showHoliday = true,
  className,
}: HebrewDateProps) {
  const dateInfo = useMemo(() => {
    const shabbat = isShabbat(date);
    const holiday = getHolidayInfo(date);
    const today = isToday(date);

    return {
      hebrewDate: getHebrewDateString(date),
      fullDate: formatHebrewDateFull(date),
      isShabbat: shabbat,
      holiday,
      isToday: today,
    };
  }, [date]);

  const displayText =
    variant === "full" ? dateInfo.fullDate : dateInfo.hebrewDate;

  return (
    <span
      className={clsx(
        "font-hebrew",
        dateInfo.isToday && "text-blue-600 font-bold",
        dateInfo.isShabbat && showShabbat && "text-purple-600",
        className
      )}
    >
      {displayText}
      {showShabbat && dateInfo.isShabbat && (
        <span className="mr-1 text-purple-600"> (שבת)</span>
      )}
      {showHoliday && dateInfo.holiday && (
        <span className="mr-1 text-amber-600"> ({dateInfo.holiday.hebrew})</span>
      )}
    </span>
  );
}

/**
 * Compact Hebrew date badge for calendar views
 */
export function HebrewDateBadge({
  date,
  className,
}: {
  date: Date;
  className?: string;
}) {
  const hebrewDate = useMemo(() => getHebrewDateString(date), [date]);
  const today = isToday(date);

  return (
    <span
      className={clsx(
        "text-xs text-gray-500 font-hebrew",
        today && "text-blue-600 font-semibold",
        className
      )}
    >
      {hebrewDate}
    </span>
  );
}
