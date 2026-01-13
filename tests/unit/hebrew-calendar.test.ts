import { describe, it, expect } from "vitest";
import {
  getHebrewDateString,
  isShabbat,
  isShabbatSlot,
  toISODateString,
  fromISODateString,
  isToday,
  getWeekDays,
  formatHebrewDateFull,
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
});
