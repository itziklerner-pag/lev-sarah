"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useConvexAuth } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PhoneLogin } from "../../../components/auth/phone-login";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const invite = useQuery(api.admin.getInviteByCode, { code });
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If invite is already accepted or user is already registered, redirect
  useEffect(() => {
    if (invite?.status === "accepted") {
      router.push("/schedule");
    }
  }, [invite, router]);

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100" dir="rtl">
        <div className="animate-pulse text-2xl text-gray-500">טוען...</div>
      </main>
    );
  }

  if (invite === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100" dir="rtl">
        <div className="animate-pulse text-2xl text-gray-500">טוען הזמנה...</div>
      </main>
    );
  }

  if (invite === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100" dir="rtl">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-4 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">הזמנה לא נמצאה</h1>
          <p className="text-gray-600 mb-6">
            הקישור לא תקין או שההזמנה כבר לא קיימת.
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-3 px-6 rounded-xl transition-colors"
          >
            לדף הבית
          </button>
        </div>
      </main>
    );
  }

  if (invite.status === "accepted") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100" dir="rtl">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-4 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">ההזמנה כבר מומשה</h1>
          <p className="text-gray-600 mb-6">
            ההזמנה הזו כבר נוצלה. אם זה אתה, אתה יכול להתחבר.
          </p>
          <button
            onClick={() => router.push("/schedule")}
            className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-3 px-6 rounded-xl transition-colors"
          >
            למערכת
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">💛</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">לב שרה</h1>
          <p className="text-gray-500">מערכת תיאום ביקורים משפחתית</p>
        </div>

        {/* Invite Details */}
        <div className="bg-amber-50 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 text-center">
            הוזמנת להצטרף!
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">שם:</span>
              <span className="font-medium text-gray-800">{invite.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">קרבה:</span>
              <span className="font-medium text-gray-800">{invite.relationship}</span>
            </div>
            {invite.isAdminInvite && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500">תפקיד:</span>
                <span className="font-medium text-amber-600">מנהל מערכת</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4 text-center">
            {error}
          </div>
        )}

        {!isAuthenticated ? (
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              להתחברות והצטרפות למערכת
            </p>
            <PhoneLogin />
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              אתה מחובר! לחץ להשלמת ההרשמה
            </p>
            <button
              onClick={() => router.push("/schedule")}
              disabled={accepting}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white font-medium py-4 px-6 rounded-xl transition-colors text-lg"
            >
              {accepting ? "מעבד..." : "כניסה למערכת"}
            </button>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-gray-400 text-sm mt-6">
          מערכת לתיאום ביקורים אצל אבא
        </p>
      </div>
    </main>
  );
}
