import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.setup";

describe("bookSlot mutation", () => {
  it("prevents double-booking same slot", async () => {
    const t = convexTest(schema, modules);

    // Create two authenticated users
    const user1 = t.withIdentity({ name: "Sarah", subject: "user1" });
    const user2 = t.withIdentity({ name: "Tom", subject: "user2" });

    // First, create profiles for both users
    await user1.mutation(api.users.createProfile, {
      name: "Sarah",
      phone: "+972501234567",
      role: "sibling",
      isCoordinator: false,
    });

    await user2.mutation(api.users.createProfile, {
      name: "Tom",
      phone: "+972501234568",
      role: "sibling",
      isCoordinator: false,
    });

    // User 1 books a slot (Wednesday, Jan 15, 2026)
    await user1.mutation(api.visits.bookSlot, {
      date: "2026-01-15",
      slot: "morning",
      hebrewDate: "ט״ו טבת תשפ״ו",
    });

    // User 2 tries to book the same slot - should fail
    await expect(
      user2.mutation(api.visits.bookSlot, {
        date: "2026-01-15",
        slot: "morning",
        hebrewDate: "ט״ו טבת תשפ״ו",
      })
    ).rejects.toThrowError("Conflict: This slot is already booked");
  });

  it("blocks booking during Shabbat - Friday evening", async () => {
    const t = convexTest(schema, modules);
    const user = t.withIdentity({ name: "Sarah", subject: "user1" });

    // Create profile
    await user.mutation(api.users.createProfile, {
      name: "Sarah",
      phone: "+972501234567",
      role: "sibling",
      isCoordinator: false,
    });

    // Try to book Friday evening (January 16, 2026 is a Friday)
    await expect(
      user.mutation(api.visits.bookSlot, {
        date: "2026-01-16",
        slot: "evening",
        hebrewDate: "ט״ז טבת תשפ״ו",
      })
    ).rejects.toThrowError("Cannot book: This slot falls during Shabbat");
  });

  it("blocks booking during Shabbat - Saturday", async () => {
    const t = convexTest(schema, modules);
    const user = t.withIdentity({ name: "Sarah", subject: "user1" });

    // Create profile
    await user.mutation(api.users.createProfile, {
      name: "Sarah",
      phone: "+972501234567",
      role: "sibling",
      isCoordinator: false,
    });

    // Try to book Saturday morning (January 17, 2026 is a Saturday)
    await expect(
      user.mutation(api.visits.bookSlot, {
        date: "2026-01-17",
        slot: "morning",
        hebrewDate: "י״ז טבת תשפ״ו",
      })
    ).rejects.toThrowError("Cannot book: This slot falls during Shabbat");
  });

  it("allows Friday morning and afternoon booking", async () => {
    const t = convexTest(schema, modules);
    const user = t.withIdentity({ name: "Sarah", subject: "user1" });

    // Create profile
    await user.mutation(api.users.createProfile, {
      name: "Sarah",
      phone: "+972501234567",
      role: "sibling",
      isCoordinator: false,
    });

    // Friday morning should be allowed (January 16, 2026)
    const morningSlotId = await user.mutation(api.visits.bookSlot, {
      date: "2026-01-16",
      slot: "morning",
      hebrewDate: "ט״ז טבת תשפ״ו",
    });

    expect(morningSlotId).toBeDefined();

    // Friday afternoon should also be allowed
    const afternoonSlotId = await user.mutation(api.visits.bookSlot, {
      date: "2026-01-16",
      slot: "afternoon",
      hebrewDate: "ט״ז טבת תשפ״ו",
    });

    expect(afternoonSlotId).toBeDefined();
  });

  it("allows booking on regular weekdays", async () => {
    const t = convexTest(schema, modules);
    const user = t.withIdentity({ name: "Sarah", subject: "user1" });

    // Create profile
    await user.mutation(api.users.createProfile, {
      name: "Sarah",
      phone: "+972501234567",
      role: "sibling",
      isCoordinator: false,
    });

    // Book a regular weekday slot (Thursday, January 15, 2026)
    const slotId = await user.mutation(api.visits.bookSlot, {
      date: "2026-01-15",
      slot: "afternoon",
      hebrewDate: "ט״ו טבת תשפ״ו",
      notes: "עם הילדים",
    });

    expect(slotId).toBeDefined();

    // Verify the slot is booked
    const slot = await user.query(api.visits.getSlot, {
      date: "2026-01-15",
      slot: "afternoon",
    });

    expect(slot).toBeDefined();
    expect(slot?.bookedBy).toBeDefined();
    expect(slot?.notes).toBe("עם הילדים");
  });

  it("requires authentication", async () => {
    const t = convexTest(schema, modules);

    // Try to book without authentication
    await expect(
      t.mutation(api.visits.bookSlot, {
        date: "2026-01-15",
        slot: "morning",
        hebrewDate: "ט״ו טבת תשפ״ו",
      })
    ).rejects.toThrowError("Unauthorized: Must be logged in to book a slot");
  });

  it("requires a profile", async () => {
    const t = convexTest(schema, modules);
    const user = t.withIdentity({ name: "Sarah", subject: "user1" });

    // Try to book without creating a profile first
    await expect(
      user.mutation(api.visits.bookSlot, {
        date: "2026-01-15",
        slot: "morning",
        hebrewDate: "ט״ו טבת תשפ״ו",
      })
    ).rejects.toThrowError(
      "Profile not found: Please complete your profile first"
    );
  });
});

describe("cancelSlot mutation", () => {
  it("removes booking when cancelled by booker", async () => {
    const t = convexTest(schema, modules);
    const user = t.withIdentity({ name: "Sarah", subject: "user1" });

    // Create profile
    await user.mutation(api.users.createProfile, {
      name: "Sarah",
      phone: "+972501234567",
      role: "sibling",
      isCoordinator: false,
    });

    // Book a slot
    const slotId = await user.mutation(api.visits.bookSlot, {
      date: "2026-01-15",
      slot: "morning",
      hebrewDate: "ט״ו טבת תשפ״ו",
    });

    // Cancel the slot
    const result = await user.mutation(api.visits.cancelSlot, {
      slotId,
    });

    expect(result.success).toBe(true);

    // Verify slot is now available
    const slot = await user.query(api.visits.getSlot, {
      date: "2026-01-15",
      slot: "morning",
    });

    expect(slot?.bookedBy).toBeUndefined();
  });

  it("allows coordinator to cancel any booking", async () => {
    const t = convexTest(schema, modules);
    const user = t.withIdentity({ name: "Sarah", subject: "user1" });
    const coordinator = t.withIdentity({
      name: "Coordinator",
      subject: "coord1",
    });

    // Create user profile
    await user.mutation(api.users.createProfile, {
      name: "Sarah",
      phone: "+972501234567",
      role: "sibling",
      isCoordinator: false,
    });

    // Create coordinator profile
    await coordinator.mutation(api.users.createProfile, {
      name: "שמריהו",
      phone: "+972501234569",
      role: "coordinator",
      isCoordinator: true,
    });

    // User books a slot
    const slotId = await user.mutation(api.visits.bookSlot, {
      date: "2026-01-15",
      slot: "morning",
      hebrewDate: "ט״ו טבת תשפ״ו",
    });

    // Coordinator cancels the slot
    const result = await coordinator.mutation(api.visits.cancelSlot, {
      slotId,
    });

    expect(result.success).toBe(true);
  });

  it("prevents non-owner non-coordinator from cancelling", async () => {
    const t = convexTest(schema, modules);
    const user1 = t.withIdentity({ name: "Sarah", subject: "user1" });
    const user2 = t.withIdentity({ name: "Tom", subject: "user2" });

    // Create profiles
    await user1.mutation(api.users.createProfile, {
      name: "Sarah",
      phone: "+972501234567",
      role: "sibling",
      isCoordinator: false,
    });

    await user2.mutation(api.users.createProfile, {
      name: "Tom",
      phone: "+972501234568",
      role: "sibling",
      isCoordinator: false,
    });

    // User 1 books a slot
    const slotId = await user1.mutation(api.visits.bookSlot, {
      date: "2026-01-15",
      slot: "morning",
      hebrewDate: "ט״ו טבת תשפ״ו",
    });

    // User 2 tries to cancel - should fail
    await expect(
      user2.mutation(api.visits.cancelSlot, { slotId })
    ).rejects.toThrowError("Unauthorized: Can only cancel your own bookings");
  });

  it("requires authentication", async () => {
    const t = convexTest(schema, modules);
    const user = t.withIdentity({ name: "Sarah", subject: "user1" });

    // Create profile and book a slot
    await user.mutation(api.users.createProfile, {
      name: "Sarah",
      phone: "+972501234567",
      role: "sibling",
      isCoordinator: false,
    });

    const slotId = await user.mutation(api.visits.bookSlot, {
      date: "2026-01-15",
      slot: "morning",
      hebrewDate: "ט״ו טבת תשפ״ו",
    });

    // Try to cancel without authentication
    await expect(
      t.mutation(api.visits.cancelSlot, { slotId })
    ).rejects.toThrowError(
      "Unauthorized: Must be logged in to cancel a booking"
    );
  });
});

describe("getSchedule query", () => {
  it("returns slots with booker profile information", async () => {
    const t = convexTest(schema, modules);
    const user = t.withIdentity({ name: "Sarah", subject: "user1" });

    // Create profile
    await user.mutation(api.users.createProfile, {
      name: "שרה",
      hebrewName: "שרה",
      phone: "+972501234567",
      role: "sibling",
      isCoordinator: false,
      avatarGradient: "from-pink-400 to-pink-600",
    });

    // Book a slot
    await user.mutation(api.visits.bookSlot, {
      date: "2026-01-15",
      slot: "morning",
      hebrewDate: "ט״ו טבת תשפ״ו",
    });

    // Get schedule
    const schedule = await user.query(api.visits.getSchedule, {
      startDate: "2026-01-01",
      endDate: "2026-01-31",
    });

    expect(schedule.length).toBe(1);
    expect(schedule[0].bookedByProfile).toBeDefined();
    expect(schedule[0].bookedByProfile?.name).toBe("שרה");
    expect(schedule[0].bookedByProfile?.avatarGradient).toBe(
      "from-pink-400 to-pink-600"
    );
  });
});
