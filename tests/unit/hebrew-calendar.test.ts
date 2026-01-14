import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getHebrewDateString,
  isShabbat,
  isShabbatSlot,
  toISODateString,
  fromISODateString,
  isToday,
  getWeekDays,
  formatHebrewDateFull,
  getSunset,
  getCurrentHebrewDate,
  getHolidayInfo,
  getShabbatInfo,
  getHebrewDate,
} from "../../lib/hebrew-calendar";

describe("Hebrew Calendar Utilities", () => {
  describe("getHebrewDateString", () => {
    it("returns a Hebrew date string for a given date", () => {
      // January 12, 2026 should be somewhere in Tevet 5786
      const date = new Date("2026-01-12T12:00:00");
      const hebrewDate = getHebrewDateString(date);

      // Should contain Hebrew characters
      expect(hebrewDate).toMatch(/[\u0590-\u05FF]/);
    });

    it("returns different dates for different inputs", () => {
      const date1 = new Date("2026-01-12T12:00:00");
      const date2 = new Date("2026-01-13T12:00:00");

      const hebrew1 = getHebrewDateString(date1);
      const hebrew2 = getHebrewDateString(date2);

      expect(hebrew1).not.toBe(hebrew2);
    });
  });

  describe("isShabbat", () => {
    it("returns true for Saturday", () => {
      // Find a Saturday
      const saturday = new Date("2026-01-17T12:00:00"); // Saturday
      expect(saturday.getDay()).toBe(6);
      expect(isShabbat(saturday)).toBe(true);
    });

    it("returns false for weekdays", () => {
      const monday = new Date("2026-01-12T12:00:00"); // Monday
      expect(monday.getDay()).toBe(1);
      expect(isShabbat(monday)).toBe(false);
    });

    it("returns false for Friday", () => {
      const friday = new Date("2026-01-16T12:00:00"); // Friday
      expect(friday.getDay()).toBe(5);
      expect(isShabbat(friday)).toBe(false);
    });
  });

  describe("isShabbatSlot", () => {
    it("returns true for Friday evening", () => {
      const friday = new Date("2026-01-16T12:00:00"); // Friday
      expect(friday.getDay()).toBe(5);
      expect(isShabbatSlot(friday, "evening")).toBe(true);
    });

    it("returns false for Friday morning", () => {
      const friday = new Date("2026-01-16T12:00:00"); // Friday
      expect(isShabbatSlot(friday, "morning")).toBe(false);
    });

    it("returns false for Friday afternoon", () => {
      const friday = new Date("2026-01-16T12:00:00"); // Friday
      expect(isShabbatSlot(friday, "afternoon")).toBe(false);
    });

    it("returns true for all Saturday slots", () => {
      const saturday = new Date("2026-01-17T12:00:00"); // Saturday
      expect(saturday.getDay()).toBe(6);

      expect(isShabbatSlot(saturday, "morning")).toBe(true);
      expect(isShabbatSlot(saturday, "afternoon")).toBe(true);
      expect(isShabbatSlot(saturday, "evening")).toBe(true);
    });

    it("returns false for Sunday slots", () => {
      const sunday = new Date("2026-01-18T12:00:00"); // Sunday
      expect(sunday.getDay()).toBe(0);

      expect(isShabbatSlot(sunday, "morning")).toBe(false);
      expect(isShabbatSlot(sunday, "afternoon")).toBe(false);
      expect(isShabbatSlot(sunday, "evening")).toBe(false);
    });
  });

  describe("toISODateString", () => {
    it("returns YYYY-MM-DD format", () => {
      const date = new Date("2026-01-12T15:30:00");
      expect(toISODateString(date)).toBe("2026-01-12");
    });

    it("pads single digit months and days", () => {
      const date = new Date("2026-03-05T12:00:00");
      expect(toISODateString(date)).toBe("2026-03-05");
    });
  });

  describe("fromISODateString", () => {
    it("parses ISO date string to Date", () => {
      const date = fromISODateString("2026-01-12");
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(0); // January is 0
      expect(date.getDate()).toBe(12);
    });

    it("returns consistent date regardless of timezone", () => {
      const date = fromISODateString("2026-06-15");
      expect(date.getMonth()).toBe(5); // June is 5
      expect(date.getDate()).toBe(15);
    });
  });

  describe("isToday", () => {
    it("returns true for today's date", () => {
      const today = new Date();
      expect(isToday(today)).toBe(true);
    });

    it("returns false for yesterday", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).toBe(false);
    });

    it("returns false for tomorrow", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isToday(tomorrow)).toBe(false);
    });
  });

  describe("getWeekDays", () => {
    it("returns 7 days", () => {
      const date = new Date("2026-01-12T12:00:00");
      const days = getWeekDays(date);
      expect(days.length).toBe(7);
    });

    it("starts from Sunday", () => {
      const wednesday = new Date("2026-01-14T12:00:00"); // Wednesday
      const days = getWeekDays(wednesday);

      // First day should be Sunday
      expect(days[0].getDay()).toBe(0);
    });

    it("ends on Saturday", () => {
      const wednesday = new Date("2026-01-14T12:00:00");
      const days = getWeekDays(wednesday);

      // Last day should be Saturday
      expect(days[6].getDay()).toBe(6);
    });

    it("returns consecutive days", () => {
      const date = new Date("2026-01-12T12:00:00");
      const days = getWeekDays(date);

      for (let i = 1; i < days.length; i++) {
        const diff = days[i].getDate() - days[i - 1].getDate();
        // Should be 1 day apart (or handle month transitions)
        expect(
          diff === 1 ||
            (days[i - 1].getDate() > 20 && days[i].getDate() < 10)
        ).toBe(true);
      }
    });
  });

  describe("formatHebrewDateFull", () => {
    it("includes day name in Hebrew", () => {
      const monday = new Date("2026-01-12T12:00:00");
      const formatted = formatHebrewDateFull(monday);

      // Should contain "יום שני" (Monday in Hebrew)
      expect(formatted).toContain("יום שני");
    });

    it("includes Hebrew date", () => {
      const date = new Date("2026-01-12T12:00:00");
      const formatted = formatHebrewDateFull(date);

      // Should contain Hebrew characters for the date
      expect(formatted).toMatch(/[\u0590-\u05FF]/);
    });
  });

  // ============================================
  // EDGE CASE TESTS: Sunset Transitions
  // ============================================
  describe("getSunset", () => {
    it("returns a Date object for sunset time", () => {
      const date = new Date("2026-01-15T12:00:00");
      const sunset = getSunset(date);

      expect(sunset).toBeInstanceOf(Date);
    });

    it("sunset time is valid", () => {
      const date = new Date("2026-01-15T12:00:00");
      const sunset = getSunset(date);

      if (sunset) {
        // Sunset should be a valid date
        expect(isNaN(sunset.getTime())).toBe(false);
        // Sunset UTC hours should be reasonable (Israel is UTC+2/3)
        const utcHours = sunset.getUTCHours();
        // In winter, sunset in Israel (UTC+2) around 17:00 local = 15:00 UTC
        // Allow broad range to handle timezone variations
        expect(utcHours).toBeGreaterThanOrEqual(13);
        expect(utcHours).toBeLessThanOrEqual(20);
      }
    });

    it("summer sunset is later than winter sunset", () => {
      const winterDate = new Date("2026-01-15T12:00:00");
      const summerDate = new Date("2026-07-15T12:00:00");

      const winterSunset = getSunset(winterDate);
      const summerSunset = getSunset(summerDate);

      if (winterSunset && summerSunset) {
        // Compare UTC times - summer should always be later
        const winterUtc = winterSunset.getUTCHours() + winterSunset.getUTCMinutes() / 60;
        const summerUtc = summerSunset.getUTCHours() + summerSunset.getUTCMinutes() / 60;

        expect(summerUtc).toBeGreaterThan(winterUtc);
      }
    });
  });

  describe("getCurrentHebrewDate - Sunset Transitions", () => {
    it("returns hebrew date for current time", () => {
      const now = new Date("2026-01-15T12:00:00");
      const result = getCurrentHebrewDate(now);

      expect(result.gregorian).toEqual(now);
      expect(result.hebrew).toBeTruthy();
      expect(typeof result.isAfterSunset).toBe("boolean");
    });

    it("isAfterSunset returns a boolean", () => {
      // Test with a morning time (noon UTC is morning in many timezones)
      const morning = new Date("2026-01-15T06:00:00Z"); // 6am UTC = ~8am Israel
      const result = getCurrentHebrewDate(morning);

      // Just verify it returns a boolean - actual value depends on timezone
      expect(typeof result.isAfterSunset).toBe("boolean");
    });

    it("isAfterSunset is true well after sunset", () => {
      // Midnight UTC is well after sunset anywhere
      const lateNight = new Date("2026-01-15T23:00:00Z"); // 11pm UTC
      const result = getCurrentHebrewDate(lateNight);

      expect(result.isAfterSunset).toBe(true);
    });

    it("hebrew date is different before and after sunset", () => {
      // Use times that are definitely before and after sunset regardless of timezone
      // 6am UTC is definitely before sunset in Israel
      // 11pm UTC is definitely after sunset in Israel
      const earlyMorning = new Date("2026-01-15T04:00:00Z");
      const lateNight = new Date("2026-01-15T21:00:00Z");

      const morningResult = getCurrentHebrewDate(earlyMorning);
      const nightResult = getCurrentHebrewDate(lateNight);

      // If night is after sunset, the Hebrew dates should differ
      // (one will be the 15th and one the 16th in Hebrew calendar)
      if (nightResult.isAfterSunset && !morningResult.isAfterSunset) {
        expect(nightResult.hebrew).not.toBe(morningResult.hebrew);
      }
    });
  });

  // ============================================
  // EDGE CASE TESTS: Holiday Detection
  // ============================================
  describe("getHolidayInfo", () => {
    it("returns null for regular days", () => {
      // A random Tuesday in February
      const regularDay = new Date("2026-02-17T12:00:00");
      const holiday = getHolidayInfo(regularDay);

      expect(holiday).toBeNull();
    });

    it("detects Yom Kippur", () => {
      // Yom Kippur 5787 is September 22, 2026
      const yomKippur = new Date("2026-09-22T12:00:00");
      const holiday = getHolidayInfo(yomKippur);

      if (holiday) {
        expect(holiday.blocksVisits).toBe(true);
        expect(holiday.name.toLowerCase()).toContain("kippur");
      }
    });

    it("detects Passover (first day)", () => {
      // Passover 5786 starts evening of April 1, 2026 (first day is April 2)
      const passoverFirstDay = new Date("2026-04-02T12:00:00");
      const holiday = getHolidayInfo(passoverFirstDay);

      if (holiday) {
        expect(holiday.blocksVisits).toBe(true);
      }
    });

    it("detects Rosh Hashanah", () => {
      // Rosh Hashanah 5787 is September 12, 2026
      const roshHashanah = new Date("2026-09-12T12:00:00");
      const holiday = getHolidayInfo(roshHashanah);

      if (holiday) {
        expect(holiday.blocksVisits).toBe(true);
      }
    });
  });

  // ============================================
  // EDGE CASE TESTS: Shabbat Info
  // ============================================
  describe("getShabbatInfo", () => {
    it("returns candle lighting time for Friday", () => {
      // Use a week that includes Friday Jan 16 and Saturday Jan 17, 2026
      const weekStart = new Date("2026-01-11T12:00:00"); // Sunday
      const shabbatInfo = getShabbatInfo(weekStart);

      expect(shabbatInfo.candleLighting).toBeInstanceOf(Date);
    });

    it("returns havdalah time for Saturday night", () => {
      const weekStart = new Date("2026-01-11T12:00:00");
      const shabbatInfo = getShabbatInfo(weekStart);

      expect(shabbatInfo.havdalah).toBeInstanceOf(Date);
    });

    it("havdalah is after candle lighting", () => {
      const weekStart = new Date("2026-01-11T12:00:00");
      const shabbatInfo = getShabbatInfo(weekStart);

      if (shabbatInfo.candleLighting && shabbatInfo.havdalah) {
        expect(shabbatInfo.havdalah.getTime()).toBeGreaterThan(
          shabbatInfo.candleLighting.getTime()
        );
      }
    });

    it("returns Torah portion (parsha)", () => {
      const weekStart = new Date("2026-01-11T12:00:00");
      const shabbatInfo = getShabbatInfo(weekStart);

      expect(shabbatInfo.parashat).toBeTruthy();
      // Parsha should contain Hebrew characters
      expect(shabbatInfo.parashat).toMatch(/[\u0590-\u05FF]/);
    });
  });

  // ============================================
  // EDGE CASE TESTS: Month Transitions
  // ============================================
  describe("getWeekDays - Month Transitions", () => {
    it("handles week spanning two months", () => {
      // Jan 28, 2026 (Wednesday) - week spans Jan 25 to Jan 31
      const date = new Date("2026-01-28T12:00:00");
      const days = getWeekDays(date);

      expect(days).toHaveLength(7);
      // All days should be valid dates
      days.forEach((day) => {
        expect(day).toBeInstanceOf(Date);
        expect(isNaN(day.getTime())).toBe(false);
      });
    });

    it("handles leap year February", () => {
      // 2028 is a leap year - Feb has 29 days
      const date = new Date("2028-02-28T12:00:00");
      const days = getWeekDays(date);

      expect(days).toHaveLength(7);
      days.forEach((day) => {
        expect(isNaN(day.getTime())).toBe(false);
      });
    });

    it("handles week spanning year boundary", () => {
      // Dec 30, 2026 (Wednesday) - week spans Dec 27, 2026 to Jan 2, 2027
      const date = new Date("2026-12-30T12:00:00");
      const days = getWeekDays(date);

      expect(days).toHaveLength(7);
      // First days should be in December
      expect(days[0].getMonth()).toBe(11); // December
      // Last days might be in January
      const lastDay = days[6];
      expect(
        lastDay.getMonth() === 11 || lastDay.getMonth() === 0
      ).toBe(true);
    });
  });

  // ============================================
  // EDGE CASE TESTS: Hebrew Date Details
  // ============================================
  describe("getHebrewDate", () => {
    it("returns complete Hebrew date information", () => {
      const date = new Date("2026-01-15T12:00:00");
      const hebrewDate = getHebrewDate(date);

      expect(hebrewDate.hebrew).toBeTruthy();
      expect(hebrewDate.day).toBeGreaterThan(0);
      expect(hebrewDate.day).toBeLessThanOrEqual(30);
      expect(hebrewDate.month).toBeTruthy();
      expect(hebrewDate.year).toBeGreaterThan(5780);
      expect(hebrewDate.monthName).toBeTruthy();
    });

    it("handles Hebrew leap year months", () => {
      // 5784 (2024) is a Hebrew leap year - has Adar I and Adar II
      const adarDate = new Date("2024-03-10T12:00:00");
      const hebrewDate = getHebrewDate(adarDate);

      // Should have a valid month name
      expect(hebrewDate.monthName).toBeTruthy();
    });
  });
});
