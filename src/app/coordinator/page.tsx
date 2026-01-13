"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { Avatar } from "../../components/common/avatar";
import { Id } from "../../../convex/_generated/dataModel";
import clsx from "clsx";

/**
 * Coordinator Dashboard
 * Shows weekly overview, gap alerts, family statistics, and nudge controls
 */
export default function CoordinatorPage() {
  const stats = useQuery(api.coordinator.getStats);
  const gaps = useQuery(api.coordinator.getGaps, { daysAhead: 14 });
  const familyMembers = useQuery(api.coordinator.getFamilyMembers);
  const notifications = useQuery(api.coordinator.getNotificationHistory, {
    limit: 10,
  });

  const sendNudge = useMutation(api.notifications.sendNudge);
  const [nudgingId, setNudgingId] = useState<string | null>(null);

  // Check if user is coordinator
  if (stats === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            גישה מוגבלת
          </h1>
          <p className="text-gray-600">
            עמוד זה זמין למרכזים בלבד
          </p>
        </div>
      </div>
    );
  }

  const handleSendNudge = async (profileId: Id<"familyProfiles">, name: string) => {
    setNudgingId(profileId);
    try {
      await sendNudge({
        targetUserId: profileId,
        message: `שלום ${name}! אבא מחכה לביקור שלך. בואו לבקר!`,
      });
      alert("תזכורת נשלחה בהצלחה!");
    } catch (error) {
      alert("שגיאה בשליחת התזכורת");
    } finally {
      setNudgingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">לוח בקרה</h1>
          <p className="text-sm text-gray-500">ניהול ביקורים אצל אבא</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="כיסוי שבועי"
              value={`${stats.upcomingWeek.coverage}%`}
              subtitle={`${stats.upcomingWeek.booked} מתוך ${stats.upcomingWeek.totalSlots}`}
              color="blue"
            />
            <StatCard
              title="בני משפחה פעילים"
              value={stats.familyActivity.activeMembers}
              subtitle={`מתוך ${stats.familyActivity.totalMembers}`}
              color="green"
            />
            <StatCard
              title="התראות ממתינות"
              value={stats.notifications.pending}
              color="yellow"
            />
            <StatCard
              title="התראות שנכשלו"
              value={stats.notifications.failed}
              color={stats.notifications.failed > 0 ? "red" : "gray"}
            />
          </div>
        )}

        {/* Gap Analysis */}
        <section className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            סקירת שבועיים הקרובים
          </h2>

          {gaps === undefined ? (
            <div className="animate-pulse space-y-2">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {gaps.map((day) => (
                <DayRow
                  key={day.date}
                  date={day.date}
                  displayDate={day.displayDate}
                  isShabbat={day.isShabbat}
                  isGap={day.isGap}
                  coverage={day.coverage}
                  slots={day.slots}
                />
              ))}
            </div>
          )}
        </section>

        {/* Family Members */}
        <section className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            בני משפחה
          </h2>

          {familyMembers === undefined ? (
            <div className="animate-pulse space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {familyMembers
                .sort((a, b) => (a.daysSinceLastVisit ?? 999) - (b.daysSinceLastVisit ?? 999))
                .reverse()
                .map((member) => (
                  <div
                    key={member._id}
                    className="py-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={member.name}
                        hebrewName={member.hebrewName}
                        gradient={member.avatarGradient}
                        size="md"
                      />
                      <div>
                        <span className="font-medium">{member.name}</span>
                        <div className="text-sm text-gray-500">
                          {member.daysSinceLastVisit !== null
                            ? `ביקור אחרון: לפני ${member.daysSinceLastVisit} ימים`
                            : "לא ביקר עדיין"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={clsx(
                          "text-xs px-2 py-1 rounded-full",
                          member.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        )}
                      >
                        {member.isActive ? "פעיל" : "לא פעיל"}
                      </span>

                      {!member.isActive && (
                        <button
                          onClick={() =>
                            handleSendNudge(member._id, member.name)
                          }
                          disabled={nudgingId === member._id}
                          className={clsx(
                            "px-3 py-1 text-sm rounded-lg transition-colors",
                            nudgingId === member._id
                              ? "bg-gray-100 text-gray-400"
                              : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                          )}
                        >
                          {nudgingId === member._id ? "שולח..." : "שלח תזכורת"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>

        {/* Recent Notifications */}
        <section className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            התראות אחרונות
          </h2>

          {notifications === undefined ? (
            <div className="animate-pulse space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <p className="text-gray-500 text-center py-4">אין התראות</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div key={notification._id} className="py-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {notification.userProfile && (
                      <Avatar
                        name={notification.userProfile.name}
                        hebrewName={notification.userProfile.hebrewName}
                        gradient={notification.userProfile.avatarGradient}
                        size="sm"
                      />
                    )}
                    <div>
                      <span className="text-sm font-medium">
                        {notification.userProfile?.name || "משתמש לא ידוע"}
                      </span>
                      <div className="text-xs text-gray-500">
                        {getNotificationTypeLabel(notification.type)}
                      </div>
                    </div>
                  </div>

                  <span
                    className={clsx(
                      "text-xs px-2 py-1 rounded-full",
                      notification.status === "sent"
                        ? "bg-green-100 text-green-700"
                        : notification.status === "failed"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    )}
                  >
                    {getStatusLabel(notification.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

/**
 * Stat card component
 */
function StatCard({
  title,
  value,
  subtitle,
  color,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  color: "blue" | "green" | "yellow" | "red" | "gray";
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    yellow: "bg-yellow-50 text-yellow-700",
    red: "bg-red-50 text-red-700",
    gray: "bg-gray-50 text-gray-700",
  };

  return (
    <div className={clsx("rounded-xl p-4", colorClasses[color])}>
      <div className="text-sm opacity-80">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
      {subtitle && <div className="text-xs opacity-70">{subtitle}</div>}
    </div>
  );
}

/**
 * Day row in gap analysis
 */
function DayRow({
  date,
  displayDate,
  isShabbat,
  isGap,
  coverage,
  slots,
}: {
  date: string;
  displayDate: string;
  isShabbat: boolean;
  isGap: boolean;
  coverage: number | null;
  slots: {
    morning: any;
    afternoon: any;
    evening: any;
  };
}) {
  const slotNames = {
    morning: "בוקר",
    afternoon: "צהריים",
    evening: "ערב",
  };

  return (
    <div
      className={clsx(
        "rounded-lg p-3 border",
        isShabbat
          ? "bg-gray-50 border-gray-200"
          : isGap
          ? "bg-red-50 border-red-200"
          : "bg-white border-gray-200"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium">{displayDate}</span>
        {isShabbat ? (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            שבת
          </span>
        ) : isGap ? (
          <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">
            אין ביקורים!
          </span>
        ) : (
          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
            {coverage}/3 משבצות
          </span>
        )}
      </div>

      {!isShabbat && (
        <div className="flex gap-2">
          {(["morning", "afternoon", "evening"] as const).map((slotKey) => {
            const slot = slots[slotKey];
            const isBooked = slot?.bookedBy;

            return (
              <div
                key={slotKey}
                className={clsx(
                  "flex-1 text-xs p-2 rounded text-center",
                  isBooked
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-500"
                )}
              >
                <div className="font-medium">{slotNames[slotKey]}</div>
                {isBooked && slot?.bookedByProfile && (
                  <div className="truncate mt-1">
                    {slot.bookedByProfile.name}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getNotificationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    confirmation: "אישור הרשמה",
    reminder: "תזכורת",
    gap_alert: "התראת פער",
    nudge: "תזכורת אישית",
  };
  return labels[type] || type;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "ממתין",
    sent: "נשלח",
    failed: "נכשל",
  };
  return labels[status] || status;
}
