/**
 * Hebrew Calendar Utilities
 * Uses @hebcal/core for accurate Hebrew date calculations
 * Handles Shabbat detection, holidays, and sunset-aware date transitions
 */

import { HDate, HebrewCalendar, Location, Event, flags, Zmanim, TimedEvent } from "@hebcal/core";
import { KFAR_CHABAD_LOCATION } from "./constants";

// Create Kfar Chabad location for sunset calculations
export const kfarChabadLocation = new Location(
  KFAR_CHABAD_LOCATION.latitude,
  KFAR_CHABAD_LOCATION.longitude,
  false, // not Israel daylight saving (handled by timezone)
  KFAR_CHABAD_LOCATION.timezone,
  KFAR_CHABAD_LOCATION.city
);

/**
 * Get Hebrew date string for display
 * @param date - JavaScript Date object
 * @returns Hebrew date string (e.g., "כ״ב טבת תשפ״ו")
 */
export function getHebrewDateString(date: Date): string {
  const hdate = new HDate(date);
  return hdate.renderGematriya();
}

/**
 * Get Hebrew date object with all info
 * @param date - JavaScript Date object
 */
export function getHebrewDate(date: Date): {
  hebrew: string;
  day: number;
  month: string;
  year: number;
  monthName: string;
} {
  const hdate = new HDate(date);
  return {
    hebrew: hdate.renderGematriya(),
    day: hdate.getDate(),
    month: hdate.getMonthName(),
    year: hdate.getFullYear(),
    monthName: hdate.getMonthName(),
  };
}

/**
 * Check if a date is Shabbat
 * @param date - JavaScript Date object
 * @returns true if date is Shabbat (Saturday)
 */
export function isShabbat(date: Date): boolean {
  const hdate = new HDate(date);
  return hdate.getDay() === 6; // Saturday
}

/**
 * Check if a slot falls during Shabbat
 * Friday evening slot is Shabbat, Saturday all day is Shabbat
 * @param date - JavaScript Date object
 * @param slot - "morning" | "afternoon" | "evening"
 */
export function isShabbatSlot(
  date: Date,
  slot: "morning" | "afternoon" | "evening"
): boolean {
  const dayOfWeek = date.getDay();
  return (
    (dayOfWeek === 5 && slot === "evening") || // Friday evening
    dayOfWeek === 6 // Saturday any slot
  );
}

/**
 * Get holidays for a date range
 * @param start - Start date
 * @param end - End date
 * @returns Array of holiday events
 */
export function getHolidays(start: Date, end: Date): Event[] {
  const options = {
    start: new HDate(start),
    end: new HDate(end),
    location: kfarChabadLocation,
    candlelighting: true,
    sedrot: false,
    il: true, // Israel
  };

  return HebrewCalendar.calendar(options);
}

/**
 * Check if a date is a major Jewish holiday that blocks visits
 * @param date - JavaScript Date object
 * @returns Holiday info or null
 */
export function getHolidayInfo(date: Date): {
  name: string;
  hebrew: string;
  blocksVisits: boolean;
} | null {
  const hdate = new HDate(date);
  const events = HebrewCalendar.calendar({
    start: hdate,
    end: hdate,
    il: true,
    candlelighting: false,
    sedrot: false,
  });

  // Find major holidays that would block visits
  const majorHolidays = events.filter((e) => {
    const eventFlags = e.getFlags();
    return (
      (eventFlags & flags.MAJOR_FAST) !== 0 ||
      (eventFlags & flags.CHAG) !== 0 || // Yom Tov
      (eventFlags & flags.YOM_KIPPUR_KATAN) !== 0
    );
  });

  if (majorHolidays.length > 0) {
    const holiday = majorHolidays[0];
    return {
      name: holiday.render("en"),
      hebrew: holiday.render("he"),
      blocksVisits: true,
    };
  }

  return null;
}

/**
 * Get sunset time for a date in Kfar Chabad
 * Used for determining when Hebrew date changes
 * @param date - JavaScript Date object
 * @returns Sunset time as Date object
 */
export function getSunset(date: Date): Date | null {
  try {
    const zmanim = new Zmanim(kfarChabadLocation, date, false);
    return zmanim.sunset();
  } catch {
    return null;
  }
}

/**
 * Get the current Hebrew date considering sunset
 * After sunset, it's already the next Hebrew day
 * @param now - Current time (defaults to now)
 */
export function getCurrentHebrewDate(now: Date = new Date()): {
  gregorian: Date;
  hebrew: string;
  isAfterSunset: boolean;
} {
  const sunset = getSunset(now);
  const isAfterSunset = sunset ? now >= sunset : false;

  // If after sunset, Hebrew date is tomorrow's
  const effectiveDate = isAfterSunset
    ? new Date(now.getTime() + 24 * 60 * 60 * 1000)
    : now;

  return {
    gregorian: now,
    hebrew: getHebrewDateString(effectiveDate),
    isAfterSunset,
  };
}

/**
 * Format a date for display in Hebrew
 * @param date - JavaScript Date object
 * @returns Formatted string like "יום ראשון, כ״ב טבת"
 */
export function formatHebrewDateFull(date: Date): string {
  const dayNames = [
    "יום ראשון",
    "יום שני",
    "יום שלישי",
    "יום רביעי",
    "יום חמישי",
    "יום שישי",
    "שבת",
  ];
  const dayName = dayNames[date.getDay()];
  const hebrewDate = getHebrewDateString(date);

  return `${dayName}, ${hebrewDate}`;
}

/**
 * Get week days starting from Sunday
 * @param startDate - Start date of the week
 * @returns Array of 7 dates
 */
export function getWeekDays(startDate: Date): Date[] {
  const days: Date[] = [];
  const start = new Date(startDate);

  // Adjust to Sunday if not already
  const dayOffset = start.getDay();
  start.setDate(start.getDate() - dayOffset);

  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push(day);
  }

  return days;
}

/**
 * Format ISO date string (YYYY-MM-DD)
 * @param date - JavaScript Date object
 */
export function toISODateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Parse ISO date string to Date
 * @param isoString - ISO date string (YYYY-MM-DD)
 */
export function fromISODateString(isoString: string): Date {
  return new Date(isoString + "T12:00:00");
}

/**
 * Check if date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return toISODateString(date) === toISODateString(today);
}

/**
 * Get Shabbat info for a week
 * @param weekStart - Start of the week
 */
export function getShabbatInfo(weekStart: Date): {
  candleLighting: Date | null;
  havdalah: Date | null;
  parashat: string | null;
} {
  const weekDays = getWeekDays(weekStart);
  const friday = weekDays[5];
  const saturday = weekDays[6];

  const events = HebrewCalendar.calendar({
    start: new HDate(friday),
    end: new HDate(saturday),
    il: true,
    candlelighting: true,
    havdalahMins: 50,
    location: kfarChabadLocation,
    sedrot: true,
  });

  let candleLighting: Date | null = null;
  let havdalah: Date | null = null;
  let parashat: string | null = null;

  for (const event of events) {
    const desc = event.getDesc();
    if (desc.includes("Candle lighting")) {
      const timedEvent = event as TimedEvent;
      candleLighting = timedEvent.eventTime || null;
    } else if (desc.includes("Havdalah")) {
      const timedEvent = event as TimedEvent;
      havdalah = timedEvent.eventTime || null;
    } else if (event.getFlags() & flags.PARSHA_HASHAVUA) {
      parashat = event.render("he");
    }
  }

  return { candleLighting, havdalah, parashat };
}
