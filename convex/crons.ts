import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * Process pending notifications every 5 minutes
 * Sends WhatsApp messages for notifications that are due
 */
crons.interval(
  "process pending notifications",
  { minutes: 5 },
  internal.notifications.processPendingNotifications
);

/**
 * Detect gaps in schedule daily at 9 AM Israel time
 * Alerts coordinators about days with no scheduled visits
 */
crons.cron(
  "daily gap detection",
  // Run at 9:00 AM Israel time (6:00 UTC in winter, 5:00 UTC in summer)
  // Using 6:00 UTC as a safe default
  "0 6 * * *",
  internal.scheduler.detectGaps
);

/**
 * Weekly reminder to low-activity family members
 * Runs every Sunday at 10 AM Israel time
 */
crons.cron(
  "weekly activity nudge",
  // Sunday 10 AM Israel (7:00 UTC)
  "0 7 * * 0",
  internal.scheduler.weeklyActivityNudge
);

// TODO: Uncomment after first deploy (types need to be generated)
// /**
//  * Clean up expired magic link tokens daily
//  * Removes tokens that have been expired for more than 24 hours
//  * Runs at 3:00 AM Israel time (0:00 UTC)
//  */
// crons.cron(
//   "cleanup expired magic link tokens",
//   "0 0 * * *",
//   internal.magicLink.cleanupExpiredTokens
// );

export default crons;
