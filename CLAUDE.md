# Lerner Family Visit Scheduler

## Project Overview

A mobile-first PWA for coordinating family visits with an elderly father ("Abba") in Kfar Chabad, Israel. The system serves 7 adult children, their spouses, and ~15 adult grandchildren.

**Core Principle**: "If it's harder than WhatsApp, people won't use it."

## Technology Stack (LOCKED - Do Not Change)

| Layer | Technology |
|-------|------------|
| Runtime | Bun (package manager + runtime) |
| Frontend | Next.js 16+ with App Router, Turbopack |
| Styling | Tailwind CSS |
| Backend | Convex (database, auth, realtime, scheduled functions) |
| Deployment | Vercel |
| Notifications | Twilio WhatsApp API |
| Hebrew Calendar | @hebcal/core v6+ (ES modules, client-side) |
| Testing | Vitest (unit/component) + Playwright (E2E) + convex-test |

### Why Bun?
- **Fast installs**: 10-100x faster than npm
- **Fast runtime**: Native TypeScript execution
- **Built-in test runner**: Can use for unit tests
- **Compatible**: Works with npm packages and Vercel

### Commands
```bash
bun install          # Install dependencies
bun run dev          # Start dev server
bun run build        # Build for production
bun test             # Run tests
bunx convex dev      # Start Convex dev
```

## Project Structure

```
levsarah/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout with ConvexProvider
│   ├── page.tsx            # Redirect to /schedule
│   ├── schedule/           # Main booking interface
│   ├── abba/               # Kiosk display for Abba
│   └── coordinator/        # Admin dashboard
├── components/
│   ├── schedule/           # WeekView, DayCard, SignupModal
│   ├── display/            # AbbaDisplay, CurrentVisitor, Timeline
│   └── common/             # HebrewDate, Avatar, shared components
├── convex/
│   ├── schema.ts           # Data model (users, visitSlots, specialDays, notifications)
│   ├── users.ts            # User mutations/queries
│   ├── visits.ts           # Booking mutations/queries
│   ├── notifications.ts    # WhatsApp actions
│   └── crons.ts            # Scheduled functions
├── lib/
│   ├── hebrew-calendar.ts  # Hebcal wrapper utilities
│   └── constants.ts        # App constants
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

## Coding Standards

### General Rules
- **TDD**: Write tests first, then implement
- **TypeScript**: Strict mode, no `any` types
- **No over-engineering**: Only build what's needed
- **Hebrew RTL**: All UI components must support RTL layout
- **Mobile-first**: Design for mobile, enhance for desktop

### Naming Conventions
- **Files**: kebab-case (`week-view.tsx`, `hebrew-calendar.ts`)
- **Components**: PascalCase (`WeekView`, `SignupModal`)
- **Functions**: camelCase (`bookSlot`, `getSchedule`)
- **Constants**: SCREAMING_SNAKE_CASE (`SLOT_TIMES`, `MAX_VISITORS`)
- **Convex tables**: camelCase plural (`users`, `visitSlots`)

### Component Guidelines
```typescript
// Always use 'use client' for interactive components
'use client';

// Props interface before component
interface WeekViewProps {
  startDate: Date;
  onSlotSelect: (slot: Slot) => void;
}

// Export named, not default
export function WeekView({ startDate, onSlotSelect }: WeekViewProps) {
  // Component logic
}
```

### Convex Patterns
```typescript
// Mutations: use v.object for args validation
export const bookSlot = mutation({
  args: {
    date: v.string(),
    slot: v.union(v.literal("morning"), v.literal("afternoon"), v.literal("evening")),
  },
  handler: async (ctx, args) => {
    // Always check auth first
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Implementation
  },
});

// Queries: always return typed data
export const getSchedule = query({
  args: { weekStart: v.string() },
  returns: v.array(v.object({ /* schema */ })),
  handler: async (ctx, args) => {
    // Implementation
  },
});
```

### Tailwind & Styling
- Use Tailwind utility classes, no custom CSS unless necessary
- RTL support: use `rtl:` prefix or logical properties (`ms-`, `me-`, `ps-`, `pe-`)
- Mobile breakpoints: `sm:`, `md:`, `lg:` (mobile-first)
- Hebrew fonts: `font-hebrew` class for Hebrew text

```tsx
// Example RTL-aware component
<div className="flex flex-col gap-4 p-4 rtl:text-right">
  <h1 className="text-2xl font-bold font-hebrew">לוח ביקורים</h1>
</div>
```

## Slot Time Definitions

```typescript
const SLOTS = {
  morning: { name: 'בוקר', nameEn: 'morning', start: '07:00', end: '12:00' },
  afternoon: { name: 'צהריים', nameEn: 'afternoon', start: '12:00', end: '16:00' },
  evening: { name: 'ערב', nameEn: 'evening', start: '16:00', end: '20:00' },
} as const;

type SlotType = keyof typeof SLOTS;
```

## WhatsApp Templates (Approved)

| Template | SID | Variables |
|----------|-----|-----------|
| visit_confirmation | `HX5acc3b264e947ebfaf4c0a87d41b67ed` | `{{1}}` name, `{{2}}` day, `{{3}}` time |
| visit_reminder | `HX922d58d14a871614c1595cd9748d6367` | `{{1}}` time |
| gap_alert | `HX92aa09f05f109de0ff8afc3762f9b2f2` | `{{1}}` date |

**Usage**:
```typescript
// Send via Twilio Content API
await twilioClient.messages.create({
  from: 'whatsapp:+16506102211',
  to: `whatsapp:${userPhone}`,
  contentSid: 'HX...',
  contentVariables: JSON.stringify({ "1": "value1", "2": "value2" }),
});
```

## Environment Variables

```bash
# Twilio WhatsApp
TWILIO_SID=AC...
TWILIO_TOKEN=...
WHATSAPP_SENDER=+16506102211

# Convex
CONVEX_DEPLOYMENT=...
NEXT_PUBLIC_CONVEX_URL=...
```

## Key Business Rules

1. **No double-booking**: One person per slot per day
2. **Shabbat blocking**: Friday evening through Saturday evening - no bookings
3. **Holiday blocking**: Jewish holidays block visits (configurable per holiday)
4. **24-hour reminders**: WhatsApp reminder sent day before visit
5. **Gap alerts**: Coordinator notified when day has no visits scheduled
6. **Conflict prevention**: Block booking, don't just warn

## Hebrew Calendar Integration

```typescript
import { HebrewCalendar, HDate } from '@hebcal/core';

// Get Hebrew date for display
const hdate = new HDate(new Date());
const hebrewDateStr = hdate.toString('h'); // "כ״ב טבת תשפ״ו"

// Check if Shabbat
const isShabbat = hdate.getDay() === 6; // Saturday

// Get sunset time for date transition
const sunset = HebrewCalendar.getSunset(hdate, 31.9867, 34.9167); // Kfar Chabad coords
```

## Testing Requirements

### Unit Tests (Vitest)
- All Convex mutations and queries
- Hebrew calendar utilities
- Business logic functions

### Integration Tests (convex-test)
- Booking flow with conflict detection
- Auth flow
- Notification triggers

### E2E Tests (Playwright)
- Full booking flow on mobile viewport
- Abba Display on tablet viewport
- Coordinator dashboard

## Important Notes for Agents

1. **Always read this file first** before making changes
2. **Check existing code** before creating new utilities
3. **Run tests** after every significant change
4. **Hebrew text** must be properly encoded (UTF-8)
5. **Mobile viewport** is primary - test at 375px width
6. **Accessibility**: Support screen readers, high contrast
7. **Offline support**: PWA must show cached schedule when offline
