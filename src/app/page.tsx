"use client";

import { useConvexAuth } from "convex/react";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  useEffect(() => {
    if (!isLoading) {
      redirect("/schedule");
    }
  }, [isLoading]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="animate-pulse text-2xl text-gray-500">טוען...</div>
    </main>
  );
}
