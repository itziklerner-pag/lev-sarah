# Lerner Family Visit Scheduler (Lev Sarah)

## Project Overview

A mobile-first PWA for coordinating family visits with an elderly father ("Abba") in Kfar Chabad, Israel. The system serves 7 adult children, their spouses, and ~15 adult grandchildren.

**Core Principle**: "If it's harder than WhatsApp, people won't use it."

**Domain**: levsarah.org

## Technology Stack (LOCKED - Do Not Change)

| Layer | Technology | Version |
|-------|------------|---------|
| Runtime | Bun (package manager + runtime) | Latest |
| Frontend | Next.js with App Router, Turbopack | 16.1.1 |
| React | React 19 | 19.0.0 |
| Styling | Tailwind CSS | 3.4.17 |
| Backend | Convex (database, auth, realtime, scheduled functions) | 1.17.4 |
| Auth | @convex-dev/auth + @auth/core | 0.0.80 / 0.37.0 |
| Deployment | Vercel | - |
| Notifications | Twilio WhatsApp API (Content Templates) | - |
| Hebrew Calendar | @hebcal/core (ES modules, client-side) | 5.5.2 |
| Testing | Vitest (unit) + convex-test | 2.1.8 / 0.0.34 |

### Why Bun?
- **Fast installs**: 10-100x faster than npm
- **Fast runtime**: Native TypeScript execution
- **Built-in test runner**: Can use for unit tests
- **Compatible**: Works with npm packages and Vercel

### Commands
```bash
bun install              # Install dependencies
bun run dev              # Start dev server (next dev --turbopack)
bun run build            # Custom build script
bun run build:production # Convex deploy + next build
bun run build:preview    # Convex deploy --preview
bun test                 # Run tests (vitest)
bun test:once            # Run tests once
bun test:coverage        # Run tests with coverage
bunx convex dev          # Start Convex dev
```

## Project Structure (Actual)

```
levsarah/
├── src/
│   ├── app/                        # Next.js App Router pages
│   │   ├── layout.tsx              # Root layout with ConvexAuthProvider, RTL, Heebo font
│   │   ├── page.tsx                # Redirect to /schedule
│   │   ├── globals.css             # Tailwind directives, RTL setup, animations
│   │   ├── providers.tsx           # ConvexAuthProvider setup
│   │   ├── schedule/
│   │   │   └── page.tsx            # Main booking interface
│   │   ├── abba/
│   │   │   └── page.tsx            # Kiosk display for Abba
│   │   ├── coordinator/
│   │   │   └── page.tsx            # Coordinator dashboard with stats
│   │   ├── admin/
│   │   │   └── page.tsx            # Admin panel for user/invite management
│   │   └── invite/
│   │       └── [code]/
│   │           └── page.tsx        # Invite link acceptance flow
│   └── components/
│       ├── schedule/
│       │   ├── week-view.tsx       # 7-day calendar grid
│       │   ├── day-card.tsx        # Individual day with 3 slots
│       │   └── signup-modal.tsx    # Booking confirmation modal
│       ├── display/
│       │   ├── abba-display.tsx    # Full kiosk view
│       │   ├── current-visitor.tsx # Large visitor card
│       │   └── timeline.tsx        # Timeline of visits
│       ├── auth/
│       │   └── phone-login.tsx     # Phone number login with WhatsApp
│       ├── profile/
│       │   ├── profile-completion.tsx  # Photo upload flow
│       │   └── invite-accept.tsx       # Invite acceptance UI
│       └── common/
│           ├── avatar.tsx              # User avatar with gradient fallback
│           ├── hebrew-date.tsx         # Hebrew date display
│           └── service-worker-register.tsx  # PWA registration
├── convex/
│   ├── schema.ts           # Data model (familyProfiles, invites, visitSlots, specialDays, notifications)
│   ├── auth.ts             # Authentication setup
│   ├── auth.config.ts      # Auth configuration
│   ├── authHelpers.ts      # ensureUser, getAuthUserId utilities
│   ├── users.ts            # getMyProfile, checkInvite, acceptInvite
│   ├── visits.ts           # bookSlot, getSchedule, cancelBooking
│   ├── scheduler.ts        # Schedule queries and helpers
│   ├── coordinator.ts      # Dashboard stats, gaps, family members
│   ├── admin.ts            # User management, invites, admin controls
│   ├── notifications.ts    # WhatsApp messaging (Twilio Content API)
│   ├── phoneAuth.ts        # Phone number authentication
│   ├── crons.ts            # Scheduled functions for reminders
│   ├── http.ts             # HTTP endpoints
│   └── schema.test.ts      # Schema tests
├── lib/
│   ├── types.ts            # TypeScript interfaces (SlotType, FamilyProfile, etc.)
│   ├── constants.ts        # SLOTS, KFAR_CHABAD_LOCATION, WHATSAPP_TEMPLATES
│   └── hebrew-calendar.ts  # Hebcal wrapper utilities (286 lines)
├── tests/
│   └── unit/
│       └── hebrew-calendar.test.ts
├── scripts/
│   ├── build.mjs                   # Custom build script
│   └── create-whatsapp-template.ts # WhatsApp template helper
├── public/
│   ├── manifest.json       # PWA manifest (RTL, Hebrew)
│   ├── icon-192.png        # App icon
│   ├── icon-512.png        # App icon
│   ├── sw.js               # Service worker
│   └── offline.html        # Offline fallback page
├── package.json
├── tsconfig.json           # Strict mode, path aliases (@/)
├── tailwind.config.ts      # Hebrew font family (Heebo)
├── postcss.config.mjs
├── next.config.ts
├── vitest.config.ts        # Edge runtime, 30s timeout
├── .env                    # Environment variables
├── .env.local              # Local overrides
└── CLAUDE.md               # This file
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
- Hebrew fonts: Uses Heebo from Google Fonts

```tsx
// Example RTL-aware component
<div className="flex flex-col gap-4 p-4 rtl:text-right">
  <h1 className="text-2xl font-bold">לוח ביקורים</h1>
</div>
```

## Data Model (Convex Schema)

### Tables

#### familyProfiles
Extends auth users with family-specific data.
```typescript
{
  userId: v.id("users"),           // Links to auth user
  name: v.string(),                // Display name
  hebrewName: v.optional(v.string()),
  phone: v.string(),               // WhatsApp number
  relationship: v.string(),        // "child" | "spouse" | "grandchild"
  isAdmin: v.boolean(),
  profileImage: v.optional(v.string()),
  avatarGradient: v.optional(v.string()),
  lastVisit: v.optional(v.string()),
  profileCompleted: v.boolean(),
}
// Indexes: by_userId, by_phone, by_relationship, by_admin
```

#### invites
Link-based invite system for new family members.
```typescript
{
  phone: v.string(),
  name: v.string(),
  relationship: v.string(),
  status: v.string(),              // "pending" | "sent" | "accepted" | "failed"
  inviteCode: v.string(),          // Unique code for invite link
  invitedBy: v.id("users"),
  createdAt: v.number(),
  sentAt: v.optional(v.number()),
  acceptedAt: v.optional(v.number()),
  error: v.optional(v.string()),
}
// Indexes: by_phone, by_status, by_inviteCode
```

#### visitSlots
Individual booking slots.
```typescript
{
  date: v.string(),                // ISO date (YYYY-MM-DD)
  hebrewDate: v.string(),
  slot: v.string(),                // "morning" | "afternoon" | "evening"
  bookedBy: v.optional(v.id("familyProfiles")),
  bookedAt: v.optional(v.number()),
  notes: v.optional(v.string()),
  isShabbat: v.boolean(),
  isHoliday: v.boolean(),
}
// Indexes: by_date, by_date_slot, by_user
```

#### specialDays
Holidays, yahrzeits, birthdays.
```typescript
{
  hebrewDate: v.string(),
  type: v.string(),                // "yahrzeit" | "birthday" | "holiday"
  name: v.string(),
  blocksVisits: v.boolean(),
}
// Indexes: by_hebrew_date
```

#### notifications
WhatsApp notification queue.
```typescript
{
  userId: v.id("users"),
  type: v.string(),                // "reminder" | "confirmation" | "gap_alert" | "nudge" | "invite"
  status: v.string(),              // "pending" | "sent" | "failed"
  scheduledFor: v.number(),
  sentAt: v.optional(v.number()),
  twilioMessageId: v.optional(v.string()),
}
// Indexes: by_status, by_user, by_scheduled
```

## Authentication System

Uses `@convex-dev/auth` with phone-based authentication via WhatsApp OTP.

**Flow:**
1. User enters phone number
2. Receives WhatsApp OTP
3. Verifies and creates auth session
4. Links to familyProfile on first login
5. New members use invite links (`/invite/[code]`)

**Key Functions:**
- `convex/auth.ts` - Auth setup
- `convex/authHelpers.ts` - `ensureUser()`, `getAuthUserId()`
- `convex/phoneAuth.ts` - Phone number validation
- `src/components/auth/phone-login.tsx` - Login UI

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
WHATSAPP_BUSINESS_ACCOUNT_ID=...
WHATSAPP_BUSINESS_MANAGER_ID=...

# Convex
CONVEX_DEPLOYMENT=...
NEXT_PUBLIC_CONVEX_URL=...
CONVEX_PREVIEW_DEPLOYMENT_KEY=...

# Email (Resend)
RESEND_API_KEY=...

# Domain Management (Namecheap)
NAMECHEAP_API_KEY=...
```

## Key Business Rules

1. **No double-booking**: One person per slot per day
2. **Shabbat blocking**: Friday evening through Saturday evening - no bookings
3. **Holiday blocking**: Jewish holidays block visits (configurable per holiday)
4. **24-hour reminders**: WhatsApp reminder sent day before visit
5. **Gap alerts**: Coordinator notified when day has no visits scheduled
6. **Conflict prevention**: Block booking, don't just warn

## Hebrew Calendar Integration

**Location: Kfar Chabad**
- Latitude: 31.9867
- Longitude: 34.9167
- Timezone: Asia/Jerusalem

```typescript
import { HebrewCalendar, HDate } from '@hebcal/core';

// Get Hebrew date for display
const hdate = new HDate(new Date());
const hebrewDateStr = hdate.toString('h'); // "כ״ב טבת תשפ״ו"

// Check if Shabbat
const isShabbat = hdate.getDay() === 6; // Saturday

// Get sunset time for date transition
const sunset = HebrewCalendar.getSunset(hdate, 31.9867, 34.9167);
```

**Implemented Features:**
- Hebrew date rendering with gematriya
- Shabbat detection (Friday evening + Saturday)
- Holiday detection (major holidays block visits)
- Candle lighting & Havdalah times
- Parsha Ha-Shavua (weekly Torah portion)
- Sunset-aware date transitions

## PWA Configuration

**manifest.json:**
```json
{
  "name": "לב שרה - תורנות ביקורים",
  "short_name": "לב שרה",
  "start_url": "/schedule",
  "display": "standalone",
  "dir": "rtl",
  "lang": "he",
  "theme_color": "#3b82f6"
}
```

**Features:**
- Service worker for offline support (`public/sw.js`)
- Offline fallback page (`public/offline.html`)
- App icons (192x192, 512x512)
- RTL and Hebrew language support

## Testing

### Current Status
- **Vitest**: Configured with edge-runtime, 30s timeout
- **convex-test**: Configured for Convex function testing
- **Unit tests**: `tests/unit/hebrew-calendar.test.ts`
- **Schema tests**: `convex/schema.test.ts`

### Gaps (TODO)
- **E2E Tests**: Playwright not yet installed
- **Integration Tests**: `tests/integration/` directory empty
- **Coverage**: Limited test coverage

### Running Tests
```bash
bun test              # Watch mode
bun test:once         # Single run
bun test:coverage     # With coverage report
```

## Implementation Status

### Fully Implemented
- Core booking system with slot management
- Hebrew calendar integration
- WhatsApp notifications via Twilio
- Phone-based authentication
- Admin panel for user management
- Coordinator dashboard with gap detection
- Link-based invite system
- PWA with offline support
- RTL layout throughout

### Routes
| Route | Description | Status |
|-------|-------------|--------|
| `/` | Redirect to /schedule | ✓ |
| `/schedule` | Main booking interface | ✓ |
| `/abba` | Kiosk display for Abba | ✓ |
| `/coordinator` | Dashboard with stats | ✓ |
| `/admin` | User/invite management | ✓ |
| `/invite/[code]` | Invite acceptance | ✓ |

### Components (12 total)
| Category | Components |
|----------|------------|
| Schedule | WeekView, DayCard, SignupModal |
| Display | AbbaDisplay, CurrentVisitor, Timeline |
| Auth | PhoneLogin |
| Profile | ProfileCompletion, InviteAccept |
| Common | Avatar, HebrewDate, ServiceWorkerRegister |

## Important Notes for Agents

1. **Always read this file first** before making changes
2. **Check existing code** before creating new utilities
3. **Run tests** after every significant change
4. **Hebrew text** must be properly encoded (UTF-8)
5. **Mobile viewport** is primary - test at 375px width
6. **Accessibility**: Support screen readers, high contrast
7. **Offline support**: PWA must show cached schedule when offline
8. **Invite system**: Uses link-based codes (not WhatsApp OTP for invites)
9. **Domain**: levsarah.org
10. **Components are in `src/components/`** not root `components/`

## Recent Changes (Git Log)

- Domain updated to levsarah.org
- Replaced WhatsApp login with PhoneLogin component
- Replaced WhatsApp invites with link-based system
- Added admin interface with invite management
- Implemented Phase 2 - Core UI components and Abba Display

---

*Last updated: January 2026*
