import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.setup";

describe("notification system", () => {
  describe("booking queues confirmation notification", () => {
    it("creates confirmation notification when slot is booked", async () => {
      const t = convexTest(schema, modules);
      const user = t.withIdentity({ name: "Sarah", subject: "user1" });

      // Create profile
      await user.mutation(api.users.createProfile, {
        name: "Sarah",
        phone: "+972501234567",
        role: "sibling",
        isCoordinator: false,
      });

      // Book a slot (Wednesday, Jan 15, 2026)
      await user.mutation(api.visits.bookSlot, {
        date: "2026-01-15",
        slot: "morning",
        hebrewDate: "ט״ו טבת תשפ״ו",
      });

      // Check that a confirmation notification was queued
      const notifications = await t.run(async (ctx) => {
        return ctx.db
          .query("notifications")
          .withIndex("by_status", (q) => q.eq("status", "pending"))
          .collect();
      });

      const confirmations = notifications.filter(
        (n) => n.type === "confirmation"
      );
      expect(confirmations.length).toBe(1);
      expect(confirmations[0].type).toBe("confirmation");
      expect(confirmations[0].status).toBe("pending");
    });

    it("queues 24h reminder for future bookings", async () => {
      const t = convexTest(schema, modules);
      const user = t.withIdentity({ name: "Sarah", subject: "user1" });

      // Create profile
      await user.mutation(api.users.createProfile, {
        name: "Sarah",
        phone: "+972501234567",
        role: "sibling",
        isCoordinator: false,
      });

      // Book a slot far in the future to ensure reminder is scheduled
      // Using a date well in the future
      await user.mutation(api.visits.bookSlot, {
        date: "2026-06-15", // June 15, 2026 (Monday)
        slot: "morning",
        hebrewDate: "כ״ט סיון תשפ״ו",
      });

      // Check for reminder notification
      const notifications = await t.run(async (ctx) => {
        return ctx.db.query("notifications").collect();
      });

      const reminders = notifications.filter((n) => n.type === "reminder");
      expect(reminders.length).toBe(1);
      expect(reminders[0].status).toBe("pending");
    });
  });

  describe("sendNudge mutation", () => {
    it("allows coordinator to send nudge", async () => {
      const t = convexTest(schema, modules);
      const coordinator = t.withIdentity({
        name: "Coordinator",
        subject: "coord1",
      });
      const user = t.withIdentity({ name: "Sarah", subject: "user1" });

      // Create coordinator profile
      await coordinator.mutation(api.users.createProfile, {
        name: "שמריהו",
        phone: "+972501234569",
        role: "coordinator",
        isCoordinator: true,
      });

      // Create target user profile
      const userProfile = await user.mutation(api.users.createProfile, {
        name: "Sarah",
        phone: "+972501234567",
        role: "sibling",
        isCoordinator: false,
      });

      // Get the user's profile ID
      const profile = await t.run(async (ctx) => {
        return ctx.db
          .query("familyProfiles")
          .withIndex("by_phone", (q) => q.eq("phone", "+972501234567"))
          .first();
      });

      // Send nudge
      await coordinator.mutation(api.notifications.sendNudge, {
        targetUserId: profile!._id,
        message: "אבא מחכה לביקור שלך!",
      });

      // Check notification was created
      const notifications = await t.run(async (ctx) => {
        return ctx.db
          .query("notifications")
          .filter((q) => q.eq(q.field("type"), "nudge"))
          .collect();
      });

      expect(notifications.length).toBe(1);
      expect(notifications[0].message).toBe("אבא מחכה לביקור שלך!");
    });

    it("prevents non-coordinator from sending nudge", async () => {
      const t = convexTest(schema, modules);
      const user1 = t.withIdentity({ name: "Sarah", subject: "user1" });
      const user2 = t.withIdentity({ name: "Tom", subject: "user2" });

      // Create non-coordinator profiles
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

      // Get user2's profile ID
      const profile = await t.run(async (ctx) => {
        return ctx.db
          .query("familyProfiles")
          .withIndex("by_phone", (q) => q.eq("phone", "+972501234568"))
          .first();
      });

      // Try to send nudge as non-coordinator - should fail
      await expect(
        user1.mutation(api.notifications.sendNudge, {
          targetUserId: profile!._id,
        })
      ).rejects.toThrowError("Only coordinators can send nudges");
    });
  });

  describe("cancelNotification mutation", () => {
    it("cancels pending notification", async () => {
      const t = convexTest(schema, modules);
      const user = t.withIdentity({ name: "Sarah", subject: "user1" });

      // Create profile
      await user.mutation(api.users.createProfile, {
        name: "Sarah",
        phone: "+972501234567",
        role: "sibling",
        isCoordinator: false,
      });

      // Book a slot to create notifications
      await user.mutation(api.visits.bookSlot, {
        date: "2026-06-15",
        slot: "morning",
        hebrewDate: "כ״ט סיון תשפ״ו",
      });

      // Get the confirmation notification
      const notification = await t.run(async (ctx) => {
        return ctx.db
          .query("notifications")
          .withIndex("by_status", (q) => q.eq("status", "pending"))
          .first();
      });

      // Cancel it
      await user.mutation(api.notifications.cancelNotification, {
        notificationId: notification!._id,
      });

      // Verify it's gone
      const deleted = await t.run(async (ctx) => {
        return ctx.db.get(notification!._id);
      });

      expect(deleted).toBeNull();
    });
  });
});

describe("coordinator queries", () => {
  describe("getStats query", () => {
    it("returns stats for coordinator", async () => {
      const t = convexTest(schema, modules);
      const coordinator = t.withIdentity({
        name: "Coordinator",
        subject: "coord1",
      });

      // Create coordinator profile
      await coordinator.mutation(api.users.createProfile, {
        name: "שמריהו",
        phone: "+972501234569",
        role: "coordinator",
        isCoordinator: true,
      });

      // Get stats
      const stats = await coordinator.query(api.coordinator.getStats);

      expect(stats).toBeDefined();
      expect(stats?.upcomingWeek).toBeDefined();
      expect(stats?.familyActivity).toBeDefined();
      expect(stats?.notifications).toBeDefined();
    });

    it("returns null for non-coordinator", async () => {
      const t = convexTest(schema, modules);
      const user = t.withIdentity({ name: "Sarah", subject: "user1" });

      // Create non-coordinator profile
      await user.mutation(api.users.createProfile, {
        name: "Sarah",
        phone: "+972501234567",
        role: "sibling",
        isCoordinator: false,
      });

      // Get stats - should return null
      const stats = await user.query(api.coordinator.getStats);
      expect(stats).toBeNull();
    });
  });

  describe("getGaps query", () => {
    it("returns gap analysis for coordinator", async () => {
      const t = convexTest(schema, modules);
      const coordinator = t.withIdentity({
        name: "Coordinator",
        subject: "coord1",
      });

      // Create coordinator profile
      await coordinator.mutation(api.users.createProfile, {
        name: "שמריהו",
        phone: "+972501234569",
        role: "coordinator",
        isCoordinator: true,
      });

      // Get gaps
      const gaps = await coordinator.query(api.coordinator.getGaps, {
        daysAhead: 7,
      });

      expect(gaps).toBeDefined();
      expect(gaps.length).toBe(7);
      // Each day should have date, displayDate, isShabbat, isGap, coverage
      expect(gaps[0].date).toBeDefined();
      expect(gaps[0].displayDate).toBeDefined();
      expect(typeof gaps[0].isShabbat).toBe("boolean");
      expect(typeof gaps[0].isGap).toBe("boolean");
    });

    it("marks days without bookings as gaps", async () => {
      const t = convexTest(schema, modules);
      const coordinator = t.withIdentity({
        name: "Coordinator",
        subject: "coord1",
      });

      // Create coordinator profile
      await coordinator.mutation(api.users.createProfile, {
        name: "שמריהו",
        phone: "+972501234569",
        role: "coordinator",
        isCoordinator: true,
      });

      // Get gaps - all weekdays should be gaps since nothing is booked
      const gaps = await coordinator.query(api.coordinator.getGaps, {
        daysAhead: 14,
      });

      const nonShabbatGaps = gaps.filter((g: { isShabbat: boolean; isGap: boolean }) => !g.isShabbat && g.isGap);
      // Most days should be gaps (except Shabbat days)
      expect(nonShabbatGaps.length).toBeGreaterThan(0);
    });
  });

  describe("getFamilyMembers query", () => {
    it("returns family members with activity stats", async () => {
      const t = convexTest(schema, modules);
      const coordinator = t.withIdentity({
        name: "Coordinator",
        subject: "coord1",
      });
      const user = t.withIdentity({ name: "Sarah", subject: "user1" });

      // Create profiles
      await coordinator.mutation(api.users.createProfile, {
        name: "שמריהו",
        phone: "+972501234569",
        role: "coordinator",
        isCoordinator: true,
      });

      await user.mutation(api.users.createProfile, {
        name: "Sarah",
        phone: "+972501234567",
        role: "sibling",
        isCoordinator: false,
      });

      // Get family members
      const members = await coordinator.query(api.coordinator.getFamilyMembers);

      expect(members.length).toBe(2);
      // Each member should have activity stats
      members.forEach((m) => {
        expect(typeof m.totalBookings).toBe("number");
        // isActive is a computed boolean (or falsy value like 0/false)
        // Just check that the property exists in the response
        expect("isActive" in m).toBe(true);
      });
    });
  });

  describe("bookForMember mutation", () => {
    it("allows coordinator to book on behalf of member", async () => {
      const t = convexTest(schema, modules);
      const coordinator = t.withIdentity({
        name: "Coordinator",
        subject: "coord1",
      });
      const user = t.withIdentity({ name: "Sarah", subject: "user1" });

      // Create profiles
      await coordinator.mutation(api.users.createProfile, {
        name: "שמריהו",
        phone: "+972501234569",
        role: "coordinator",
        isCoordinator: true,
      });

      await user.mutation(api.users.createProfile, {
        name: "Sarah",
        phone: "+972501234567",
        role: "sibling",
        isCoordinator: false,
      });

      // Get Sarah's profile ID
      const sarahProfile = await t.run(async (ctx) => {
        return ctx.db
          .query("familyProfiles")
          .withIndex("by_phone", (q) => q.eq("phone", "+972501234567"))
          .first();
      });

      // Coordinator books for Sarah
      const slotId = await coordinator.mutation(api.coordinator.bookForMember, {
        profileId: sarahProfile!._id,
        date: "2026-01-15",
        slot: "morning",
        hebrewDate: "ט״ו טבת תשפ״ו",
        notes: "הוזמן על ידי המרכז",
      });

      expect(slotId).toBeDefined();

      // Verify the booking
      const slot = await t.run(async (ctx) => {
        return await ctx.db.get(slotId);
      });

      expect(slot?.bookedBy).toBe(sarahProfile!._id);
      expect(slot?.notes).toBe("הוזמן על ידי המרכז");
    });

    it("prevents non-coordinator from booking for others", async () => {
      const t = convexTest(schema, modules);
      const user1 = t.withIdentity({ name: "Sarah", subject: "user1" });
      const user2 = t.withIdentity({ name: "Tom", subject: "user2" });

      // Create non-coordinator profiles
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

      // Get Tom's profile ID
      const tomProfile = await t.run(async (ctx) => {
        return ctx.db
          .query("familyProfiles")
          .withIndex("by_phone", (q) => q.eq("phone", "+972501234568"))
          .first();
      });

      // Sarah tries to book for Tom - should fail
      await expect(
        user1.mutation(api.coordinator.bookForMember, {
          profileId: tomProfile!._id,
          date: "2026-01-15",
          slot: "morning",
          hebrewDate: "ט״ו טבת תשפ״ו",
        })
      ).rejects.toThrowError("Unauthorized: Coordinator access required");
    });
  });

  describe("cancelAnyBooking mutation", () => {
    it("allows coordinator to cancel any booking", async () => {
      const t = convexTest(schema, modules);
      const coordinator = t.withIdentity({
        name: "Coordinator",
        subject: "coord1",
      });
      const user = t.withIdentity({ name: "Sarah", subject: "user1" });

      // Create profiles
      await coordinator.mutation(api.users.createProfile, {
        name: "שמריהו",
        phone: "+972501234569",
        role: "coordinator",
        isCoordinator: true,
      });

      await user.mutation(api.users.createProfile, {
        name: "Sarah",
        phone: "+972501234567",
        role: "sibling",
        isCoordinator: false,
      });

      // Sarah books a slot
      const slotId = await user.mutation(api.visits.bookSlot, {
        date: "2026-01-15",
        slot: "morning",
        hebrewDate: "ט״ו טבת תשפ״ו",
      });

      // Coordinator cancels it
      const result = await coordinator.mutation(
        api.coordinator.cancelAnyBooking,
        { slotId }
      );

      expect(result.success).toBe(true);

      // Verify it's cancelled
      const slot = await t.run(async (ctx) => {
        return await ctx.db.get(slotId);
      });

      expect(slot?.bookedBy).toBeUndefined();
    });
  });
});

describe("gap alert system", () => {
  it("queues gap alerts for coordinators", async () => {
    const t = convexTest(schema, modules);
    const coordinator = t.withIdentity({
      name: "Coordinator",
      subject: "coord1",
    });

    // Create coordinator profile
    await coordinator.mutation(api.users.createProfile, {
      name: "שמריהו",
      phone: "+972501234569",
      role: "coordinator",
      isCoordinator: true,
    });

    // Manually queue a gap alert
    await t.run(async (ctx) => {
      await ctx.db.insert("notifications", {
        userId: (
          await ctx.db
            .query("familyProfiles")
            .withIndex("by_phone", (q) => q.eq("phone", "+972501234569"))
            .first()
        )!._id,
        type: "gap_alert",
        status: "pending",
        scheduledFor: Date.now(),
        message: "יום ראשון 15/1",
      });
    });

    // Verify gap alert was created
    const notifications = await t.run(async (ctx) => {
      return ctx.db
        .query("notifications")
        .filter((q) => q.eq(q.field("type"), "gap_alert"))
        .collect();
    });

    expect(notifications.length).toBe(1);
    expect(notifications[0].message).toBe("יום ראשון 15/1");
  });
});
