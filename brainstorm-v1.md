# Brainstorm Report: Lerner Family Visit Scheduler - Claude Code Development Guide

**Generated**: January 12, 2026
**Workflow**: Interview -> 5 Brainstorm Agents -> 2 Consolidators -> 2 Critics -> Judgment
**Topic**: Create a comprehensive Claude Code prompt and setup guide for building the family visit scheduler

---

## Interview Summary

**User Requirements:**
1. **Prompt Style**: Both - mega-prompt with clear phase breakpoints
2. **Developer Level**: Expert - assumes familiarity with Next.js, Convex, testing
3. **Notifications**: Twilio WhatsApp API as primary channel
4. **Realtime**: Yes - Convex reactive queries for instant updates

**Additional Explicit Requests:**
- Provide ALL API keys needed before starting
- List CLI tools required
- Specify skills, agents, MCPs to install on Claude Code
- Identify what's in context NOW that is NOT needed (context efficiency)
- TDD methodology - tests first
- Feature checklist to ensure "fully complete" state

---

## Executive Summary

This brainstorm validates that **Next.js 16 + Convex + Twilio WhatsApp + Vercel** is an excellent technology stack for building the Lerner Family Visit Scheduler. The architecture benefits from Convex's realtime reactive queries (perfect for instant schedule updates) and serializable isolation (prevents double-booking without custom locking code).

**Key Finding**: WhatsApp template approval is the critical path blocker - must submit templates before development begins.

**Critical Gap Identified by Critics**: The original brainstorm request asked for **pre-flight setup checklists** (API keys, CLI tools, Claude Code configuration) that were not adequately addressed. This report includes those missing pieces.

**Confidence Score**: 8.5/10 - Strong technical alignment, but human factors (family adoption, elderly UX) remain unknowns.

---

## Pre-Flight Setup Checklist (BEFORE STARTING)

### API Keys & Accounts Needed

| Service | What You Need | Where to Get It |
|---------|---------------|-----------------|
| **Convex** | Deployment URL, API Key | https://dashboard.convex.dev |
| **Twilio** | Account SID, Auth Token | https://console.twilio.com |
| **Twilio WhatsApp** | WhatsApp Sender ID, Templates approval | https://console.twilio.com/whatsapp |
| **Vercel** | Project token (optional for CLI) | https://vercel.com/account/tokens |
| **Hebcal** | No API key (CC 4.0 license, rate limit: 90/10s) | Use @hebcal/core npm package |

### Environment Variables Template
```bash
# .env.local
CONVEX_DEPLOYMENT=your-deployment-name
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

VERCEL_TOKEN=optional-for-cli-deploys
```

### CLI Tools to Install
```bash
# Required
npm install -g convex           # Convex CLI
npm install -g vercel           # Vercel CLI (optional)

# Package manager (choose one)
npm install -g pnpm             # Recommended for speed

# Runtime
node --version                  # Requires Node.js 20+
```

### Claude Code Setup

**Skills to Consider:**
- `test-writer-fixer` - For TDD workflow
- `rapid-prototyper` - For initial scaffolding
- `frontend-developer` - For React/Tailwind components
- `backend-architect` - For Convex schema design

**MCPs Already Available:**
- `context7` - For library documentation lookup
- `playwright` - For E2E testing automation
- `Ref` - For documentation search

**Context to REMOVE for Efficiency:**
The current context includes the original spec file (`lerner_visit_scheduler_spec.md`) which references Supabase. Since we're using Convex instead, the Supabase-specific sections (migrations, RLS policies, edge functions) are NOT needed. The core requirements (family members, slots, Hebrew calendar, WhatsApp) remain valid.

---

## Consolidated Insights

### Key Themes (All 5 Agents Agreed)

1. **WhatsApp Template Approval is Critical Path**
   - Submit templates BEFORE development begins
   - Approval takes 24-48 hours (can take weeks if rejected)
   - Required templates: confirmation, reminder, gap alert

2. **Convex is Ideal for This Use Case**
   - Serializable isolation prevents double-booking
   - Reactive queries provide instant schedule updates
   - Zero WebSocket management needed
   - TypeScript end-to-end

3. **Hebcal v6 is ES Modules Only**
   - Use @hebcal/core client-side
   - CommonJS removed in October 2025
   - Handle sunset-based date transitions

4. **Elderly Kiosk Requires Specialized UX**
   - 48px minimum touch targets (WCAG)
   - High contrast, minimal interaction
   - Read-only "Abba Display" mode

5. **6-7 Parallel Agents are Viable**
   - Clear separation: Schema, UI, Hebrew Calendar, WhatsApp, Abba Display, Testing
   - Use git worktrees for isolation

### Consensus Recommendations

| Recommendation | Agreement | Why |
|----------------|-----------|-----|
| Magic Link authentication | 4/5 agents | No passwords for elderly users |
| Slot-based data model | 4/5 agents | Simpler than free-form scheduling |
| Feature checklist as living document | 4/5 agents | Track completion with TDD tests |
| Coordinator role essential | 4/5 agents | Tech-savvy family member manages system |
| PWA with service worker | 4/5 agents | Offline schedule viewing |

### Unique Discoveries

- **Sunset-based Hebrew dates**: Jewish days start at sunset, critical for Shabbat blocking
- **Coordinator "nudge" feature**: Remind family members who haven't visited
- **WhatsApp interactive buttons**: Quick replies for confirm/reschedule
- **Predictive gap detection**: Alert when coverage patterns are thin
- **Yahrzeit integration**: Auto-block memorial days for family coordination
- **CSS logical properties**: Use `margin-inline-start` for RTL Hebrew support

---

## Critical Questions & Debates

### From Critic Analysis

1. **Is Convex the right choice, or is it resume-driven development?**
   - Counter: Convex's reactive queries genuinely solve the realtime problem elegantly

2. **Should this be a web app at all?**
   - WhatsApp Flows could make WhatsApp the ENTIRE interface
   - Counter: Abba Display requires a web-based kiosk view

3. **6-7 parallel agents vs. 2-3 focused agents?**
   - Coordination overhead may outweigh speed gains for solo developer
   - Recommendation: Start with 3 agents, expand if needed

4. **Magic Link vs. simple PIN code?**
   - Elderly users may struggle with email-based login
   - Consider: 4-digit family code as alternative

5. **TDD for a prototype?**
   - TDD is valuable but slower for unclear requirements
   - Recommendation: Spike-then-test for Phase 1, strict TDD for Phase 2+

6. **"Fully complete" is a trap**
   - Software is never complete
   - Define: "Functional for 3 months of family use" as success criteria

---

## Areas of Debate

### Where Consolidators Disagreed

| Topic | Consolidator A | Consolidator B | Resolution |
|-------|----------------|----------------|------------|
| Confidence level | 8.5/10 | 8.7/10 | Split difference: 8.5/10 |
| Phase structure | Implicit | Explicit 4-phase | Use explicit phases |
| RTL handling | Not mentioned | CSS logical properties | Include RTL support |
| Yahrzeit integration | Not mentioned | Listed as unique | Include as Phase 2 feature |

### Where Critics Pushed Back

1. **API keys list was MISSING** - Now included above
2. **Context efficiency was IGNORED** - Now addressed
3. **"Fully complete" undefined** - Define completion criteria
4. **Family validation missing** - Recommend user research before building

---

## Orchestrator's Resolution

### On Technology Stack
**Verdict**: Proceed with Next.js 16 + Convex + Twilio + Vercel. The stack is validated, well-documented, and specifically suited for realtime collaborative applications. Convex's reactive architecture eliminates the hardest parts of building this system.

### On Parallel Agents
**Verdict**: Start with 4 focused agents, not 6-7:
1. **Agent A**: Convex Schema + Auth
2. **Agent B**: Core UI + Booking Flow
3. **Agent C**: Hebrew Calendar + WhatsApp
4. **Agent D**: Testing (runs in parallel with all)

Add Abba Display and Coordinator Dashboard as separate efforts after core is stable.

### On TDD Approach
**Verdict**: Hybrid approach
- **Phase 1**: Spike the data model and basic UI (validate assumptions)
- **Phase 2+**: Strict TDD with tests before implementation
- **Feature Checklist**: Use markdown file with TDD-style checkboxes

### On WhatsApp Dependency
**Verdict**: Submit templates NOW, but design for graceful degradation
- Primary: WhatsApp templates
- Fallback: Twilio SMS
- Emergency: In-app notifications only

### On Completion Criteria
**Verdict**: Define "done" as:
- [ ] Family member can book a slot in under 30 seconds
- [ ] Coordinator can see weekly coverage at a glance
- [ ] Abba Display shows today's visitors clearly
- [ ] Conflicts are prevented (not just detected)
- [ ] System has been used successfully for 2 weeks

---

## Combined Analysis

### Technical Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js 16)                        │
├──────────────────┬──────────────────┬────────────────────────────┤
│   Family PWA     │   Abba Display   │   Coordinator Dashboard    │
│   - Slot booking │   - Read-only    │   - Gap detection          │
│   - Quick cancel │   - Auto-refresh │   - Family stats           │
│   - RTL Hebrew   │   - Large fonts  │   - Nudge system           │
└────────┬─────────┴────────┬─────────┴──────────┬─────────────────┘
         │                  │                    │
         ▼                  ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CONVEX BACKEND                              │
│   - Reactive queries (realtime sync)                             │
│   - Serializable isolation (no double-booking)                   │
│   - Scheduled functions (reminders, gap alerts)                  │
│   - Magic Link auth                                              │
└────────────────────────────────────────────────────────────────┬─┘
                                                                  │
         ┌────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────┐  ┌─────────────────────┐
│   Twilio WhatsApp   │  │   Hebcal v6         │
│   - Templates       │  │   - Hebrew dates    │
│   - Notifications   │  │   - Shabbat times   │
└─────────────────────┘  └─────────────────────┘
```

### Recommended Data Model (Convex)

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

### Testing Strategy

```
                    ┌─────────────────────┐
                    │   E2E (Playwright)  │  10%
                    │  - Full booking flow │
                    │  - Kiosk display    │
                    └──────────┬──────────┘
                               │
              ┌────────────────▼────────────────┐
              │   Integration (convex-test)    │  30%
              │  - Booking mutation            │
              │  - Conflict detection          │
              │  - Notification scheduling     │
              └────────────────┬────────────────┘
                               │
         ┌─────────────────────▼─────────────────────┐
         │          Unit Tests (Vitest)              │  60%
         │  - Hebrew date utilities                  │
         │  - Component rendering                    │
         │  - Validation helpers                     │
         └───────────────────────────────────────────┘
```

---

## Final Recommendation

**Confidence Score**: 8.5/10

**Recommendation**: Proceed with development using the mega-prompt below. The technology stack is well-validated, the architecture is sound, and the risks are manageable.

**Why not 10/10:**
- WhatsApp template approval is external dependency
- Elderly user adoption is fundamentally unknowable
- Family dynamics are outside technical control

**Key Success Factors:**
1. Submit WhatsApp templates TODAY
2. Soft launch with 3 family members before full rollout
3. Test Abba Display with the actual elderly user
4. Define "done" clearly before starting

---

## Next Steps

1. **Immediate**: Submit WhatsApp templates to Twilio for approval
2. **Day 1**: Run the mega-prompt below in Claude Code
3. **Week 1**: Complete Phase 1 (Foundation) - Schema, Auth, Basic Booking
4. **Week 2**: Complete Phase 2 (Core) - UI, Hebrew Calendar, Abba Display
5. **Week 3**: Complete Phase 3 (Integration) - WhatsApp, Notifications
6. **Week 4**: Soft launch with 3 family members
7. **Week 5+**: Full family rollout and iteration

---

## The Mega-Prompt for Claude Code

```markdown
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
2. Create schema (see data model above)
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
```

---

## Appendix

### Consolidation Report A (Summary)
- Confidence: 8.5/10
- Emphasized: WhatsApp template approval, Convex serializable isolation, sunset-based Hebrew dates
- Recommended: 6 parallel agents, feature checklist in Convex table, test pyramid

### Consolidation Report B (Summary)
- Confidence: 8.7/10
- Emphasized: 4-phase timeline, CSS logical properties for RTL, yahrzeit integration
- Recommended: TDD-style checkboxes, explicit phase breakpoints

### Critic Analysis A (Summary)
- Alignment: 7/10 - missed API keys list, context efficiency request
- Key challenge: "Is Convex resume-driven development or genuinely best?"
- Recommendation: Define "done" clearly, validate with family members

### Critic Analysis B (Summary)
- Alignment: Weak on prerequisites checklist
- Key challenge: "Would a Google Calendar solve 80% of this?"
- Recommendation: User research before building

### Individual Brainstorm Agents (Highlights)

**Agent 1**: Sunset-based Hebrew date handling critical; use git worktrees for parallel agents
**Agent 2**: Next.js 16.1 security patches required; Vitest for unit tests, Playwright for E2E
**Agent 3**: Hebcal MCP support available; coordinator nudge feature; grandchildren gamification idea
**Agent 4**: DevTools MCP for AI-assisted debugging; comprehensive Convex schema with indexes
**Agent 5**: WhatsApp interactive buttons; predictive gap detection; soft launch strategy
