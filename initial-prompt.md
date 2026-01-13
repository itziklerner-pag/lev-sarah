# LERNER FAMILY VISIT SCHEDULER - Complete Development Guide

## Project Overview

Build a mobile-first PWA for coordinating family visits with an elderly father ("Abba") in Kfar Chabad, Israel. The system serves 7 adult children, their spouses, and ~15 adult grandchildren.

**Core Principle**: "If it's harder than WhatsApp, people won't use it."

## Technology Stack (LOCKED)

- **Frontend**: Next.js 16.1+ with Turbopack, Tailwind CSS, PWA
- **Backend**: Convex (database, auth, realtime, scheduled functions)
- **Deployment**: Vercel
- **Notifications**: Twilio WhatsApp API (templates pre-approved)
- **Hebrew Calendar**: @hebcal/core v6+ (ES modules, client-side)
- **Testing**: Vitest (unit/component) + Playwright (E2E) + convex-test

## Development Approach

- **TDD**: Write tests first, then implement
- **Parallel Agents**: Use 4 focused agents (Schema, UI, Integrations, Testing)
- **Feature Checklist**: Track every feature with test status
- **Phase Breakpoints**: Stop for review between phases

---

## PHASE 1: FOUNDATION (Days 1-5)

### Phase 1 Goal
Working auth, schema deployed, basic booking mutation with tests.

### Phase 1 Checklist
- [ ] TEST: Convex schema deploys without errors
- [ ] IMPL: Schema with users, visitSlots, specialDays, notifications
- [ ] TEST: User can authenticate via Magic Link
- [ ] IMPL: Convex Auth with email magic links
- [ ] TEST: Booking mutation prevents double-booking
- [ ] IMPL: bookSlot mutation with conflict detection
- [ ] TEST: Cancel mutation removes booking
- [ ] IMPL: cancelSlot mutation

### Phase 1 Agent Assignment
**Agent A (Schema + Auth)**:
1. Initialize Next.js 16 project with Convex
2. Create schema (see data model below)
3. Set up Convex Auth with Magic Links
4. Create basic mutations: bookSlot, cancelSlot, getSchedule

**Agent B (Testing)**:
1. Configure Vitest with convex-test
2. Write unit tests for booking logic
3. Write integration tests for mutations

### Phase 1 Exit Criteria
- Schema deployed to Convex
- Auth flow works end-to-end
- Booking/cancellation works with conflict prevention
- All tests passing

**>>> STOP FOR REVIEW AFTER PHASE 1 <<<**

---

## PHASE 2: CORE FEATURES (Days 6-12)

### Phase 2 Goal
Working family booking UI, Abba Display, Hebrew calendar integration.

### Phase 2 Checklist
- [ ] TEST: Weekly schedule displays correctly
- [ ] IMPL: WeekView component with slots
- [ ] TEST: User can book slot in under 30 seconds
- [ ] IMPL: SignupModal with one-tap booking
- [ ] TEST: Hebrew dates display correctly
- [ ] IMPL: Hebcal integration with sunset handling
- [ ] TEST: Shabbat slots are blocked
- [ ] IMPL: Shabbat detection and blocking
- [ ] TEST: Abba Display shows today's visitors
- [ ] IMPL: AbbaDisplay component (read-only, large fonts)
- [ ] TEST: Display auto-refreshes every 5 minutes
- [ ] IMPL: Realtime subscription + auto-refresh

### Phase 2 Agent Assignment
**Agent A (Family UI)**:
1. Build WeekView component (mobile-first, RTL support)
2. Build SignupModal (one-tap booking)
3. Build slot selection UI
4. PWA manifest and service worker

**Agent B (Hebrew Calendar)**:
1. Integrate @hebcal/core v6
2. Create hebrewDate utilities (sunset-aware)
3. Implement Shabbat/holiday detection
4. Build ShabbatInfo component

**Agent C (Abba Display)**:
1. Create /abba route with kiosk mode
2. Build CurrentVisitor component (large photo, name)
3. Build Timeline component (day schedule)
4. Implement auto-refresh with Convex realtime

### Phase 2 Exit Criteria
- Family members can view and book slots
- Hebrew dates display correctly
- Shabbat is detected and blocked
- Abba Display shows today's schedule
- PWA installable on mobile

**>>> STOP FOR REVIEW AFTER PHASE 2 <<<**

---

## PHASE 3: INTEGRATION (Days 13-18)

### Phase 3 Goal
WhatsApp notifications working, coordinator dashboard functional.

### Phase 3 Checklist
- [ ] TEST: Booking sends WhatsApp confirmation
- [ ] IMPL: Twilio WhatsApp action for booking confirm
- [ ] TEST: Reminder sent 24h before visit
- [ ] IMPL: Scheduled reminder function
- [ ] TEST: Gap alert sent to coordinator
- [ ] IMPL: Gap detection scheduled function
- [ ] TEST: Coordinator can see weekly overview
- [ ] IMPL: Coordinator dashboard with gaps highlighted
- [ ] TEST: Coordinator can send nudge
- [ ] IMPL: Nudge action to individual family members

### Phase 3 Agent Assignment
**Agent A (WhatsApp)**:
1. Set up Twilio actions in Convex
2. Implement template-based messaging
3. Create notification queue system
4. Handle delivery status webhooks

**Agent B (Coordinator)**:
1. Build CoordinatorDashboard component
2. Implement gap detection algorithm
3. Build nudge system
4. Create family statistics view

### Phase 3 Exit Criteria
- WhatsApp confirmations sent on booking
- Reminders sent automatically
- Coordinator can see gaps and send nudges
- All scheduled functions working

**>>> STOP FOR REVIEW AFTER PHASE 3 <<<**

---

## PHASE 4: POLISH & LAUNCH (Days 19-21)

### Phase 4 Goal
Production-ready, tested with real family members.

### Phase 4 Checklist
- [ ] E2E: Full booking flow works on mobile
- [ ] E2E: Abba Display works on tablet
- [ ] IMPL: Error boundaries and graceful degradation
- [ ] IMPL: Offline schedule viewing
- [ ] TEST: All edge cases (sunset, holiday transitions)
- [ ] Deploy to Vercel production
- [ ] Soft launch with 3 family members

### Phase 4 Exit Criteria
- All E2E tests passing
- Production deployed to Vercel
- 3 family members have successfully booked
- Abba Display tested on actual tablet

---

## WhatsApp Templates (Submit Before Development)

### Template 1: Booking Confirmation
```
Name: visit_confirmation
Language: he
Body: {{1}} שלום! נרשמת לביקור אצל אבא ביום {{2}} ב{{3}}. מחכים לך!
```

### Template 2: Visit Reminder
```
Name: visit_reminder
Language: he
Body: תזכורת: מחר יש לך ביקור אצל אבא ב{{1}}. אבא מחכה לך!
```

### Template 3: Gap Alert
```
Name: gap_alert
Language: he
Body: אין ביקורים מתוכננים ל{{1}}. מישהו יכול לעזור?
```

---

## Reference: Data Model (Convex Schema)

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    hebrewName: v.optional(v.string()),
    phone: v.string(),
    role: v.union(
      v.literal("sibling"),
      v.literal("spouse"),
      v.literal("grandchild"),
      v.literal("coordinator")
    ),
    isCoordinator: v.boolean(),
    avatarGradient: v.optional(v.string()),
    lastVisit: v.optional(v.number()),
  })
    .index("by_phone", ["phone"])
    .index("by_role", ["role"]),

  visitSlots: defineTable({
    date: v.string(), // ISO date YYYY-MM-DD
    hebrewDate: v.string(),
    slot: v.union(
      v.literal("morning"),
      v.literal("afternoon"),
      v.literal("evening")
    ),
    bookedBy: v.optional(v.id("users")),
    bookedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    isShabbat: v.boolean(),
    isHoliday: v.boolean(),
    holidayName: v.optional(v.string()),
  })
    .index("by_date", ["date"])
    .index("by_date_slot", ["date", "slot"])
    .index("by_user", ["bookedBy"]),

  specialDays: defineTable({
    hebrewDate: v.string(),
    type: v.union(
      v.literal("yahrzeit"),
      v.literal("birthday"),
      v.literal("holiday")
    ),
    name: v.string(),
    blocksVisits: v.boolean(),
  }).index("by_hebrew_date", ["hebrewDate"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("reminder"),
      v.literal("confirmation"),
      v.literal("gap_alert"),
      v.literal("nudge")
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("failed")
    ),
    scheduledFor: v.number(),
    twilioMessageId: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_user", ["userId"]),
});
```

---

## Reference: File Structure

```
lerner-visits/
├── app/
│   ├── layout.tsx           # Root layout with ConvexProvider
│   ├── page.tsx             # Redirect to /schedule
│   ├── schedule/
│   │   └── page.tsx         # Main booking interface
│   ├── abba/
│   │   └── page.tsx         # Kiosk display
│   └── coordinator/
│       └── page.tsx         # Admin dashboard
├── components/
│   ├── schedule/
│   │   ├── WeekView.tsx
│   │   ├── DayCard.tsx
│   │   └── SignupModal.tsx
│   ├── display/
│   │   ├── AbbaDisplay.tsx
│   │   ├── CurrentVisitor.tsx
│   │   └── Timeline.tsx
│   └── common/
│       ├── HebrewDate.tsx
│       └── Avatar.tsx
├── convex/
│   ├── schema.ts            # Data model
│   ├── users.ts             # User mutations/queries
│   ├── visits.ts            # Booking mutations/queries
│   ├── notifications.ts     # WhatsApp actions
│   └── crons.ts             # Scheduled functions
├── lib/
│   ├── hebrew-calendar.ts   # Hebcal wrapper
│   └── constants.ts         # App constants
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

---

## Reference: Slot Time Definitions

```typescript
const SLOTS = {
  morning: { name: 'בוקר', nameEn: 'morning', start: '07:00', end: '12:00' },
  afternoon: { name: 'צהריים', nameEn: 'afternoon', start: '12:00', end: '16:00' },
  evening: { name: 'ערב', nameEn: 'evening', start: '16:00', end: '20:00' },
} as const;
```

---

## Reference: Family Members (Seed Data)

```typescript
const FAMILY_SEED = [
  { name: 'שמריהו', role: 'sibling', isCoordinator: true, avatarGradient: 'from-blue-400 to-blue-600' },
  { name: 'שמשון', role: 'sibling', isCoordinator: true, avatarGradient: 'from-green-400 to-green-600' },
  { name: 'בתיה', role: 'sibling', isCoordinator: false, avatarGradient: 'from-purple-400 to-purple-600' },
  { name: 'ציפורה', role: 'sibling', isCoordinator: true, avatarGradient: 'from-pink-400 to-pink-600' },
  { name: 'מרים', role: 'sibling', isCoordinator: false, avatarGradient: 'from-yellow-400 to-yellow-600' },
  { name: 'לוי משה', role: 'sibling', isCoordinator: false, avatarGradient: 'from-orange-400 to-orange-600' },
  { name: 'איציק', role: 'sibling', isCoordinator: false, avatarGradient: 'from-teal-400 to-teal-600' },
];
```

---

## Completion Criteria

The project is "fully complete" when:
- [ ] Family member can book a slot in under 30 seconds
- [ ] Coordinator can see weekly coverage at a glance
- [ ] Abba Display shows today's visitors clearly (readable from 2 meters)
- [ ] Booking conflicts are prevented (not just detected)
- [ ] WhatsApp confirmations delivered successfully
- [ ] System has been used successfully for 2 weeks
- [ ] All Phase 1-4 tests passing
