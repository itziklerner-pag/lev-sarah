"use client";

import { AbbaDisplay } from "@/components/display/abba-display";

/**
 * Abba Display Page - Kiosk mode for tablet at Abba's home
 *
 * Features:
 * - Shows today's visitors with large, readable fonts
 * - Auto-refreshes schedule every 5 minutes
 * - No login required (read-only display)
 * - Optimized for tablet viewing from 2 meters
 *
 * Usage:
 * - Open in kiosk mode on tablet browser
 * - Position tablet where Abba can easily see it
 * - Display will automatically update throughout the day
 */
export default function AbbaPage() {
  return <AbbaDisplay />;
}
