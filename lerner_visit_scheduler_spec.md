# Lerner Family Visit Scheduler - Technical Specification
## תורנות ביקורים - מערכת תיאום ביקורים משפחתית

**Version:** 1.0  
**Date:** January 2026  
**Author:** Product Specification for Claude Code Implementation

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [User Types & Personas](#3-user-types--personas)
4. [Feature Requirements](#4-feature-requirements)
5. [Technical Architecture](#5-technical-architecture)
6. [Data Models](#6-data-models)
7. [API Endpoints](#7-api-endpoints)
8. [User Interfaces](#8-user-interfaces)
9. [Notifications System](#9-notifications-system)
10. [Jewish Calendar Integration](#10-jewish-calendar-integration)
11. [Implementation Phases](#11-implementation-phases)
12. [Deployment & Infrastructure](#12-deployment--infrastructure)

---

## 1. Executive Summary

### Purpose
Build a simple, mobile-first scheduling system for coordinating family visits with an elderly father ("Abba") living in Kfar Chabad, Israel. The system serves 7 adult children, their spouses, and ~15 adult grandchildren.

### Core Principle
**If it's harder than WhatsApp, people won't use it.**

### Key Components
1. **Scheduling Web App** - Mobile-first interface for family to sign up for visit slots
2. **Abba Display** - Wall-mounted tablet showing today's visitors with large text
3. **Notification System** - Automated WhatsApp/SMS reminders
4. **Jewish Calendar** - Hebrew dates, Shabbat times, holidays, family yahrzeits

### Success Criteria
- 90%+ weekly slot fill rate
- 100% sibling adoption within 2 weeks
- Zero missed visits due to forgotten schedules
- Reduced coordination overhead for family coordinators

---

## 2. System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
├─────────────────────────────────────────────────────────────────┤
│  📱 Family App        📺 Abba Display       👨‍💼 Coordinator      │
│  (Mobile PWA)         (Tablet Kiosk)        Dashboard           │
└──────────┬────────────────────┬────────────────────┬────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE BACKEND                            │
├─────────────────────────────────────────────────────────────────┤
│  🗄️ PostgreSQL    🔐 Auth (optional)    ⚡ Realtime             │
│  Database          Magic Links           WebSocket Updates       │
└──────────┬────────────────────┬────────────────────┬────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                             │
├─────────────────────────────────────────────────────────────────┤
│  📲 Twilio          📅 Hebcal API        🔔 n8n Workflows        │
│  WhatsApp/SMS       Jewish Calendar       Automation             │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | React + Vite + Tailwind CSS | Fast, modern, easy PWA support |
| Backend | Supabase (PostgreSQL + Auth + Realtime) | No server management, realtime built-in |
| Hosting | Vercel or Netlify | Free tier, auto-deploy from Git |
| Notifications | Twilio (WhatsApp Business API) | Reliable, family already uses WhatsApp |
| Automation | n8n (self-hosted) or Make.com | Visual workflow builder |
| Jewish Calendar | Hebcal JS library | Comprehensive, well-maintained |

---

## 3. User Types & Personas

### 3.1 Family Members (Primary Users)

| Name | Role | Location | Tech Level | Primary Use |
|------|------|----------|------------|-------------|
| שמריהו | Sibling, Coordinator | Israel | High | Schedule, manage gaps |
| שמשון | Sibling, Admin | Israel | High | Friday visits, group admin |
| בתיה | Sibling | Ariel | Medium | Weekday visits with kids |
| ציפורה | Sibling | Adjacent to Abba | Medium | Daily support, backbone |
| מרים | Sibling | Israel | Medium | Organize gatherings, Zoom |
| לוי משה | Sibling | Israel | Medium | Thursday visits |
| איציק | Sibling | California, USA | High | Zoom calls, periodic visits |
| Spouses | ~6 people | Various | Medium | Occasional visits |
| Grandchildren | ~15 people | Various | High | Visit signups |

### 3.2 Abba (Display Viewer)
- **Age:** 80
- **Tech Level:** Low
- **Need:** See who's coming today at a glance
- **Requirements:** Large text, simple interface, no interaction needed

### 3.3 Coordinators (שמריהו, ציפורה, שמשון)
- **Need:** Overview of week, gap alerts, ability to nudge family
- **Requirements:** Dashboard view, send reminders, view statistics

---

## 4. Feature Requirements

### 4.1 MVP (Phase 1) - Must Have

#### Scheduling Features
- [ ] Weekly calendar view with 3 daily slots (בוקר, צהריים, ערב)
- [ ] One-tap signup for available slots
- [ ] View who's signed up for each slot
- [ ] Cancel/modify own signups
- [ ] Activity notes (e.g., "לימוד טעמי המקרא", "עם הילדים")

#### Abba Display
- [ ] Large clock with current time
- [ ] Hebrew date (Jewish calendar) prominently displayed
- [ ] Today's schedule with visitor names
- [ ] Large photos or colored avatars for each family member
- [ ] Current/next visitor highlighted
- [ ] Auto-refresh every 5 minutes
- [ ] Fullscreen kiosk mode

#### Basic Notifications
- [ ] Confirmation when signing up
- [ ] Reminder day before visit
- [ ] Reminder morning of visit

#### Jewish Calendar
- [ ] Hebrew date display
- [ ] Day of week in Hebrew
- [ ] Shabbat candle lighting times (for Kfar Chabad)
- [ ] Havdalah times

### 4.2 Phase 2 - Should Have

#### Enhanced Scheduling
- [ ] Recurring visits (e.g., "לוי משה every Thursday evening")
- [ ] Swap requests between family members
- [ ] Coordinator can assign/reassign slots
- [ ] Multiple people per slot support

#### Coordinator Dashboard
- [ ] Weekly overview with gap highlighting
- [ ] Send reminder to WhatsApp group for empty slots
- [ ] Monthly statistics (visits per person)
- [ ] Export schedule to PDF/image for WhatsApp

#### Enhanced Display
- [ ] Parsha of the week on Shabbat
- [ ] Holiday names and greetings
- [ ] Special Shabbat mode (different colors)
- [ ] Family photos (uploadable)

#### Notifications
- [ ] Gap alerts to coordinators
- [ ] Weekly schedule summary to group
- [ ] Cancellation notifications

### 4.3 Phase 3 - Nice to Have

#### Advanced Features
- [ ] Video call scheduling integration (Zoom links)
- [ ] Photo sharing from visits
- [ ] Visit completion confirmation
- [ ] Comments/notes from visits
- [ ] Family event calendar (birthdays, yahrzeits)

#### Gamification
- [ ] Visit streak tracking
- [ ] Grandchildren encouragement ("points")
- [ ] Monthly "top visitor" recognition

#### Integrations
- [ ] Google Calendar sync
- [ ] WhatsApp group bot for quick signups
- [ ] Telegram bot alternative

---

## 5. Technical Architecture

### 5.1 Frontend Structure

```
src/
├── components/
│   ├── common/
│   │   ├── Avatar.jsx          # Family member avatar with photo/initials
│   │   ├── HebrewDate.jsx      # Hebrew date display component
│   │   ├── TimeSlot.jsx        # Individual time slot component
│   │   └── LoadingSpinner.jsx
│   ├── schedule/
│   │   ├── WeekView.jsx        # Main weekly calendar
│   │   ├── DayCard.jsx         # Single day with 3 slots
│   │   ├── SignupModal.jsx     # Signup flow modal
│   │   └── SlotDetails.jsx     # Slot information display
│   ├── display/
│   │   ├── AbbaDisplay.jsx     # Full-screen tablet display
│   │   ├── CurrentVisitor.jsx  # Large current visitor card
│   │   ├── Timeline.jsx        # Day timeline view
│   │   └── ShabbatInfo.jsx     # Candle lighting/havdalah
│   └── coordinator/
│       ├── Dashboard.jsx       # Coordinator overview
│       ├── GapAlerts.jsx       # Empty slot warnings
│       └── Statistics.jsx      # Visit statistics
├── hooks/
│   ├── useSchedule.js          # Schedule data fetching
│   ├── useHebrewDate.js        # Jewish calendar logic
│   ├── useRealtimeUpdates.js   # Supabase realtime subscription
│   └── useNotifications.js     # Push notification handling
├── lib/
│   ├── supabase.js             # Supabase client setup
│   ├── hebrew-calendar.js      # Hebcal wrapper functions
│   ├── notifications.js        # Notification utilities
│   └── constants.js            # App constants
├── pages/
│   ├── index.jsx               # Home → redirect to /schedule
│   ├── schedule.jsx            # Main scheduling interface
│   ├── display.jsx             # Abba display (tablet)
│   ├── coordinator.jsx         # Coordinator dashboard
│   └── settings.jsx            # User settings
└── styles/
    └── globals.css             # Tailwind + custom styles
```

### 5.2 Supabase Project Structure

```
supabase/
├── migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_add_recurring.sql
│   └── 003_add_notifications.sql
├── functions/
│   ├── send-reminder/          # Edge function for notifications
│   ├── weekly-summary/         # Generate weekly summary
│   └── gap-alert/              # Check for empty slots
└── seed.sql                    # Initial family member data
```

### 5.3 n8n Workflow Structure

```
workflows/
├── daily-reminders.json        # Morning + day-before reminders
├── gap-detection.json          # Sunday morning gap check
├── signup-confirmation.json    # Immediate signup confirmation
├── cancellation-alert.json     # Notify group of cancellations
└── weekly-summary.json         # Friday schedule summary
```

---

## 6. Data Models

### 6.1 Database Schema (PostgreSQL)

```sql
-- =============================================
-- FAMILY MEMBERS
-- =============================================
CREATE TABLE family_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_hebrew TEXT NOT NULL,              -- שמריהו
    name_english TEXT,                      -- Shmaryahu
    phone TEXT,                             -- +972-50-123-4567
    phone_normalized TEXT,                  -- 972501234567 (for WhatsApp)
    email TEXT,
    role TEXT CHECK (role IN ('sibling', 'spouse', 'grandchild', 'other')),
    is_coordinator BOOLEAN DEFAULT FALSE,
    avatar_color TEXT DEFAULT 'blue',       -- Tailwind color name
    avatar_gradient TEXT,                   -- e.g., 'from-blue-400 to-blue-600'
    photo_url TEXT,                         -- Optional photo URL
    timezone TEXT DEFAULT 'Asia/Jerusalem',
    notification_preferences JSONB DEFAULT '{"whatsapp": true, "sms": false, "email": false}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SLOT TEMPLATES (Weekly recurring structure)
-- =============================================
CREATE TABLE slot_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
    slot_name TEXT NOT NULL,                -- 'בוקר', 'צהריים', 'ערב'
    slot_name_english TEXT,                 -- 'morning', 'afternoon', 'evening'
    start_time TIME NOT NULL,               -- 07:00:00
    end_time TIME NOT NULL,                 -- 12:00:00
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default slots
INSERT INTO slot_templates (day_of_week, slot_name, slot_name_english, start_time, end_time) VALUES
(0, 'בוקר', 'morning', '07:00', '12:00'),
(0, 'צהריים', 'afternoon', '12:00', '16:00'),
(0, 'ערב', 'evening', '16:00', '20:00'),
(1, 'בוקר', 'morning', '07:00', '12:00'),
(1, 'צהריים', 'afternoon', '12:00', '16:00'),
(1, 'ערב', 'evening', '16:00', '20:00'),
(2, 'בוקר', 'morning', '07:00', '12:00'),
(2, 'צהריים', 'afternoon', '12:00', '16:00'),
(2, 'ערב', 'evening', '16:00', '20:00'),
(3, 'בוקר', 'morning', '07:00', '12:00'),
(3, 'צהריים', 'afternoon', '12:00', '16:00'),
(3, 'ערב', 'evening', '16:00', '20:00'),
(4, 'בוקר', 'morning', '07:00', '12:00'),
(4, 'צהריים', 'afternoon', '12:00', '16:00'),
(4, 'ערב', 'evening', '16:00', '20:00'),
(5, 'בוקר', 'morning', '07:00', '12:00'),
(5, 'צהריים', 'afternoon', '12:00', '16:00'),
-- Friday evening is Shabbat, no slot
(6, 'בוקר', 'morning', '07:00', '12:00'),
(6, 'צהריים', 'afternoon', '12:00', '16:00'),
(6, 'ערב', 'evening', '16:00', '20:00');

-- =============================================
-- VISITS (Actual scheduled visits)
-- =============================================
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_date DATE NOT NULL,
    slot_template_id UUID NOT NULL REFERENCES slot_templates(id),
    member_id UUID NOT NULL REFERENCES family_members(id),
    activity_notes TEXT,                    -- 'לימוד טעמי המקרא', 'עם הילדים'
    additional_visitors TEXT[],             -- ['שלומי', 'חנה']
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
    reminder_sent_day_before BOOLEAN DEFAULT FALSE,
    reminder_sent_morning BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    UNIQUE(slot_date, slot_template_id, member_id)
);

-- Index for quick lookups
CREATE INDEX idx_visits_date ON visits(slot_date);
CREATE INDEX idx_visits_member ON visits(member_id);
CREATE INDEX idx_visits_status ON visits(status);

-- =============================================
-- RECURRING VISITS
-- =============================================
CREATE TABLE recurring_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES family_members(id),
    slot_template_id UUID NOT NULL REFERENCES slot_templates(id),
    activity_notes TEXT,
    start_date DATE NOT NULL,
    end_date DATE,                          -- NULL = indefinite
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- FAMILY EVENTS (Birthdays, Yahrzeits, etc.)
-- =============================================
CREATE TABLE family_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name TEXT NOT NULL,               -- 'יום הולדת אבא'
    event_type TEXT CHECK (event_type IN ('birthday', 'yahrzeit', 'anniversary', 'holiday', 'other')),
    hebrew_date_month INT,                  -- 1-13 (Nisan=1, Adar II=13)
    hebrew_date_day INT,                    -- 1-30
    gregorian_date DATE,                    -- For non-Hebrew date events
    is_recurring BOOLEAN DEFAULT TRUE,
    notification_days_before INT DEFAULT 1,
    icon TEXT DEFAULT '📅',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Family events data
INSERT INTO family_events (event_name, event_type, hebrew_date_month, hebrew_date_day, icon) VALUES
('יום הולדת אבא', 'birthday', 10, 20, '🎂'),           -- כ׳ טבת
('יום השנה לאמא', 'yahrzeit', 10, 27, '🕯️'),          -- כ״ז טבת (adjust as needed)
('יארצייט סבתא ציפורה', 'yahrzeit', 11, 6, '🕯️');     -- ו׳ שבט

-- =============================================
-- NOTIFICATIONS LOG
-- =============================================
CREATE TABLE notification_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES family_members(id),
    visit_id UUID REFERENCES visits(id),
    notification_type TEXT NOT NULL,        -- 'reminder_day_before', 'reminder_morning', 'confirmation', 'gap_alert'
    channel TEXT NOT NULL,                  -- 'whatsapp', 'sms', 'email'
    message_content TEXT,
    status TEXT DEFAULT 'pending',          -- 'pending', 'sent', 'delivered', 'failed'
    external_id TEXT,                       -- Twilio message SID
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- APP SETTINGS
-- =============================================
CREATE TABLE app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO app_settings (key, value) VALUES
('location', '{"latitude": 31.9867, "longitude": 34.8436, "city": "כפר חב״ד", "timezone": "Asia/Jerusalem"}'),
('notification_times', '{"day_before": "20:00", "morning_of": "07:00", "gap_check": "10:00"}'),
('shabbat_settings', '{"candle_minutes_before": 18, "havdalah_minutes_after": 42}'),
('display_settings', '{"refresh_interval_seconds": 300, "show_shabbat_times_from_day": 5}');

-- =============================================
-- VIEWS
-- =============================================

-- Today's schedule view
CREATE VIEW today_schedule AS
SELECT 
    v.id as visit_id,
    v.slot_date,
    st.slot_name,
    st.start_time,
    st.end_time,
    fm.name_hebrew,
    fm.photo_url,
    fm.avatar_gradient,
    fm.role as member_role,
    v.activity_notes,
    v.additional_visitors,
    v.status
FROM visits v
JOIN slot_templates st ON v.slot_template_id = st.id
JOIN family_members fm ON v.member_id = fm.id
WHERE v.slot_date = CURRENT_DATE
  AND v.status = 'scheduled'
ORDER BY st.start_time;

-- Weekly schedule view
CREATE VIEW week_schedule AS
SELECT 
    v.slot_date,
    st.day_of_week,
    st.slot_name,
    st.start_time,
    st.end_time,
    fm.id as member_id,
    fm.name_hebrew,
    fm.photo_url,
    fm.avatar_gradient,
    v.activity_notes,
    v.status
FROM visits v
JOIN slot_templates st ON v.slot_template_id = st.id
JOIN family_members fm ON v.member_id = fm.id
WHERE v.slot_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
  AND v.status = 'scheduled'
ORDER BY v.slot_date, st.start_time;

-- Gap detection view (empty slots in next 7 days)
CREATE VIEW upcoming_gaps AS
SELECT 
    d.date as slot_date,
    st.id as slot_template_id,
    st.day_of_week,
    st.slot_name,
    st.start_time,
    st.end_time
FROM generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', '1 day'::interval) d(date)
CROSS JOIN slot_templates st
WHERE st.is_active = TRUE
  AND EXTRACT(DOW FROM d.date) = st.day_of_week
  AND NOT EXISTS (
      SELECT 1 FROM visits v 
      WHERE v.slot_date = d.date 
        AND v.slot_template_id = st.id 
        AND v.status = 'scheduled'
  )
  -- Exclude Friday evening and Saturday (Shabbat)
  AND NOT (EXTRACT(DOW FROM d.date) = 5 AND st.slot_name = 'ערב')
  AND NOT (EXTRACT(DOW FROM d.date) = 6)
ORDER BY d.date, st.start_time;

-- =============================================
-- ROW LEVEL SECURITY (Optional - if using Supabase Auth)
-- =============================================
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- Everyone can read
CREATE POLICY "Family members are viewable by everyone" ON family_members
    FOR SELECT USING (true);

CREATE POLICY "Visits are viewable by everyone" ON visits
    FOR SELECT USING (true);

-- Authenticated users can insert/update their own visits
CREATE POLICY "Users can manage their own visits" ON visits
    FOR ALL USING (true);  -- Simplified for family use
```

### 6.2 TypeScript Types

```typescript
// types/database.ts

export interface FamilyMember {
  id: string;
  name_hebrew: string;
  name_english?: string;
  phone?: string;
  phone_normalized?: string;
  email?: string;
  role: 'sibling' | 'spouse' | 'grandchild' | 'other';
  is_coordinator: boolean;
  avatar_color: string;
  avatar_gradient?: string;
  photo_url?: string;
  timezone: string;
  notification_preferences: {
    whatsapp: boolean;
    sms: boolean;
    email: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface SlotTemplate {
  id: string;
  day_of_week: number; // 0-6, 0=Sunday
  slot_name: 'בוקר' | 'צהריים' | 'ערב';
  slot_name_english: 'morning' | 'afternoon' | 'evening';
  start_time: string; // HH:MM:SS
  end_time: string;
  is_active: boolean;
}

export interface Visit {
  id: string;
  slot_date: string; // YYYY-MM-DD
  slot_template_id: string;
  member_id: string;
  activity_notes?: string;
  additional_visitors?: string[];
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  reminder_sent_day_before: boolean;
  reminder_sent_morning: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecurringVisit {
  id: string;
  member_id: string;
  slot_template_id: string;
  activity_notes?: string;
  start_date: string;
  end_date?: string;
  is_active: boolean;
}

export interface FamilyEvent {
  id: string;
  event_name: string;
  event_type: 'birthday' | 'yahrzeit' | 'anniversary' | 'holiday' | 'other';
  hebrew_date_month?: number;
  hebrew_date_day?: number;
  gregorian_date?: string;
  is_recurring: boolean;
  notification_days_before: number;
  icon: string;
}

// Enriched types for UI
export interface ScheduleSlot {
  date: string;
  dayOfWeek: number;
  slotName: string;
  startTime: string;
  endTime: string;
  visitor?: {
    id: string;
    name: string;
    photoUrl?: string;
    avatarGradient?: string;
    role: string;
  };
  activityNotes?: string;
  additionalVisitors?: string[];
  isEmpty: boolean;
}

export interface DaySchedule {
  date: string;
  hebrewDate: string;
  dayName: string;
  isShabbat: boolean;
  isHoliday: boolean;
  holidayName?: string;
  slots: ScheduleSlot[];
}

export interface HebrewDateInfo {
  day: number;
  dayHebrew: string; // א׳, ב׳, etc.
  month: string;
  monthHebrew: string;
  year: number;
  yearHebrew: string;
  fullDate: string; // כ״א טבת תשפ״ו
  parsha?: string;
  holiday?: string;
  isShabbat: boolean;
  candleLighting?: string;
  havdalah?: string;
}
```

---

## 7. API Endpoints

### 7.1 Supabase REST API Usage

All data access through Supabase client. Key operations:

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// FAMILY MEMBERS
// ==========================================

// Get all family members
export async function getFamilyMembers() {
  const { data, error } = await supabase
    .from('family_members')
    .select('*')
    .order('role', { ascending: true })
    .order('name_hebrew', { ascending: true });
  
  if (error) throw error;
  return data;
}

// ==========================================
// SCHEDULE
// ==========================================

// Get week schedule
export async function getWeekSchedule(startDate: string) {
  const endDate = addDays(new Date(startDate), 7).toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('week_schedule')
    .select('*')
    .gte('slot_date', startDate)
    .lt('slot_date', endDate);
  
  if (error) throw error;
  return data;
}

// Get today's schedule
export async function getTodaySchedule() {
  const { data, error } = await supabase
    .from('today_schedule')
    .select('*');
  
  if (error) throw error;
  return data;
}

// Sign up for a slot
export async function signUpForSlot(
  slotDate: string,
  slotTemplateId: string,
  memberId: string,
  activityNotes?: string,
  additionalVisitors?: string[]
) {
  const { data, error } = await supabase
    .from('visits')
    .insert({
      slot_date: slotDate,
      slot_template_id: slotTemplateId,
      member_id: memberId,
      activity_notes: activityNotes,
      additional_visitors: additionalVisitors,
      status: 'scheduled'
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Cancel a visit
export async function cancelVisit(visitId: string) {
  const { data, error } = await supabase
    .from('visits')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString()
    })
    .eq('id', visitId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Get upcoming gaps
export async function getUpcomingGaps() {
  const { data, error } = await supabase
    .from('upcoming_gaps')
    .select('*');
  
  if (error) throw error;
  return data;
}

// ==========================================
// REALTIME SUBSCRIPTIONS
// ==========================================

// Subscribe to schedule changes
export function subscribeToSchedule(callback: (payload: any) => void) {
  return supabase
    .channel('schedule-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'visits'
      },
      callback
    )
    .subscribe();
}
```

### 7.2 Edge Functions (Supabase Functions)

```typescript
// supabase/functions/send-reminder/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const TWILIO_WHATSAPP_FROM = Deno.env.get('TWILIO_WHATSAPP_FROM')!; // whatsapp:+14155238886

serve(async (req) => {
  const { visitId, reminderType } = await req.json();
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  // Get visit details
  const { data: visit } = await supabase
    .from('visits')
    .select(`
      *,
      family_members (*),
      slot_templates (*)
    `)
    .eq('id', visitId)
    .single();
  
  if (!visit) {
    return new Response(JSON.stringify({ error: 'Visit not found' }), { status: 404 });
  }
  
  // Build message
  const slotName = visit.slot_templates.slot_name;
  const date = new Date(visit.slot_date).toLocaleDateString('he-IL');
  
  let message = '';
  if (reminderType === 'day_before') {
    message = `תזכורת: מחר יש לך ביקור אצל אבא!\n📅 ${date}\n🕐 ${slotName} (${visit.slot_templates.start_time}-${visit.slot_templates.end_time})`;
  } else if (reminderType === 'morning') {
    message = `היום! ביקור אצל אבא 🏠\n🕐 ${slotName} (${visit.slot_templates.start_time}-${visit.slot_templates.end_time})\n\nהמשפחה אוהבת אותך! 💝`;
  }
  
  // Send via Twilio WhatsApp
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  
  const response = await fetch(twilioUrl, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      From: TWILIO_WHATSAPP_FROM,
      To: `whatsapp:${visit.family_members.phone_normalized}`,
      Body: message
    })
  });
  
  const result = await response.json();
  
  // Log notification
  await supabase.from('notification_log').insert({
    member_id: visit.member_id,
    visit_id: visitId,
    notification_type: reminderType,
    channel: 'whatsapp',
    message_content: message,
    status: response.ok ? 'sent' : 'failed',
    external_id: result.sid,
    sent_at: new Date().toISOString(),
    error_message: response.ok ? null : result.message
  });
  
  // Update visit reminder flag
  const updateField = reminderType === 'day_before' 
    ? { reminder_sent_day_before: true }
    : { reminder_sent_morning: true };
  
  await supabase
    .from('visits')
    .update(updateField)
    .eq('id', visitId);
  
  return new Response(JSON.stringify({ success: true, messageId: result.sid }));
});
```

---

## 8. User Interfaces

### 8.1 Family Scheduling App (Mobile PWA)

#### Screen: Week View (Main Screen)

```
┌─────────────────────────────────────────────────────────────┐
│  🏠 ביקורים אצל אבא                              ≡  ⚙️    │
│  ───────────────────────────────────────────────────────────│
│  שבוע פרשת שמות                            ◄  ינואר  ►    │
│  י״ט - כ״ה טבת תשפ״ו                                       │
│  ───────────────────────────────────────────────────────────│
│                                                             │
│  ⚠️ 3 משבצות ריקות השבוע                                   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ראשון 12.1 │ י״ט טבת                               │   │
│  │─────────────────────────────────────────────────────│   │
│  │ 🌅 בוקר     │ ציפורה ✓                             │   │
│  │ ☀️ צהריים   │ [+ הירשם]                 ← EMPTY    │   │
│  │ 🌆 ערב      │ שמריהו ✓                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ שני 13.1 │ כ׳ טבת 🎂 יום הולדת אבא!               │   │
│  │─────────────────────────────────────────────────────│   │
│  │ 🌅 בוקר     │ ציפורה ✓                             │   │
│  │ ☀️ צהריים   │ בתיה ✓  (עם הילדים)                  │   │
│  │ 🌆 ערב      │ לוי משה ✓                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ... (scrollable)                                           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [📅 השבוע]    [📊 סטטיסטיקה]    [👤 הפרופיל שלי]         │
└─────────────────────────────────────────────────────────────┘
```

#### Screen: Signup Modal (2 taps max)

```
┌─────────────────────────────────────────────────────────────┐
│                                                     ✕       │
│                                                             │
│              יום ראשון 12.1 │ י״ט טבת                       │
│              ☀️ צהריים (12:00-16:00)                        │
│                                                             │
│  ───────────────────────────────────────────────────────────│
│                                                             │
│  מי מגיע?                                                   │
│                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │   שמ    │  │   שש    │  │   בת    │  │   צפ    │        │
│  │ שמריהו  │  │ שמשון   │  │  בתיה   │  │ ציפורה  │        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
│                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │   מר    │  │   למ    │  │   אצ    │  │  + אחר  │        │
│  │  מרים   │  │ לוי משה │  │  איציק  │  │         │        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
│                                                             │
│  ───────────────────────────────────────────────────────────│
│                                                             │
│  פעילות מתוכננת (אופציונלי):                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  לימוד, עם הילדים, יציאה...                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  מגיעים נוספים:                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  שלומי, חנה...                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│           ┌─────────────────────────────┐                   │
│           │      ✓ אישור הרשמה         │                   │
│           └─────────────────────────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Abba Display (Tablet Kiosk)

#### Main Display Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   14:32                                                    🏠           │
│   יום שני                                           מי מבקר היום?       │
│   ───────────────────────────────────────────────────────────────────   │
│   כ׳ טבת תשפ״ו                              🎂 יום הולדת אבא!          │
│   13 ינואר 2026                                                        │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   🟢 עכשיו בביקור                                                       │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                                                                 │   │
│   │     ┌──────────┐                                                │   │
│   │     │          │      בתיה                                      │   │
│   │     │  [PHOTO] │      בת                                        │   │
│   │     │          │                                                │   │
│   │     └──────────┘      ☀️ צהריים (12:00-16:00)                   │   │
│   │                       📝 עם שלומי וחנה                          │   │
│   │                                                                 │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐   │
│   │  🌅 בוקר          │  │  ☀️ צהריים  🟢    │  │  🌆 ערב           │   │
│   │  7:00-12:00       │  │  12:00-16:00      │  │  16:00-20:00      │   │
│   │  ──────────────   │  │  ──────────────   │  │  ──────────────   │   │
│   │  ציפורה ✓         │  │  בתיה ✓           │  │  לוי משה ✓        │   │
│   │  (opacity: 50%)   │  │  עם שלומי וחנה    │  │                   │   │
│   └───────────────────┘  └───────────────────┘  └───────────────────┘   │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                              💝                                         │
│                    המשפחה אוהבת אותך!                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Shabbat Mode (Friday evening / Saturday)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  (Purple/Indigo gradient background)                                    │
│                                                                         │
│   18:45                                                    🏠           │
│   שבת קודש                                                              │
│   ───────────────────────────────────────────────────────────────────   │
│   כ״ה טבת תשפ״ו                                    📜 פרשת שמות         │
│   18 ינואר 2026                                                        │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│         🕯️ הדלקת נרות              ✨ צאת שבת                          │
│             16:32                      17:48                           │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                        ציפורה ומשפחה                                    │
│                                                                         │
│                     ┌──────────────────┐                                │
│                     │                  │                                │
│                     │     [PHOTO]      │                                │
│                     │                  │                                │
│                     └──────────────────┘                                │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                           🕯️ ✨ 🕯️                                      │
│                        שבת שלום!                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

### 8.3 Coordinator Dashboard

```
┌─────────────────────────────────────────────────────────────────────────┐
│  📊 לוח בקרה - מרכז/ת                                    שמריהו  ⚙️   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  סקירה שבועית (י״ט-כ״ה טבת)                                            │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  ⚠️ משבצות ריקות: 3                                            │    │
│  │  ──────────────────────────────────────────────────────────────│    │
│  │  • ראשון צהריים (12.1)                                         │    │
│  │  • רביעי ערב (15.1)                                            │    │
│  │  • חמישי בוקר (16.1)                                           │    │
│  │                                                                │    │
│  │  [ 📲 שלח תזכורת לקבוצת WhatsApp ]                             │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  📈 סטטיסטיקות החודש (טבת תשפ״ו)                               │    │
│  │  ──────────────────────────────────────────────────────────────│    │
│  │                                                                │    │
│  │  שמריהו     ████████████████  12 ביקורים  ⭐                  │    │
│  │  ציפורה    ██████████████████████████████  30 (יומי)          │    │
│  │  בתיה      ████████  6 ביקורים                                │    │
│  │  לוי משה   ████████  6 ביקורים                                │    │
│  │  שמשון     ████  4 ביקורים                                    │    │
│  │  מרים      ████  4 ביקורים                                    │    │
│  │  איציק     ██  2 שיחות Zoom                                   │    │
│  │                                                                │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  📅 אירועים קרובים                                             │    │
│  │  ──────────────────────────────────────────────────────────────│    │
│  │  🎂 כ׳ טבת (13.1) - יום הולדת אבא                              │    │
│  │  🕯️ כ״ז טבת (20.1) - יום השנה לאמא                            │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  [ 📤 ייצא לוח זמנים ]  [ 📊 דוח חודשי ]  [ ⚙️ הגדרות ]              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Notifications System

### 9.1 Notification Types

| Type | Trigger | Timing | Recipients | Channel |
|------|---------|--------|------------|---------|
| Signup Confirmation | User signs up | Immediate | Signer | WhatsApp |
| Day-Before Reminder | Scheduled | 20:00 day before | Visitor | WhatsApp |
| Morning Reminder | Scheduled | 07:00 same day | Visitor | WhatsApp |
| Cancellation Alert | User cancels | Immediate | Group chat | WhatsApp |
| Gap Alert | Cron job | Sunday 10:00 | Coordinators | WhatsApp |
| Weekly Summary | Cron job | Thursday 18:00 | All | WhatsApp Group |
| Family Event | Day before event | 10:00 | All | WhatsApp Group |

### 9.2 Message Templates (Hebrew)

```javascript
const messageTemplates = {
  signupConfirmation: (name, day, date, slot, time) => 
    `✓ ${name}, נרשמת לביקור!\n📅 יום ${day} ${date}\n🕐 ${slot} (${time})`,
  
  dayBeforeReminder: (name, day, date, slot, time) =>
    `תזכורת: מחר יש לך ביקור אצל אבא!\n📅 יום ${day} ${date}\n🕐 ${slot} (${time})\n\nאבא מחכה לך! 🏠`,
  
  morningReminder: (name, slot, time) =>
    `בוקר טוב ${name}! 🌅\nהיום יש לך ביקור אצל אבא\n🕐 ${slot} (${time})\n\nהמשפחה אוהבת אותך! 💝`,
  
  cancellationAlert: (name, day, date, slot) =>
    `⚠️ ${name} ביטל/ה את הביקור ביום ${day} ${date} (${slot})\nמישהו יכול להחליף?`,
  
  gapAlert: (gaps) =>
    `⚠️ יש ${gaps.length} משבצות ריקות השבוע:\n${gaps.map(g => `• ${g.day} ${g.slot}`).join('\n')}\n\nמי יכול למלא?`,
  
  weeklySummary: (schedule) =>
    `📅 לוח ביקורים לשבוע הקרוב:\n\n${schedule}\n\nשבוע טוב! 🏠`,
  
  familyEventReminder: (event, date) =>
    `📅 תזכורת: ${event}\n${date}\n\nלא לשכוח! 💝`
};
```

### 9.3 n8n Workflow: Daily Reminders

```json
{
  "name": "Daily Visit Reminders",
  "nodes": [
    {
      "name": "Cron Trigger",
      "type": "n8n-nodes-base.cron",
      "parameters": {
        "rule": {
          "interval": [
            { "field": "hours", "value": 7 },
            { "field": "hours", "value": 20 }
          ]
        }
      }
    },
    {
      "name": "Determine Reminder Type",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "const hour = new Date().getHours();\nreturn [{ reminderType: hour === 7 ? 'morning' : 'day_before' }];"
      }
    },
    {
      "name": "Fetch Pending Reminders",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://your-project.supabase.co/rest/v1/visits",
        "method": "GET",
        "qs": {
          "select": "*,family_members(*),slot_templates(*)",
          "status": "eq.scheduled",
          "reminder_sent_{{ $json.reminderType }}": "eq.false"
        }
      }
    },
    {
      "name": "Filter by Date",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "// Filter visits for tomorrow (day_before) or today (morning)"
      }
    },
    {
      "name": "Send WhatsApp",
      "type": "n8n-nodes-base.twilio",
      "parameters": {
        "operation": "sendSms",
        "from": "whatsapp:+14155238886",
        "to": "=whatsapp:{{ $json.family_members.phone_normalized }}",
        "message": "={{ $json.reminderMessage }}"
      }
    },
    {
      "name": "Update Reminder Flag",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://your-project.supabase.co/rest/v1/visits",
        "method": "PATCH"
      }
    }
  ]
}
```

---

## 10. Jewish Calendar Integration

### 10.1 Hebcal Library Usage

```typescript
// lib/hebrew-calendar.ts
import { HDate, HebrewCalendar, Location, Zmanim, months } from '@hebcal/core';

// Kfar Chabad location
const LOCATION = new Location(
  31.9867,  // latitude
  34.8436,  // longitude
  true,     // Israel
  'Asia/Jerusalem',
  'כפר חב״ד'
);

// Hebrew numerals
const hebrewNumerals: Record<number, string> = {
  1: 'א׳', 2: 'ב׳', 3: 'ג׳', 4: 'ד׳', 5: 'ה׳',
  6: 'ו׳', 7: 'ז׳', 8: 'ח׳', 9: 'ט׳', 10: 'י׳',
  11: 'י״א', 12: 'י״ב', 13: 'י״ג', 14: 'י״ד', 15: 'ט״ו',
  16: 'ט״ז', 17: 'י״ז', 18: 'י״ח', 19: 'י״ט', 20: 'כ׳',
  21: 'כ״א', 22: 'כ״ב', 23: 'כ״ג', 24: 'כ״ד', 25: 'כ״ה',
  26: 'כ״ו', 27: 'כ״ז', 28: 'כ״ח', 29: 'כ״ט', 30: 'ל׳'
};

const hebrewMonths: Record<string, string> = {
  'Nisan': 'ניסן', 'Iyyar': 'אייר', 'Sivan': 'סיון',
  'Tamuz': 'תמוז', 'Av': 'אב', 'Elul': 'אלול',
  'Tishrei': 'תשרי', 'Cheshvan': 'חשון', 'Kislev': 'כסלו',
  'Tevet': 'טבת', 'Shvat': 'שבט', 'Adar': 'אדר',
  'Adar I': 'אדר א׳', 'Adar II': 'אדר ב׳'
};

export function getHebrewDateInfo(date: Date = new Date()): HebrewDateInfo {
  const hdate = new HDate(date);
  
  const day = hdate.getDate();
  const monthName = hdate.getMonthName();
  const year = hdate.getFullYear();
  
  // Hebrew format
  const dayHebrew = hebrewNumerals[day] || day.toString();
  const monthHebrew = hebrewMonths[monthName] || monthName;
  const yearHebrew = numberToHebrewYear(year);
  
  // Holidays
  const holidays = HebrewCalendar.getHolidaysOnDate(hdate, true) || [];
  const holidayNames = holidays.map(h => h.getDesc('he')).filter(Boolean);
  
  // Parsha (on Shabbat)
  let parsha: string | undefined;
  if (date.getDay() === 6) {
    const sedra = HebrewCalendar.getSedra(year, true);
    const parshaList = sedra.get(hdate);
    if (parshaList?.length) {
      parsha = 'פרשת ' + parshaList.map(p => p.he).join('-');
    }
  }
  
  // Shabbat times
  let candleLighting: string | undefined;
  let havdalah: string | undefined;
  
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 5 || dayOfWeek === 6) {
    const friday = new Date(date);
    friday.setDate(date.getDate() - (dayOfWeek === 6 ? 1 : 0));
    
    const saturday = new Date(friday);
    saturday.setDate(friday.getDate() + 1);
    
    const zmanFriday = new Zmanim(LOCATION, friday, true);
    const zmanSaturday = new Zmanim(LOCATION, saturday, true);
    
    const sunset = zmanFriday.sunset();
    if (sunset) {
      const candleTime = new Date(sunset.getTime() - 18 * 60000);
      candleLighting = formatTime(candleTime);
    }
    
    const satSunset = zmanSaturday.sunset();
    if (satSunset) {
      const havdalahTime = new Date(satSunset.getTime() + 42 * 60000);
      havdalah = formatTime(havdalahTime);
    }
  }
  
  return {
    day,
    dayHebrew,
    month: monthName,
    monthHebrew,
    year,
    yearHebrew,
    fullDate: `${dayHebrew} ${monthHebrew} ${yearHebrew}`,
    parsha,
    holiday: holidayNames[0],
    isShabbat: dayOfWeek === 6,
    candleLighting,
    havdalah
  };
}

function numberToHebrewYear(year: number): string {
  // Simplified - just return common format for 5780s
  const lastDigits = year % 100;
  const tens = Math.floor(lastDigits / 10);
  const ones = lastDigits % 10;
  
  const tensMap: Record<number, string> = {
    8: 'פ', 9: 'צ'
  };
  const onesMap: Record<number, string> = {
    0: '', 1: 'א', 2: 'ב', 3: 'ג', 4: 'ד', 5: 'ה', 6: 'ו', 7: 'ז', 8: 'ח', 9: 'ט'
  };
  
  return `תש${tensMap[tens] || ''}${onesMap[ones] ? '״' + onesMap[ones] : ''}`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('he-IL', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
}

// Chabad special dates
export const chabadDates: Record<string, string> = {
  '9-19': 'י״ט כסלו - ראש השנה לחסידות',
  '10-5': 'ה׳ טבת - דידן נצח',
  '10-24': 'כ״ד טבת - יום ההילולא של אדה״ז',
  '11-10': 'י׳ שבט - יום ההילולא',
  '11-22': 'כ״ב שבט',
  '12-14': 'פורים קטן', // Adar I 14
  '13-14': 'פורים',     // Adar (II) 14
};

export function getChabadEvent(hdate: HDate): string | undefined {
  const key = `${hdate.getMonth()}-${hdate.getDate()}`;
  return chabadDates[key];
}
```

### 10.2 Family Events Configuration

```typescript
// config/family-events.ts

export const familyEvents = [
  {
    name: 'יום הולדת אבא',
    type: 'birthday',
    hebrewMonth: 10, // Tevet
    hebrewDay: 20,
    icon: '🎂',
    notifyDaysBefore: 3
  },
  {
    name: 'יום השנה לאמא',
    type: 'yahrzeit',
    hebrewMonth: 10, // Tevet
    hebrewDay: 27,
    icon: '🕯️',
    notifyDaysBefore: 1
  },
  {
    name: 'יארצייט סבתא ציפורה',
    type: 'yahrzeit',
    hebrewMonth: 11, // Shvat
    hebrewDay: 6,
    icon: '🕯️',
    notifyDaysBefore: 1
  },
  {
    name: 'יום הולדת איציק',
    type: 'birthday',
    hebrewMonth: 9, // Kislev
    hebrewDay: 19,
    icon: '🎂',
    notifyDaysBefore: 1
  }
];
```

---

## 11. Implementation Phases

### Phase 1: MVP (Week 1-2)

**Goal:** Basic scheduling + Abba display working

#### Week 1: Backend + Data
- [ ] Set up Supabase project
- [ ] Create database schema (tables, views)
- [ ] Seed family member data
- [ ] Test basic CRUD operations
- [ ] Set up Supabase realtime

#### Week 2: Frontend MVP
- [ ] Create React project with Vite + Tailwind
- [ ] Build WeekView component
- [ ] Build SignupModal component
- [ ] Build AbbaDisplay page
- [ ] Integrate Hebrew calendar (basic)
- [ ] Deploy to Vercel

**Deliverable:** Working app where family can sign up and Abba can see today's visitors

### Phase 2: Notifications (Week 3)

**Goal:** Automated reminders working

- [ ] Set up Twilio account + WhatsApp Business
- [ ] Create notification edge functions
- [ ] Set up n8n or alternative automation
- [ ] Build daily reminder workflows
- [ ] Test notification delivery
- [ ] Add notification preferences to settings

**Deliverable:** Family receives automatic reminders

### Phase 3: Polish (Week 4)

**Goal:** Production-ready system

- [ ] Coordinator dashboard
- [ ] Gap detection + alerts
- [ ] Recurring visits support
- [ ] Family photos upload
- [ ] Full Hebrew calendar (holidays, parsha)
- [ ] Shabbat mode for display
- [ ] PWA configuration (installable)
- [ ] Error handling + edge cases
- [ ] Performance optimization

**Deliverable:** Complete system ready for family rollout

### Phase 4: Enhancements (Future)

- [ ] Statistics and reporting
- [ ] WhatsApp group bot
- [ ] Video call integration
- [ ] Photo sharing from visits
- [ ] Multiple family support (multi-tenant)

---

## 12. Deployment & Infrastructure

### 12.1 Environment Variables

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# App
NEXT_PUBLIC_APP_URL=https://visits.lerner.family
```

### 12.2 Vercel Deployment

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/display",
      "headers": [
        { "key": "Cache-Control", "value": "no-store" }
      ]
    }
  ]
}
```

### 12.3 Tablet Setup for Abba Display

#### Hardware
- **Recommended:** Amazon Fire HD 10 (2023) or Samsung Galaxy Tab A8
- **Wall Mount:** Tablet wall mount bracket with charging
- **Power:** Long USB-C cable + wall adapter

#### Software Setup
1. Install **Fully Kiosk Browser** (Android)
2. Configure:
   - Start URL: `https://visits.lerner.family/display`
   - Fullscreen: ON
   - Screen timeout: NEVER
   - Auto-reload: Every 1 hour
   - Wake on motion: ON (if supported)
3. Lock to kiosk mode

### 12.4 Monitoring

```typescript
// Basic health check endpoint
// pages/api/health.ts

export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version
  });
}
```

---

## Appendix A: Initial Family Member Seed Data

```sql
-- seed.sql

INSERT INTO family_members (name_hebrew, name_english, role, is_coordinator, avatar_gradient, phone) VALUES
('שמריהו', 'Shmaryahu', 'sibling', true, 'from-blue-400 to-blue-600', '+972-50-XXX-XXXX'),
('שמשון', 'Shimshon', 'sibling', true, 'from-green-400 to-green-600', '+972-50-XXX-XXXX'),
('בתיה', 'Batya', 'sibling', false, 'from-purple-400 to-purple-600', '+972-50-XXX-XXXX'),
('ציפורה', 'Tziporah', 'sibling', true, 'from-pink-400 to-pink-600', '+972-50-XXX-XXXX'),
('מרים', 'Miriam', 'sibling', false, 'from-yellow-400 to-yellow-600', '+972-50-XXX-XXXX'),
('לוי משה', 'Levi Moshe', 'sibling', false, 'from-orange-400 to-orange-600', '+972-50-XXX-XXXX'),
('איציק', 'Itzik', 'sibling', false, 'from-teal-400 to-teal-600', '+1-XXX-XXX-XXXX');

-- Grandchildren / others (add as needed)
INSERT INTO family_members (name_hebrew, name_english, role, avatar_gradient) VALUES
('זאבי', 'Zeevi', 'grandchild', 'from-red-400 to-red-600'),
('לוי גולדברג', 'Levi Goldberg', 'grandchild', 'from-cyan-400 to-cyan-600'),
('ישראליק', 'Yisroelik', 'spouse', 'from-indigo-400 to-indigo-600');
```

---

## Appendix B: Design Tokens

```css
/* Tailwind config extensions */

colors: {
  // Shabbat mode
  shabbat: {
    bg: '#1e1b4b',      // Indigo-950
    accent: '#818cf8',   // Indigo-400
    text: '#e0e7ff'      // Indigo-100
  },
  // Hebrew calendar
  hebrew: {
    date: '#fbbf24',     // Amber-400
    holiday: '#a78bfa',  // Purple-400
    parsha: '#c084fc'    // Purple-400
  }
}

fontFamily: {
  hebrew: ['Heebo', 'sans-serif']
}
```

---

## Appendix C: Testing Checklist

### Functional Tests
- [ ] Sign up for slot → appears in schedule
- [ ] Cancel visit → slot becomes available
- [ ] Multiple people same slot → handled correctly
- [ ] Hebrew date displays correctly
- [ ] Shabbat times accurate for Kfar Chabad
- [ ] Notifications sent at correct times
- [ ] Display auto-refreshes
- [ ] Display works in fullscreen

### Edge Cases
- [ ] What happens at midnight (date change)?
- [ ] Leap year / Adar I / Adar II handling
- [ ] Timezone handling (Itzik in California)
- [ ] Network offline → graceful degradation
- [ ] Tablet loses power → auto-restart

### User Acceptance
- [ ] ציפורה can use the app easily
- [ ] אבא can read the display from across the room
- [ ] WhatsApp messages arrive correctly
- [ ] Hebrew text renders correctly everywhere

---

**End of Specification**

*Document prepared for Claude Code implementation. For questions, refer to the original requirements discussion.*
