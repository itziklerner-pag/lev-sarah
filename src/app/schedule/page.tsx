"use client";

import { useConvexAuth } from "convex/react";

export default function SchedulePage() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-2xl text-gray-500">טוען...</div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
        <h1 className="text-3xl font-bold">לב שרה</h1>
        <p className="text-gray-600">תורנות ביקורים אצל אבא</p>
        <p className="text-sm text-gray-500">אנא התחבר כדי להמשיך</p>
        {/* Auth component will be added in Phase 1 */}
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">לוח ביקורים</h1>
      </header>
      {/* WeekView component will be added in Phase 2 */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center text-gray-500">
        לוח הביקורים יופיע כאן
      </div>
    </main>
  );
}
