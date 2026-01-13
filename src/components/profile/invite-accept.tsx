"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface InviteAcceptProps {
  inviteName: string;
  inviteRelationship: string;
  onAccepted: () => void;
}

export function InviteAccept({ inviteName, inviteRelationship, onAccepted }: InviteAcceptProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptInvite = useMutation(api.users.acceptInvite);

  const handleAccept = async () => {
    setIsAccepting(true);
    setError(null);

    try {
      await acceptInvite();
      onAccepted();
    } catch (err: any) {
      setError(err.message || "שגיאה בקבלת ההזמנה");
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-10 h-10 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">ברוכים הבאים!</h1>
        <p className="text-gray-600 mb-6">
          שלום {inviteName}, הוזמנת להצטרף למערכת הביקורים המשפחתית אצל אבא
        </p>

        <div className="bg-blue-50 rounded-xl p-4 mb-6">
          <div className="text-sm text-gray-600 mb-1">קרבה</div>
          <div className="text-lg font-medium text-blue-800">{inviteRelationship}</div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleAccept}
          disabled={isAccepting}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isAccepting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              מצטרף...
            </span>
          ) : (
            "הצטרף למערכת"
          )}
        </button>

        <p className="text-xs text-gray-400 mt-4">
          בשלב הבא תוכל להעלות תמונה שלך
        </p>
      </div>
    </div>
  );
}
